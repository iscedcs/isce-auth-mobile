import { IAuthResponse } from "@/lib/types/auth";
import { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AUTH_API, URLS } from "./lib/const";
import { signInFormSchema } from "./schemas/sign-in";
import axios from "axios";

export default {
  providers: [
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = signInFormSchema.safeParse(credentials);
        const url = `${AUTH_API}${URLS.auth.sign_in}`;

        if (!validatedFields.success) {
          console.error("Validation failed:", validatedFields.error);
          return null;
        }

        const { email, password } = validatedFields.data;

        try {
          // const res = await axios.post<IAuthResponse>(url, {
          //   email,
          //   password,
          // });
          const res = await axios.post(
            url,
            { email, password },
            {
              timeout: 15000,
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data: IAuthResponse = await res.data();
          //console.log(data);
          const userData = res.data.data || res.data.user || res.data;
          const accessToken =
            userData?.accessToken || res.data.accessToken || userData?.token;
          if (userData && (userData.id || userData._id) && userData.email) {
            const user = {
              id: userData.id || userData._id,
              email: userData.email,
              firstName:
                userData.firstName || userData.firstname || userData.first_name,
              lastName:
                userData.lastName || userData.lastname || userData.last_name,
              userType:
                userData.userType ||
                userData.accountType ||
                userData.user_type ||
                "USER",
              accessToken: accessToken || null,
              image: userData.displayPicture || userData.avatar || null,
            };

            console.log("Returning user object:", user);
            return user;
          }
          console.error("Invalid user data structure:", userData);
          return null;
        } catch (error: any) {
          console.error("Sign-in error details:", {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: url,
          });

          // Handle specific error cases
          if (error.response?.status === 401) {
            console.error("Invalid credentials");
            return null;
          }

          if (error.response?.status === 404) {
            console.error("User not found");
            return null;
          }

          if (error.response?.status >= 500) {
            console.error("Server error");
            return null;
          }

          // Network or other errors
          if (error.code === "ECONNABORTED") {
            console.error("Request timeout");
            return null;
          }

          return null;
        }
      },
    }),
  ],
} satisfies NextAuthConfig;
