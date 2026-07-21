"use server";

import { AUTH_API, URLS } from "@/lib/const";
import { AuthService } from "@/lib/auth-service";
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
      businessName: b.businessName,
      businessEmail: b.businessEmail,
      identificationType: b.identificationType,
      idNumber: b.idNumber || raw.idNumber || "string",
      position: b.position || raw.position || "string",
      businessAddress: b.businessAddress || raw.businessAddress || b.address || "string",
      displayPicture: raw.displayPicture || raw.profilePhoto || "string",
      dob: (typeof raw.dob === "string" && raw.dob) || (b.dob instanceof Date ? `${String(b.dob.getMonth() + 1).padStart(2, '0')}/${String(b.dob.getDate()).padStart(2, '0')}/${b.dob.getFullYear()}` : "mm/dd/yyyy"),
      address: b.address,
      password: b.passwordObj.password,
      confirmpassword: b.passwordObj.confirmPassword,
      referralCode: b.referralCode || raw.referralCode || raw.referralUsername || null,
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

    const userData = data?.data || data?.user || data;
    const newUserId =
      userData?.id ||
      userData?.userId ||
      userData?._id ||
      userData?.user_id ||
      data?.id ||
      data?.userId ||
      data?._id ||
      data?.user_id ||
      null;
    const referralUsername = payload.referralCode || null;

    if (newUserId && referralUsername) {
      const attachRes = await AuthService.attachReferral({
        newUserId: String(newUserId),
        referralUsername: String(referralUsername).trim(),
      });
      console.log("Business referral attach attempt result:", attachRes);
    } else if (referralUsername) {
      console.warn("Skipping attachReferral because newUserId could not be found in business response data:", data);
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
