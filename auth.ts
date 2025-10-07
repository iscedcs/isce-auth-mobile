import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log(
        "JWT Callback - Token:",
        token,
        "User:",
        user,
        "Account:",
        account
      );

      if (user) {
        token.id = user.id;
        token.picture = user.image;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.userType = user.userType;
        token.accessToken = user.accessToken;
      }

      return token;
    },

    async session({ token, session }) {
      console.log("Session Callback - Token:", token, "Session:", session);

      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.userType = token.userType as string;
        session.user.accessToken = token.accessToken as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      try {
        console.log("Redirect Callback - URL:", url, "BaseURL:", baseUrl);
        const u = new URL(url, baseUrl);
        const q =
          u.searchParams.get("callbackUrl") ||
          u.searchParams.get("redirect") ||
          u.searchParams.get("redirect_uri");

        const allowed = (process.env.NEXT_PUBLIC_ALLOWED_APP_ORIGINS ?? "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

        if (q) {
          const target = new URL(q, baseUrl);
          if (target.origin === baseUrl || allowed.includes(target.origin)) {
            return target.toString();
          }
        }

        if (u.origin === baseUrl) return u.toString();

        if (allowed.includes(u.origin)) return u.toString();
      } catch (error) {
        console.log(error);
      }
      return `${baseUrl}/login`;
    },

    async signIn({ user, account, profile, email, credentials }) {
      console.log("SignIn Callback - User:", user, "Account:", account);

      // Allow sign in
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  ...authConfig,
});
