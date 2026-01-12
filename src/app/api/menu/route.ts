import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MenuItem from "@/models/MenuItem";

export async function GET() {
  await connectDB();
  try {
    const items = await MenuItem.find({}).sort({ category: 1, name: 1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const { name, price, category, image } = body;
    
    if (!name || !price || !category) {
       return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newItem = await MenuItem.create({ name, price, category, image });
    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}
