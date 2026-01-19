import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

export async function GET(req: Request) {
    await connectDB();
    try {
        const { searchParams } = new URL(req.url);
        const dateParam = searchParams.get("date");

        let matchStage: any = { status: "completed" };
        let countQuery: any = { status: "completed" };

        if (dateParam) {
            const start = new Date(dateParam);
            start.setHours(0, 0, 0, 0);
            const end = new Date(dateParam);
            end.setHours(23, 59, 59, 999);
            
            matchStage.createdAt = { $gte: start, $lte: end };
            countQuery.createdAt = { $gte: start, $lte: end };
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            matchStage.createdAt = { $gte: today };
            countQuery.createdAt = { $gte: today };
        }

        const salesStats = await Order.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.name",
                    totalQuantity: { $sum: "$items.quantity" },
                    totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { totalQuantity: -1 } }
        ]);

        const totalRevenue = salesStats.reduce((acc, item) => acc + item.totalSales, 0);
        const totalOrders = await Order.countDocuments(countQuery);
        
        return NextResponse.json({ 
            totalRevenue, 
            totalOrders,
            topItems: salesStats.slice(0, 5) // Top 5 items
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
    }
}
