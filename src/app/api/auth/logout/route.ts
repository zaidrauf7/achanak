import { NextResponse } from "next/server";
import { cookies } from "next/headers"; // Ensure cookies imported for Next 13/14/15
import { serialize } from "cookie";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export async function POST(req: Request) {
  // Try to record logout time
  try {
      const cookieStore = await cookies();
      const token = cookieStore.get("auth_token");
      if (token) {
          const decoded: any = jwt.verify(token.value, JWT_SECRET);
          if (decoded.userId) {
              await connectDB();
              await User.findByIdAndUpdate(decoded.userId, { lastLogout: new Date() });
          }
      }
  } catch (e) {
      // Ignore errors during logout tracking, proceed to clear cookie
  }

  const serialized = serialize("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });

  const response = NextResponse.json({ success: true });
  response.headers.set("Set-Cookie", serialized);
  return response;
}
