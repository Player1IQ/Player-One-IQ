import type { NextResponse } from "next/server";
import { authenticateApiRequest } from "./auth";
import { apiError, apiSuccess } from "./responses";

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
