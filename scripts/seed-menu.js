const mongoose = require('mongoose');

// Define Schema
const MenuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String }, // URL
  description: { type: String },
  isAvailable: { type: Boolean, default: true },
});

const MenuItem = mongoose.models.MenuItem || mongoose.model("MenuItem", MenuItemSchema);

const MONGODB_URI = "mongodb+srv://iamzaidrauf_db_user:hs6RqA1fxr1HTdgG@cluster0.s1w52rs.mongodb.net/achanak";

const menuItems = [
    // --- Chicken Biryani ---
    { name: "Half Chicken Biryani (300g)", price: 200, category: "Biryani", image: "https://t3.ftcdn.net/jpg/04/41/20/18/360_F_441201852_XQq3af9f9b9a9a9a9a9a9a9a9a9a9a9.jpg" },
    { name: "Medium Single Chicken Biryani (450g)", price: 330, category: "Biryani", image: "https://t3.ftcdn.net/jpg/04/41/20/18/360_F_441201852_XQq3af9f9b9a9a9a9a9a9a9a9a9a9a9.jpg" },
    { name: "Medium Double Chicken Biryani (550g)", price: 500, category: "Biryani", image: "https://t3.ftcdn.net/jpg/04/41/20/18/360_F_441201852_XQq3af9f9b9a9a9a9a9a9a9a9a9a9a9.jpg" },
    { name: "Full Single Chicken Biryani (600g)", price: 400, category: "Biryani", image: "https://t3.ftcdn.net/jpg/04/41/20/18/360_F_441201852_XQq3af9f9b9a9a9a9a9a9a9a9a9a9a9.jpg" },
    { name: "Full Double Chicken Biryani (700g)", price: 560, category: "Biryani", image: "https://t3.ftcdn.net/jpg/04/41/20/18/360_F_441201852_XQq3af9f9b9a9a9a9a9a9a9a9a9a9a9.jpg" },
    { name: "Plain Biryani Rice (250g)", price: 130, category: "Biryani", image: "https://t3.ftcdn.net/jpg/04/41/20/18/360_F_441201852_XQq3af9f9b9a9a9a9a9a9a9a9a9a9a9.jpg" },
    { name: "Plain Biryani Rice (500g)", price: 260, category: "Biryani", image: "https://t3.ftcdn.net/jpg/04/41/20/18/360_F_441201852_XQq3af9f9b9a9a9a9a9a9a9a9a9a9a9.jpg" },
    { name: "Per Kg Biryani Rice", price: 520, category: "Biryani", image: "https://t3.ftcdn.net/jpg/04/41/20/18/360_F_441201852_XQq3af9f9b9a9a9a9a9a9a9a9a9a9a9.jpg" },

    // --- Chicken Achari Pulao ---
    { name: "Half Chicken Pulao (300g)", price: 200, category: "Pulao", image: "https://media.istockphoto.com/id/1305452646/photo/chicken-biryani-with-yogurt-dip.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Medium Chicken Pulao (450g)", price: 330, category: "Pulao", image: "https://media.istockphoto.com/id/1305452646/photo/chicken-biryani-with-yogurt-dip.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Full Chicken Pulao (600g)", price: 400, category: "Pulao", image: "https://media.istockphoto.com/id/1305452646/photo/chicken-biryani-with-yogurt-dip.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Plain Pulao Rice (250g)", price: 130, category: "Pulao", image: "https://media.istockphoto.com/id/1305452646/photo/chicken-biryani-with-yogurt-dip.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Plain Pulao Rice (500g)", price: 260, category: "Pulao", image: "https://media.istockphoto.com/id/1305452646/photo/chicken-biryani-with-yogurt-dip.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Per Kg Pulao Rice", price: 520, category: "Pulao", image: "https://media.istockphoto.com/id/1305452646/photo/chicken-biryani-with-yogurt-dip.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },

    // --- Palak Chawal ---
    { name: "Half Palak Chawal (400g)", price: 300, category: "Palak", image: "https://thumbs.dreamstime.com/b/palak-paneer-spinach-cheese-curry-indian-dish-146666666.jpg" },
    { name: "Medium Palak Chawal (600g)", price: 450, category: "Palak", image: "https://thumbs.dreamstime.com/b/palak-paneer-spinach-cheese-curry-indian-dish-146666666.jpg" },
    { name: "Full Palak Chawal (800g)", price: 600, category: "Palak", image: "https://thumbs.dreamstime.com/b/palak-paneer-spinach-cheese-curry-indian-dish-146666666.jpg" },
    { name: "Per Plate Palak", price: 280, category: "Palak", image: "https://thumbs.dreamstime.com/b/palak-paneer-spinach-cheese-curry-indian-dish-146666666.jpg" },
    { name: "Per Kg Palak", price: 1120, category: "Palak", image: "https://thumbs.dreamstime.com/b/palak-paneer-spinach-cheese-curry-indian-dish-146666666.jpg" },

    // --- Dal Chawal ---
    { name: "Half Plate Dal Chawal (400g)", price: 160, category: "Dal", image: "https://media.istockphoto.com/id/1155355642/photo/indian-dal-chawal.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Medium Plate Dal Chawal (600g)", price: 240, category: "Dal", image: "https://media.istockphoto.com/id/1155355642/photo/indian-dal-chawal.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Full Plate Dal Chawal (800g)", price: 320, category: "Dal", image: "https://media.istockphoto.com/id/1155355642/photo/indian-dal-chawal.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Per Plate Dal", price: 120, category: "Dal", image: "https://media.istockphoto.com/id/1155355642/photo/indian-dal-chawal.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Per Kg Dal", price: 480, category: "Dal", image: "https://media.istockphoto.com/id/1155355642/photo/indian-dal-chawal.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },

    // --- Dessert & Sides ---
    { name: "Zarda (Quarter)", price: 200, category: "Dessert", image: "https://media.istockphoto.com/id/1186762399/photo/zarda-indian-sweet-rice-dish.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Zarda (Per Kg)", price: 800, category: "Dessert", image: "https://media.istockphoto.com/id/1186762399/photo/zarda-indian-sweet-rice-dish.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Chicken Piece (Small)", price: 80, category: "Sides", image: "https://media.istockphoto.com/id/175416040/photo/fried-chicken.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Chicken Piece (Large)", price: 150, category: "Sides", image: "https://media.istockphoto.com/id/175416040/photo/fried-chicken.jpg?s=612x612&w=0&k=20&c=1F3d1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q1q" },
    { name: "Shami Kabab", price: 50, category: "Sides", image: "https://media.istockphoto.com/id/1155355642/photo/indian-dal-chawal.jpg?s=612x612&w=0&k=20" },
    { name: "Raita", price: 40, category: "Sides", image: "https://media.istockphoto.com/id/157431311/photo/cucumber-raita.jpg?s=612x612&w=0&k=20" },
    { name: "Salad", price: 50, category: "Sides", image: "https://media.istockphoto.com/id/1155355642/photo/indian-dal-chawal.jpg?s=612x612&w=0&k=20" },
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB...");

        // Delete existing
        await MenuItem.deleteMany({});
        console.log("Deleted existing menu items.");

        // Insert new
        await MenuItem.insertMany(menuItems);
        console.log(`Successfully inserted ${menuItems.length} new menu items.`);
        
        await mongoose.disconnect();
        process.exit(0);

    } catch (e) {
        console.error("Error seeding menu:", e);
        process.exit(1);
    }
}

seed();
