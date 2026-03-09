const mongoose = require('mongoose');
const User = require('../models/user');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/bankDB');
  const result = await User.updateMany(
    {
      $or: [
        { transactions: { $not: { $type: 'array' } } },
        { transactions: { $elemMatch: { $not: { $type: 'object' } } } }
      ]
    },
    { $set: { transactions: [] } }
  );
  console.log('Cleaned documents:', result);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});