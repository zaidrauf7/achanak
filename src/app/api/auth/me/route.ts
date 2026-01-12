import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (!token) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const user = jwt.verify(token.value, JWT_SECRET);
    return NextResponse.json(user);
  } catch (e) {
    return NextResponse.json(null, { status: 401 });
  }
}
