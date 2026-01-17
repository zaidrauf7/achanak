import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  await connectDB();
  try {
     const { searchParams } = new URL(req.url);
     const status = searchParams.get("status");
     const startDate = searchParams.get("startDate");
     const endDate = searchParams.get("endDate");

     let query: any = {};
     
     // Status Filter
     if (status) {
         query.status = status;
     }

     // Date Range Filter
     if (startDate || endDate) {
         query.createdAt = {};
         if (startDate) {
             query.createdAt.$gte = new Date(startDate);
         }
         if (endDate) {
             const end = new Date(endDate);
             end.setHours(23, 59, 59, 999);
             query.createdAt.$lte = end;
         }
     }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();
    const newOrder = await Order.create(body);
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
