import { NextResponse } from "next/server";
import { resolveUsernameToEmail } from "@/lib/usernameService";

// In-memory rate limiting map
const attempts = new Map();

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "local";
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxAttempts = 15;

    const record = attempts.get(ip) || { count: 0, resetAt: now + windowMs };
    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    record.count += 1;
    attempts.set(ip, record);

    if (record.count > maxAttempts) {
      return NextResponse.json(
        { error: "Too many login attempts. Please wait a moment." },
        { status: 429 }
      );
    }

    const { username } = await request.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const email = await resolveUsernameToEmail(username);

    if (!email) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    return NextResponse.json({ email }, { status: 200 });
  } catch (err) {
    console.error("Resolve username error:", err);
    return NextResponse.json({ error: "Authentication service error" }, { status: 500 });
  }
}
