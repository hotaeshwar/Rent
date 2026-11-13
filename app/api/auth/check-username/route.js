import { NextResponse } from "next/server";
import { checkUsernameAvailable } from "@/lib/usernameService";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const username = body.username;

    if (!username || typeof username !== "string") {
      return NextResponse.json({ available: false, error: "Username is required" }, { status: 400 });
    }

    const result = await checkUsernameAvailable(username);
    if (!result.available) {
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ available: true }, { status: 200 });
  } catch (err) {
    console.error("Check username error:", err);
    // Never fail registration check with a 500 error
    return NextResponse.json({ available: true, fallback: true }, { status: 200 });
  }
}
