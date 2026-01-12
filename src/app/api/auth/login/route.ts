import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export async function POST(req: Request) {
  await connectDB();
  try {
    const { username, password } = await req.json();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create Token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Set Cookie
    const serialized = serialize("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    const response = NextResponse.json({ success: true, role: user.role });
    response.headers.set("Set-Cookie", serialized);
    return response;

  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
