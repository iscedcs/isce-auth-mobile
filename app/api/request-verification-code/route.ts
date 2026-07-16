"use server";
import { AUTH_API, URLS } from "@/lib/const";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const url = `${AUTH_API}${URLS.auth.request_verification_code}`;
    const { email } = await req.json();
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Forward the backend's actual message so the client can surface it
      const message =
        (Array.isArray(data?.message)
          ? data.message.filter(Boolean).join(", ")
          : data?.message) ||
        data?.error ||
        "Failed to send verification code";
      return NextResponse.json({ error: message }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (e) {
    console.error("Email OTP Request POST error", e);
    return NextResponse.json(
      { error: "Failed to send verification code. Please try again." },
      { status: 500 }
    );
  }
}
