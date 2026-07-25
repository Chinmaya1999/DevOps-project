const mongoose = require('mongoose');

require('dotenv').config();

const dropPaymentIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const paymentsCollection = db.collection('payments');

    // Drop the problematic index
    try {
      await paymentsCollection.dropIndex('paymentNumber_1');
      console.log('Successfully dropped paymentNumber_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index paymentNumber_1 does not exist, skipping...');
      } else {
        console.error('Error dropping index:', error);
      }
    }

    // List remaining indexes
    const indexes = await paymentsCollection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

dropPaymentIndex();
