import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const AUTH_API =
  process.env.AUTH_API_URL || process.env.NEXT_PUBLIC_AUTH_API_URL;

/**
 * Proxy GET /api/admin/devices/lookup?productId=xxx → GET /device/product/:productId on isce-auth
 */
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("isce_auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 },
      );
    }

    const url = `${AUTH_API}/device/product/${encodeURIComponent(productId)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[Admin Device Lookup Proxy]", err);
    return NextResponse.json(
      { error: "Failed to lookup device" },
      { status: 500 },
    );
  }
}
