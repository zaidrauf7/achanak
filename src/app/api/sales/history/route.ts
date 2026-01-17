import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-this";

export async function GET(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token");
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        // Only owners (or managers if allowed) can view sales history. 
        // Assuming strictly owner for financial data as per previous logic, but managers serve orders.
        // Let's allow both since managers might need to see performance, but maybe restrict sensitive info?
        // Actually earlier code restricts /sales to logged in users, implicitly allowing managers.
        // But dashboard is shared.

        await connectDB();

        // Calculate date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // Aggregate sales by day
        const sales = await Order.aggregate([
            {
                $match: {
                    status: { $in: ["completed", "paid"] },
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Format for Chart (Needs "name": "Mon", "sales": 120)
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const formattedData = [];
        
        // Fill in missing days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = i === 0 ? 'Today' : days[d.getDay()];

            const found = sales.find((s: any) => s._id === dateStr);
            formattedData.push({
                name: dayName,
                sales: found ? found.totalSales : 0
            });
        }

        return NextResponse.json(formattedData);

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to fetch sales history" }, { status: 500 });
    }
}
