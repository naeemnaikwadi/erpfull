const mongoose = require('mongoose');
const Library = require('./models/Library');
require('dotenv').config();

async function testLibrary() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    console.log('Testing Library model...');
    const libraryCount = await Library.countDocuments();
    console.log(`Library documents count: ${libraryCount}`);

    console.log('Testing Library schema...');
    const testBook = new Library({
      title: 'Test Book',
      author: 'Test Author',
      isbn: '1234567890',
      genre: 'Test',
      quantity: 1,
      availableQuantity: 1,
      shelfNo: 'A-001',
      description: 'Test description'
    });

    console.log('Library model test successful');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

testLibrary();
