import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    try {
        const { id } = (await params);
        const order = await Order.findById(id);
        if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
        return NextResponse.json(order);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  try {
    const { id } = (await params);
    const body = await req.json();
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(id, body, { new: true });
    
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await connectDB();
    try {
        const { id } = (await params);
        await Order.findByIdAndDelete(id);
        return NextResponse.json({ message: "Order deleted" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
    }
}
