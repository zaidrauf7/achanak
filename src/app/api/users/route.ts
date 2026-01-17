import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export async function POST(req: Request) {
  // Auth check
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded: any = jwt.verify(token.value, JWT_SECRET);
    if (decoded.role !== "owner") {
         return NextResponse.json({ error: "Forbidden: Owners only" }, { status: 403 });
    }

    const { name, username, password, role = "manager" } = await req.json();
     if (!name || !username || !password) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    await connectDB();

    // Check existing
    const existing = await User.findOne({ username });
    if (existing) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
        name,
        username,
        password: hashedPassword,
        role: role // 'manager' typically
    });

    return NextResponse.json({ success: true, user: { _id: newUser._id, username: newUser.username, role: newUser.role } });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function GET(req: Request) {
    // Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
    try {
      const decoded: any = jwt.verify(token.value, JWT_SECRET);
      if (decoded.role !== "owner") {
           return NextResponse.json({ error: "Forbidden: Owners only" }, { status: 403 });
      }
  
      await connectDB();
      const users = await User.find({ role: 'manager' }).select('-password');
      return NextResponse.json(users);
  
    } catch (e) {
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
  }

export async function DELETE(req: Request) {
    // Auth check
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
    try {
      const decoded: any = jwt.verify(token.value, JWT_SECRET);
      if (decoded.role !== "owner") {
           return NextResponse.json({ error: "Forbidden: Owners only" }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      if (!id) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  
      await connectDB();
      await User.findByIdAndDelete(id);
      
      return NextResponse.json({ success: true });
  
    } catch (e) {
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
