// One thin wrapper around fetch that understands the { data } / { error }
// envelope every API route returns. Components never touch `fetch` directly,
// so the envelope shape only needs to be handled once.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.error?.message ?? "Something went wrong. Please try again.";
    throw new ApiError(message, res.status, json?.error?.fields);
  }

  return json?.data as T;
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const qs = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][],
      ).toString()
    : "";
  const res = await fetch(`/api${path}${qs}`, { credentials: "include" });
  return unwrap<T>(res);
}

export async function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return unwrap<T>(res);
}
