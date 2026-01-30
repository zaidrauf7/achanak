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

     const page = searchParams.get("page");
     const limit = searchParams.get("limit");

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

    if (page) {
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit || '20');
        const skip = (pageNum - 1) * limitNum;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        return NextResponse.json({
            orders,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } else {
        const orders = await Order.find(query).sort({ createdAt: -1 });
        return NextResponse.json(orders);
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  await connectDB();
  try {
    const body = await req.json();

    // Calculate order number for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const lastOrderToday = await Order.findOne({
      createdAt: { $gte: startOfToday },
      orderNumber: { $exists: true }
    }).sort({ orderNumber: -1 });

    const orderNumber = lastOrderToday && lastOrderToday.orderNumber 
      ? lastOrderToday.orderNumber + 1 
      : 1;

    const newOrder = await Order.create({
      ...body,
      orderNumber
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
