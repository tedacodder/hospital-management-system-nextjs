import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError, type ZodSchema } from "zod";

// Every API route in this application answers with one of two shapes:
//
//   success  { data: T, meta?: { page, pageSize, total, totalPages } }
//   failure  { error: { message: string, fields?: Record<string, string[]> } }
//
// Clients can therefore branch on the presence of `error` alone.

export type ApiMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function ok<T>(data: T, init?: { status?: number; meta?: ApiMeta }) {
  return NextResponse.json(
    init?.meta ? { data, meta: init.meta } : { data },
    { status: init?.status ?? 200 },
  );
}

export function created<T>(data: T) {
  return ok(data, { status: 201 });
}

export function failure(
  status: number,
  message: string,
  fields?: Record<string, string[]>,
) {
  return NextResponse.json({ error: { message, fields } }, { status });
}

/// Maps any thrown value onto a safe response. Internal details are logged
/// server-side and never returned to the caller — a stack trace or a Prisma
/// error message can disclose schema internals.
export function toErrorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return failure(err.status, err.message, err.fields);
  }

  if (err instanceof ZodError) {
    return failure(422, "Validation failed", err.flatten().fieldErrors as Record<string, string[]>);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return failure(409, "A record with those details already exists");
      case "P2003":
        return failure(409, "Related record does not exist");
      case "P2025":
        return failure(404, "Record not found");
      default:
        break;
    }
  }

  console.error("[api] unhandled error:", err);
  return failure(500, "Something went wrong. Please try again.");
}

/// Wraps a route handler so that thrown HttpErrors, Zod errors and Prisma
/// errors all become correct responses without a try/catch in every file.
/// Widened to `Response` rather than `NextResponse` so a route can return a
/// raw binary response (file downloads, a 204 with no body) without needing
/// `NextResponse`'s extra surface. `ok`/`created`/`failure` already return
/// `NextResponse`, which is a `Response`, so every existing handler still
/// type-checks unchanged.
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/// Parses and validates a JSON body, throwing a 400/422 rather than crashing.
export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON");
  }
  return schema.parse(json);
}

/// Parses query parameters against a schema.
export function parseQuery<T>(req: Request, schema: ZodSchema<T>): T {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params);
}

export function buildMeta(page: number, pageSize: number, total: number): ApiMeta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/// Parses a route segment that must be a positive integer id.
export function parseId(raw: string | undefined, label = "id"): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return n;
}
