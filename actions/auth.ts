"use server";

import { signIn, signOut } from "../auth";

export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res === null) {
      return null;
    }
    return res;
  } catch (error: any) {
    console.log("Something went wrong", error);
  }
};

export const signout = async () => {
  // const url = `${AUTH_API}${URLS.auth.sign_out}`;
  try {
    await signOut();
  } catch (e) {
    console.log("Error with signing out account", e);
  }
};
