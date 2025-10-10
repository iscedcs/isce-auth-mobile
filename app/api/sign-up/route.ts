"use server";

import { AUTH_API, URLS } from "@/lib/const";

import { userType } from "@/lib/types/auth";
import {
  extendedSignUpSchema,
  signUpForIndividualSchema,
} from "@/schemas/sign-up";
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
        // displayPicture: b.profilePhoto,
        // idNumber: b.idNumber,
        // identificationType: b.moi,
        dob: b.dob,
        businessName: b.businessName,
        businessEmail: b.businessEmail,
        address: b.address,
        password: b.passwordObj.password,
        confirmpassword: b.passwordObj.password, // if confirm ≠ password, set accordingly
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
  const url = `${AUTH_API}${URLS.auth.sign_up}?userType=${encodeURIComponent(
    userType
  )}`;
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
  return NextResponse.json(data);
}
