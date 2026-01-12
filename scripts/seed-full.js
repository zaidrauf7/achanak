const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/achanak';

const items = [
  // Starters
  { name: 'Crispy Samosas (3pcs)', price: 5, category: 'Starter', isAvailable: true },
  { name: 'Garlic Bread', price: 6, category: 'Starter', isAvailable: true },
  { name: 'Chicken Wings (6pcs)', price: 9, category: 'Starter', isAvailable: true },
  { name: 'Paneer Tikka', price: 11, category: 'Starter', isAvailable: true },
  
  // Mains
  { name: 'Butter Chicken', price: 16, category: 'Main', isAvailable: true },
  { name: 'Cheeseburger', price: 13, category: 'Main', isAvailable: true },
  { name: 'Veggie Pizza', price: 14, category: 'Main', isAvailable: true },
  { name: 'Pasta Alfredo', price: 15, category: 'Main', isAvailable: true },
  { name: 'Grilled Salmon', price: 22, category: 'Main', isAvailable: true },
  { name: 'Lamb Rogan Josh', price: 18, category: 'Main', isAvailable: true },

  // Drinks
  { name: 'Mango Lassi', price: 5, category: 'Drink', isAvailable: true },
  { name: 'Coca Cola', price: 3, category: 'Drink', isAvailable: true },
  { name: 'Lemonade', price: 4, category: 'Drink', isAvailable: true },
  { name: 'Iced Coffee', price: 5, category: 'Drink', isAvailable: true },

  // Desserts
  { name: 'Chocolate Brownie', price: 7, category: 'Dessert', isAvailable: true },
  { name: 'Vanilla Ice Cream', price: 4, category: 'Dessert', isAvailable: true },
  { name: 'Gulab Jamun', price: 6, category: 'Dessert', isAvailable: true },
];

async function seed() {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const MenuItemSchema = new mongoose.Schema({
        name: String, price: Number, category: String, image: String, isAvailable: Boolean
    });
    
    // Check if model already exists to avoid recompilation error in watch mode scenarios (unlikely for script but good practice)
    const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);

    // Clear existing for a fresh clean list
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');

    await MenuItem.insertMany(items);
    console.log(`Added ${items.length} tasty items to the menu!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
