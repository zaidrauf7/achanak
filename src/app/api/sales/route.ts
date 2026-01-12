import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

export async function GET() {
    await connectDB();
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const salesStats = await Order.aggregate([
            { $match: { 
                status: "completed",
                createdAt: { $gte: today } 
            }},
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
        const totalOrders = await Order.countDocuments({ status: "completed", createdAt: { $gte: today } });
        
        return NextResponse.json({ 
            totalRevenue, 
            totalOrders,
            topItems: salesStats.slice(0, 5) // Top 5 items
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
    }
}
