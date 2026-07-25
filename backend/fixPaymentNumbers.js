const mongoose = require('mongoose');
const Payment = require('./models/Payment');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/devops-platform', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixPaymentNumbers() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Find all payments with null paymentNumber
    const paymentsWithoutNumber = await Payment.find({ paymentNumber: null });
    console.log(`Found ${paymentsWithoutNumber.length} payments without paymentNumber`);
    
    // Update each payment with a unique payment number
    for (let i = 0; i < paymentsWithoutNumber.length; i++) {
      const payment = paymentsWithoutNumber[i];
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const paymentNumber = `PAY${timestamp}${random}${i}`;
      
      payment.paymentNumber = paymentNumber;
      await payment.save();
      console.log(`Updated payment ${payment._id} with paymentNumber: ${paymentNumber}`);
    }
    
    console.log('Successfully updated all payment numbers');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing payment numbers:', error);
    process.exit(1);
  }
}

fixPaymentNumbers();
