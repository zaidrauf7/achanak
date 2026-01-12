const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/achanak';

const items = [
  // Briyani & Rice Specials
  { 
    name: 'Chicken Biryani Special', 
    price: 12, 
    category: 'Biryani', 
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },
  { 
    name: 'Hyderabadi Dum Biryani', 
    price: 14, 
    category: 'Biryani', 
    image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },
  { 
    name: 'Beef Pulao', 
    price: 11, 
    category: 'Pulao', 
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },
  { 
    name: 'Palak Biryani', 
    price: 10, 
    category: 'Biryani', 
    image: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?q=80&w=1000&auto=format&fit=crop', // Reusing rice image for now
    isAvailable: true 
  },
  { 
    name: 'Daal Chawal Platter', 
    price: 8, 
    category: 'Rice', 
    image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },
  { 
    name: 'Matar Pulao', 
    price: 9, 
    category: 'Pulao', 
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },

  // Sides / Curries
  { 
    name: 'Chicken Karahi', 
    price: 15, 
    category: 'Curry', 
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },
  { 
    name: 'Shami Kabab (2pcs)', 
    price: 4, 
    category: 'Sides', 
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },
  { 
    name: 'Raita & Salad', 
    price: 2, 
    category: 'Sides', 
    image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },

  // Drinks
  { 
    name: 'Mint Margarita', 
    price: 4, 
    category: 'Drinks', 
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },
  { 
    name: 'Lassi', 
    price: 3, 
    category: 'Drinks', 
    image: 'https://images.unsplash.com/photo-1626079979942-8c903a45c613?q=80&w=1000&auto=format&fit=crop', 
    isAvailable: true 
  },
];

async function seed() {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    
    // Define Schema strictly here
    const MenuItemSchema = new mongoose.Schema({
        name: String, price: Number, category: String, image: String, isAvailable: Boolean
    });
    
    // Overwrite model if exists
    const MenuItem = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);

    // Clear existing for a fresh clean list
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');

    await MenuItem.insertMany(items);
    console.log(`Added ${items.length} Desi items to the menu!`);
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seed();
