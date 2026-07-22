"use server";

import { AUTH_API, URLS } from "@/lib/const";
import { AuthService } from "@/lib/auth-service";

import { userType } from "@/lib/types/auth";
import {
  extendedSignUpSchema,
  signUpForIndividualSchema,
} from "@/schemas/mobile/sign-up";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const raw = await req.json();

    // prefer the query param, but fall back to body
    const url = new URL(req.url);
    const userType =
      (url.searchParams.get("userType") as userType) ||
      (raw.userType as userType) ||
      "USER";

    // normalize input (don’t mutate raw in place; create a shaped copy)
    const normalized = {
      ...raw,
      phoneNumber: raw.phone ?? raw.phoneNumber,
      moi: raw.identificationType ?? raw.moi,
      dob: new Date(raw.dob),
      profilePhoto: raw.displayPicture ?? raw.profilePhoto,
      passwordObj: {
        password: raw.password,
        confirmPassword: raw.confirmpassword,
      },
    };

    if (userType === "USER") {
      const u = signUpForIndividualSchema.parse(normalized); // ✅ only this
      const payload = {
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phoneNumber,
        email: u.email,
        // displayPicture: u.profilePhoto,
        // idNumber: u.idNumber,
        // identificationType: u.moi,
        dob: u.dob,
        businessName: null,
        businessEmail: null,
        address: u.address,
        password: u.passwordObj.password,
        confirmpassword: u.passwordObj.confirmPassword,
        referralCode: u.referralCode || raw.referralCode || raw.referralUsername || null,
        isce_permissions: {
          connect: true,
          connect_plus: true,
          store: true,
          wallet: true,
          event: true,
          access: true,
        },
        business_permissions: {
          invoicing: true,
          appointment: true,
          chat: true,
          analytics: true,
          services: true,
        },
      };
      return await forwardToAuth(payload, userType);
    } else {
      const b = extendedSignUpSchema.parse(normalized); // ✅ only this
      const payload = {
        firstName: b.firstName,
        lastName: b.lastName,
        phone: b.phoneNumber,
        email: b.email,
        businessName: b.businessName,
        businessEmail: b.businessEmail,
        identificationType: b.identificationType,
        idNumber: b.idNumber || raw.idNumber || null,
        position: b.position || raw.position || null,
        businessAddress: b.businessAddress || raw.businessAddress || b.address || null,
        displayPicture: raw.displayPicture || raw.profilePhoto || null,
        dob: (typeof raw.dob === "string" && raw.dob) || (b.dob ? `${String(b.dob.getMonth() + 1).padStart(2, '0')}/${String(b.dob.getDate()).padStart(2, '0')}/${b.dob.getFullYear()}` : null),
        address: b.address,
        password: b.passwordObj.password,
        confirmpassword: b.passwordObj.confirmPassword,
        referralCode: b.referralCode || raw.referralCode || raw.referralUsername || null,
        isce_permissions: {
          connect: true,
          connect_plus: true,
          store: true,
          wallet: true,
          event: true,
          access: true,
        },
        business_permissions: {
          invoicing: true,
          appointment: true,
          chat: true,
          analytics: true,
          services: true,
        },
      };
      return await forwardToAuth(payload, userType);
    }
  } catch (e) {
    console.log("Sign up POST request error", e);
    return NextResponse.json(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}

async function forwardToAuth(payload: any, userType: string) {
  const isBusiness = userType === "BUSINESS_USER" || userType === "BUSINESS";
  const url = isBusiness
    ? `${AUTH_API}${URLS.auth.sign_up_business}`
    : `${AUTH_API}${URLS.auth.sign_up}?userType=${encodeURIComponent(userType)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  console.log({ data });
  if (!res.ok)
    return NextResponse.json(
      { error: "Failed to create account", details: data },
      { status: res.status || 400 }
    );

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
    console.log("Referral attach attempt result:", attachRes);
  } else if (referralUsername) {
    console.warn("Skipping attachReferral because newUserId could not be found in response data:", data);
  }

  return NextResponse.json(data);
}
