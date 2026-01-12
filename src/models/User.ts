import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // In real production, this should be hashed
  name: { type: String },
  role: { type: String, enum: ["manager", "owner"], default: "manager" },
  createdAt: { type: Date, default: Date.now },
});

const User = models.User || model("User", UserSchema);
export default User;
