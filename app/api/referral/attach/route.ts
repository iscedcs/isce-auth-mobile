import { NextResponse } from "next/server";
import { AuthService } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const { newUserId, referralUsername } = await req.json();

    if (!newUserId || !referralUsername) {
      return NextResponse.json(
        { error: "newUserId and referralUsername are required" },
        { status: 400 }
      );
    }

    const res = await AuthService.attachReferral({
      newUserId,
      referralUsername: String(referralUsername).trim(),
    });

    if (!res.success) {
      return NextResponse.json({ error: res.message }, { status: 400 });
    }

    return NextResponse.json(res);
  } catch (error) {
    console.error("Error in /api/referral/attach route:", error);
    return NextResponse.json(
      { error: "Failed to attach referral" },
      { status: 500 }
    );
  }
}
