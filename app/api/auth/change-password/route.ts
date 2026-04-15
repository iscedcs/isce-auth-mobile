import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const AUTH_API =
  process.env.AUTH_API_URL ?? process.env.NEXT_PUBLIC_AUTH_API_URL;

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("isce_auth_token")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Unauthorised" },
      { status: 401 },
    );
  }

  const body = await req.json();

  const upstream = await fetch(`${AUTH_API}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
}
