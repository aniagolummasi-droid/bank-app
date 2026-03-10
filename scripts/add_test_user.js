require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/user");

async function addTestUser() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const hashedPassword = await bcrypt.hash("test123", 10);
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);

    const user = new User({
        username: "testuser",
        password: hashedPassword,
        accountNumber,
        balance: 100,
        frozen: false,
        transactions: []
    });

    await user.save();
    console.log("Test user created: username=testuser, password=test123, accountNumber=" + accountNumber);
    process.exit(0);
}

addTestUser().catch(err => {
    console.error(err);
    process.exit(1);
});