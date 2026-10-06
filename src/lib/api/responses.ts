import { NextResponse } from "next/server";

export function apiSuccess<T>(organizationId: string, data: T) {
  return NextResponse.json({
    data,
    meta: { organization_id: organizationId },
  });
}

export function apiError(
  status: number,
  code: string,
  error: string,
  headers?: HeadersInit
) {
  return NextResponse.json({ error, code }, { status, headers });
}
