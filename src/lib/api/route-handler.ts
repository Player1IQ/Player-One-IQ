import { NextResponse } from "next/server";
import { authenticateApiRequest } from "./auth";
import { apiError, apiSuccess } from "./responses";

const MAX_API_BODY_BYTES = 64 * 1024;

export type ApiMutationResult<T> =
  | { kind: "success"; data: T }
  | { kind: "not_found" }
  | { kind: "error"; status: number; code: string; error: string };

async function parseJsonBody(
  request: Request
): Promise<
  | { ok: true; body: unknown }
  | { ok: false; response: NextResponse }
> {
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_API_BODY_BYTES) {
    return {
      ok: false,
      response: apiError(400, "payload_too_large", "Request body too large."),
    };
  }

  let text: string;
  try {
    text = await request.text();
  } catch {
    return {
      ok: false,
      response: apiError(400, "invalid_body", "Unable to read request body."),
    };
  }

  if (text.length > MAX_API_BODY_BYTES) {
    return {
      ok: false,
      response: apiError(400, "payload_too_large", "Request body too large."),
    };
  }

  if (!text.trim()) {
    return {
      ok: false,
      response: apiError(400, "invalid_json", "Request body is required."),
    };
  }

  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return {
      ok: false,
      response: apiError(400, "invalid_json", "Invalid JSON body."),
    };
  }
}

async function handleAuthenticatedApiMutation<T>(
  request: Request,
  handler: (organizationId: string, body: unknown) => Promise<ApiMutationResult<T>>,
  notFoundMessage: string
): Promise<NextResponse> {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    return apiError(auth.status, auth.code, auth.error);
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return parsed.response;
  }

  const result = await handler(auth.organizationId, parsed.body);
  if (result.kind === "not_found") {
    return apiError(404, "not_found", notFoundMessage);
  }
  if (result.kind === "error") {
    return apiError(result.status, result.code, result.error);
  }

  return apiSuccess(auth.organizationId, result.data);
}

export async function handleAuthenticatedApiGet<T>(
  request: Request,
  handler: (organizationId: string) => Promise<T>
): Promise<NextResponse> {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    return apiError(auth.status, auth.code, auth.error);
  }

  const data = await handler(auth.organizationId);
  return apiSuccess(auth.organizationId, data);
}

export async function handleAuthenticatedApiGetById<T>(
  request: Request,
  handler: (organizationId: string) => Promise<T | null>,
  notFoundMessage = "Resource not found."
): Promise<NextResponse> {
  const auth = await authenticateApiRequest(request);
  if (!auth.ok) {
    return apiError(auth.status, auth.code, auth.error);
  }

  const data = await handler(auth.organizationId);
  if (data === null) {
    return apiError(404, "not_found", notFoundMessage);
  }

  return apiSuccess(auth.organizationId, data);
}

export async function handleAuthenticatedApiPatch<T>(
  request: Request,
  handler: (organizationId: string, body: unknown) => Promise<ApiMutationResult<T>>,
  notFoundMessage = "Resource not found."
): Promise<NextResponse> {
  return handleAuthenticatedApiMutation(request, handler, notFoundMessage);
}

export async function handleAuthenticatedApiPost<T>(
  request: Request,
  handler: (organizationId: string, body: unknown) => Promise<ApiMutationResult<T>>,
  notFoundMessage = "Resource not found."
): Promise<NextResponse> {
  return handleAuthenticatedApiMutation(request, handler, notFoundMessage);
}
