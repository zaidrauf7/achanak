import { Schema, model, models } from "mongoose";

const SettingsSchema = new Schema({
  totalTables: { type: Number, default: 12 },
  restaurantName: { type: String, default: "Achanak" }
});

// Singleton logic
const Settings = models.Settings || model("Settings", SettingsSchema);
export default Settings;
