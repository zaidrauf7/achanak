const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/achanak';

const items = [
  { name: 'Burger', price: 12, category: 'Main', image: '', isAvailable: true },
  { name: 'Cheese Fries', price: 6, category: 'Starter', image: '', isAvailable: true },
  { name: 'Coke', price: 3, category: 'Drink', image: '', isAvailable: true },
  { name: 'Pepperoni Pizza', price: 16, category: 'Main', image: '', isAvailable: true },
  { name: 'Caesar Salad', price: 9, category: 'Starter', image: '', isAvailable: true },
  { name: 'Chocolate Cake', price: 7, category: 'Dessert', image: '', isAvailable: true },
];

async function seed() {
  console.log('Connecting to:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');

  const MenuItemSchema = new mongoose.Schema({
    name: String, price: Number, category: String, image: String, isAvailable: Boolean
  });
  
  const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);

  await MenuItem.deleteMany({});
  await MenuItem.insertMany(items);
  console.log('Seeded menu items successfully');
  process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
