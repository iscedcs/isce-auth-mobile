import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    userType?: string;
    image?: string;
    accessToken?: string;
  }

  interface Session {
    error?: string;
    user: User;
  }

  declare module "next-auth/jwt" {
    interface JWT {
      id?: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      userType?: string;
      picture?: string;
      accessToken?: string;
    }
  }
}
