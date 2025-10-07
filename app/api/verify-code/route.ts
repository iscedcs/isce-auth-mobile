import { AUTH_API, URLS } from "@/lib/const";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const url = `${AUTH_API}${URLS.auth.verify_code}`;

    const { email, code } = await req.json();
    const payload = {
      email,
      code,
    };
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to verify OTP" },
        { status: 400 }
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    console.log("POST OTP Verification failed", e);
    return NextResponse.json(
      { error: "Invalid request", details: e },
      { status: 400 }
    );
  }
}
