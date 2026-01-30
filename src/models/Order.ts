import { Schema, model, models } from "mongoose";

const OrderSchema = new Schema({
  customerName: { type: String }, // Optional
  tableNo: { type: String },      // Optional
  items: [
    {
      menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
      name: { type: String, required: true }, // Snapshot of name
      price: { type: Number, required: true }, // Snapshot of price
      quantity: { type: Number, required: true, min: 1 },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "preparing", "completed", "cancelled"], 
    default: "pending" 
  },
  orderType: {
    type: String,
    enum: ["dine-in", "take-away"],
    default: "take-away"
  },
  createdBy: { type: String }, // Clerk ID of manager
  orderNumber: { type: Number },
  kitchenPrinted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Force deletion of model to allow schema update in dev mode (fixing caching issue)
if (process.env.NODE_ENV === 'development' && models.Order) {
  delete models.Order
}

const Order = models.Order || model("Order", OrderSchema);
export default Order;
