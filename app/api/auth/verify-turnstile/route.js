import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    let token = "";
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await request.json();
      token = body?.token || body?.["cf-turnstile-response"] || body?.response || "";
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();
      token =
        formData.get("cf-turnstile-response") ||
        formData.get("token") ||
        formData.get("response") ||
        "";
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Cloudflare verification token (cf-turnstile-response) is required",
        },
        { status: 400 }
      );
    }

    const secretKey =
      process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
      "0x4AAAAAAF9-oRWlXYiqX3ttxLdrP94ZjGg";

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const clientIp =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "";
    if (clientIp) {
      formData.append("remoteip", clientIp.split(",")[0].trim());
    }

    const cfResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const data = await cfResponse.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      console.warn("Cloudflare verification rejected:", data["error-codes"]);
      return NextResponse.json(
        {
          success: false,
          error: "Cloudflare verification failed. Please try again.",
          codes: data["error-codes"],
        },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error("Cloudflare verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during Cloudflare verification",
      },
      { status: 500 }
    );
  }
}

