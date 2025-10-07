"use server";

import { businessSignUpValues } from "@/components/forms/sign-up/businessSignUpForm";
import { signUpValues } from "@/components/forms/sign-up/individualSignUpForm";
import { AUTH_API, URLS } from "@/lib/const";

import { userType } from "@/lib/types/auth";
import {
  extendedSignUpSchema,
  signUpForIndividualSchema,
} from "@/schemas/sign-up";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  //   console.log({ req });
  const rawRequest = await req.json();
  console.log({ rawRequest });
  try {
    const userType: userType = (rawRequest.userType as userType) ?? "USER";

    //reason: request body from swagger docs does not match the request body
    // in my zodschema which ends up throwing errors and invalidating my request
    rawRequest.phoneNumber = rawRequest.phone;
    rawRequest.moi = rawRequest.identificationType;
    rawRequest.dob = new Date(rawRequest.dob);
    rawRequest.profilePhoto = rawRequest.displayPicture;
    rawRequest.passwordObj = {
      password: rawRequest.password,
      confirmPassword: rawRequest.confirmpassword,
    };

    const validatedUser: signUpValues =
      signUpForIndividualSchema.parse(rawRequest);

    const validatedBusinessUser: businessSignUpValues =
      extendedSignUpSchema.parse(rawRequest);

    const payload = {
      firstName:
        userType === "USER"
          ? validatedUser.firstName
          : validatedBusinessUser.firstName,
      lastName:
        userType === "USER"
          ? validatedUser.lastName
          : validatedBusinessUser.lastName,
      phone:
        userType === "USER"
          ? validatedUser.phoneNumber
          : validatedBusinessUser.phoneNumber,
      email:
        userType === "USER" ? validatedUser.email : validatedBusinessUser.email,
      displayPicture:
        userType === "USER"
          ? validatedUser.profilePhoto
          : validatedBusinessUser.profilePhoto,
      idNumber:
        userType === "USER"
          ? validatedUser.idNumber
          : validatedBusinessUser.idNumber,
      identificationType:
        userType === "USER" ? validatedUser.moi : validatedBusinessUser.moi,
      dob: userType === "USER" ? validatedUser.dob : validatedBusinessUser.dob,
      businessName:
        userType === "USER" ? null : validatedBusinessUser.businessName,
      businessEmail:
        userType === "USER" ? null : validatedBusinessUser.businessEmail,
      address:
        userType === "USER"
          ? validatedUser.address
          : validatedBusinessUser.address,
      password:
        userType === "USER"
          ? validatedUser.passwordObj.password
          : validatedBusinessUser.passwordObj.password,
      confirmpassword:
        userType === "USER"
          ? validatedUser.passwordObj.confirmPassword
          : validatedBusinessUser.passwordObj.password,
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

    const url = `${AUTH_API}${URLS.auth.sign_up}?userType=${encodeURIComponent(
      userType
    )}`;

    const res = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    console.log({ data });
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (e) {
    console.log("Sign up POST request error", e);
    return NextResponse.json(
      { error: "Invalid request payload", details: e },
      { status: 400 }
    );
  }
}
