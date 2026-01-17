import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import MenuItem from "@/models/MenuItem";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  try {
    const { id } = params;
    const body = await req.json();
    const updatedItem = await MenuItem.findByIdAndUpdate(id, body, { new: true });
    
    if (!updatedItem) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    
    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await connectDB();
  try {
    const { id } = params;
    const deletedItem = await MenuItem.findByIdAndDelete(id);

    if (!deletedItem) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }
}
