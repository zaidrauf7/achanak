import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";

export async function GET() {
  try {
    await connectDB();
    
    // Get a real menu item ID to be safe
    let menuItemId = "000000000000000000000000";
    const existingItem = await MenuItem.findOne();
    if (existingItem) {
        menuItemId = existingItem._id;
    }

    const today = new Date();
    const mockOrders = [];

    // Generate random sales for past 7 days
    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Random number of orders per day (1 to 5)
        const numOrders = Math.floor(Math.random() * 5) + 1;
        
        for (let j = 0; j < numOrders; j++) {
            const amount = Math.floor(Math.random() * 50) + 20; // $20 - $70
            
            mockOrders.push({
                items: [{
                    menuItem: menuItemId,
                    name: "Test Item",
                    price: amount,
                    quantity: 1
                }],
                totalAmount: amount,
                status: "completed",
                orderType: "dine-in",
                createdAt: date
            });
        }
    }

    await Order.insertMany(mockOrders);

    return NextResponse.json({ success: true, count: mockOrders.length, message: "Seeded past sales data" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
