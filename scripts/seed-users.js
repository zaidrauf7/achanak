const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs'); // We will use bcrypt for hashing if available, else plain text for now if install fails
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/achanak';

const users = [
  { username: 'manager', password: '123', role: 'manager', name: 'Duty Manager' },
  { username: 'owner', password: '123', role: 'owner', name: 'Restaurant Owner' },
];

async function seed() {
  try {
    console.log('Connecting to:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    
    // Define Schema in script to avoid import issues
    const UserSchema = new mongoose.Schema({
        username: String, password: String, role: String, name: String
    });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    await User.deleteMany({});
    
    // Hash passwords
    const hashedUsers = await Promise.all(users.map(async (u) => {
        const hashedPassword = await bcrypt.hash(u.password, 10);
        return { ...u, password: hashedPassword };
    }));

    await User.insertMany(hashedUsers);
    console.log('Created users: manager/123 and owner/123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
