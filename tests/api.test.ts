import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";
import { Prisma } from "@prisma/client";
import { HttpError, buildMeta, parseId, toErrorResponse } from "@/lib/api";

async function bodyOf(res: Response) {
  return res.json();
}

describe("toErrorResponse", () => {
  it("maps HttpError to its own status and message", async () => {
    const res = toErrorResponse(new HttpError(403, "Forbidden"));
    expect(res.status).toBe(403);
    expect(await bodyOf(res)).toEqual({ error: { message: "Forbidden", fields: undefined } });
  });

  it("maps a ZodError to 422 with field errors", async () => {
    const schema = z.object({ email: z.string().email() });
    const result = schema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    if (result.success) return;

    const res = toErrorResponse(result.error);
    expect(res.status).toBe(422);
    const body = await bodyOf(res);
    expect(body.error.fields.email).toBeDefined();
  });

  it("maps a unique-constraint violation (P2002) to 409", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "test",
    });
    const res = toErrorResponse(err);
    expect(res.status).toBe(409);
  });

  it("maps a not-found (P2025) to 404", async () => {
    const err = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "test",
    });
    const res = toErrorResponse(err);
    expect(res.status).toBe(404);
  });

  it("never leaks an unrecognized error's message to the client", async () => {
    const res = toErrorResponse(new Error("column \"ssn\" does not exist"));
    expect(res.status).toBe(500);
    const body = await bodyOf(res);
    expect(body.error.message).not.toContain("ssn");
    expect(body.error.message).toBe("Something went wrong. Please try again.");
  });
});

describe("parseId", () => {
  it("accepts a positive integer string", () => {
    expect(parseId("42")).toBe(42);
  });

  it.each(["0", "-1", "abc", "1.5", undefined])("rejects %s", (value) => {
    expect(() => parseId(value)).toThrow(HttpError);
  });
});

describe("buildMeta", () => {
  it("computes total pages, rounding up", () => {
    expect(buildMeta(1, 20, 45)).toEqual({ page: 1, pageSize: 20, total: 45, totalPages: 3 });
  });

  it("never reports fewer than one total page, even with zero results", () => {
    expect(buildMeta(1, 20, 0).totalPages).toBe(1);
  });
});
