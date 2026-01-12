import { Schema, model, models } from "mongoose";

const MenuItemSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true }, // e.g., Starter, Main, Drink
  image: { type: String }, // URL
  isAvailable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const MenuItem = models.MenuItem || model("MenuItem", MenuItemSchema);
export default MenuItem;
