const mongoose = require("mongoose")

const transactionSchema = new mongoose.Schema({
    type: String,
    amount: Number,
    description: String,
    date: { type: Date, default: Date.now }
})

const userSchema = new mongoose.Schema({

    username: String,

    email: {
        type: String,
        unique: true,
        required: true
    },

    password: String,

    accountNumber: Number,

    balance: {
        type: Number,
        default: 0
    },

    frozen: {
        type: Boolean,
        default: false
    },

    transactions: [transactionSchema]

})

module.exports = mongoose.model("User", userSchema)