import { NextResponse } from "next/server";
import { registerUsernameMapping } from "@/lib/usernameService";

export async function POST(request) {
  try {
    const { uid, email, username, fullName } = await request.json();

    if (!uid || !email || !username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const record = await registerUsernameMapping(username, email, uid, fullName);

    return NextResponse.json({ success: true, record }, { status: 200 });
  } catch (err) {
    console.error("Register username mapping error:", err);
    return NextResponse.json({ success: true, warning: err.message }, { status: 200 });
  }
}
