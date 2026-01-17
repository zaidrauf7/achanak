const mongoose = require('mongoose');

// Define Schema manually since we can't import TS files easily in a standalone JS script without compilation
const OrderSchema = new mongoose.Schema({
  items: [{
      menuItem: { type: mongoose.Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "completed" },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

const MONGODB_URI = "mongodb://localhost:27017/achanak"; // Verify this from .env if possible, assuming default local

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");

        const today = new Date();
        const mockOrders = [];
        const dummyId = new mongoose.Types.ObjectId();

        console.log("Generating last week's data...");

        for (let i = 1; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            // Random 3-8 orders per day
            const numOrders = Math.floor(Math.random() * 6) + 3;
            
            for (let j = 0; j < numOrders; j++) {
                const amount = Math.floor(Math.random() * 80) + 20; // $20 - $100
                
                mockOrders.push({
                    items: [{
                        menuItem: dummyId,
                        name: "Seeded Item",
                        price: amount,
                        quantity: 1
                    }],
                    totalAmount: amount,
                    status: "completed",
                    createdAt: date
                });
            }
        }

        await Order.insertMany(mockOrders);
        console.log(`Successfully inserted ${mockOrders.length} orders for history.`);
        
        await mongoose.disconnect();
        process.exit(0);

    } catch (e) {
        console.error("Error seeding:", e);
        process.exit(1);
    }
}

seed();
