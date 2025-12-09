import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  // Clear auth cookies
  (await cookies()).set("accessToken", "", { maxAge: 0 });
  (await cookies()).set("refreshToken", "", { maxAge: 0 });

  return NextResponse.json({ success: true });
}
