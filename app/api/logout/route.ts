import { signOut } from "@/auth";

// You can support GET (or POST) – both are fine
export async function GET(request: Request) {
  // Auth.js v5: sign out and redirect to the homepage
  return signOut({ redirectTo: "/" });
}
