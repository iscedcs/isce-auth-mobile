"use server";
import { AUTH_API, URLS } from "@/lib/const";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const url = `${AUTH_API}${URLS.auth.request_verification_code}`;
    //   const payload = { email };
    const { email } = await req.json();
    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    // console.log({ data });
    if (data.statusCode === 500) {
      return NextResponse.json(
        { error: "This email is already being used." },
        { status: 500 }
      );
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.log("Email OTP Request POST error", e);
    return NextResponse.json(
      { error: "Invalid request", details: e },
      { status: 400 }
    );
  }
}
