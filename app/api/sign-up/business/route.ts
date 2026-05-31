"use server";

import { AUTH_API, URLS } from "@/lib/const";
import { extendedSignUpSchema } from "@/schemas/mobile/sign-up";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const raw = await req.json();

    const normalized = {
      ...raw,
      phoneNumber: raw.phone ?? raw.phoneNumber,
      dob: new Date(raw.dob),
      passwordObj: {
        password: raw.password,
        confirmPassword: raw.confirmpassword ?? raw.password,
      },
    };

    const b = extendedSignUpSchema.parse(normalized);

    const payload = {
      firstName: b.firstName,
      lastName: b.lastName,
      phone: b.phoneNumber,
      email: b.email,
      dob: b.dob,
      address: b.address,
      businessName: b.businessName,
      businessEmail: b.businessEmail,
      identificationType: b.identificationType,
      idNumber: b.idNumber ?? null,
      position: b.position ?? null,
      password: b.passwordObj.password,
      confirmpassword: b.passwordObj.confirmPassword,
    };

    const url = `${AUTH_API}${URLS.auth.sign_up_business}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to create business account", details: data },
        { status: res.status || 400 },
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.log("Business sign-up error", e);
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 },
    );
  }
}
