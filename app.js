require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const session = require("express-session");
const User = require("./models/user");


const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(session({
    secret: "banksecret",
    resave: false,
    saveUninitialized: true
}));

// ---------------- DATABASE ----------------
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("connected to MongoDB Atlas cloud"))
    .catch(err => console.log(err));

// ---------------- AUTH MIDDLEWARE ----------------
function protectUser(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

function protectAdmin(req, res, next) {
    if (!req.session.admin) return res.redirect("/admin/login");
    next();
}

// ---------------- HOME ----------------
app.get("/", (req, res) => {
    res.redirect("/login");
});

// ---------------- REGISTER ----------------
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000);

    const user = new User({
        username,
        password: hashedPassword,
        accountNumber,
        balance: 0,
        frozen: false,
        transactions: []
    });

    await user.save();
    res.redirect("/login");
});

// ---------------- USER LOGIN ----------------
app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.send("User not found");
    if (user.frozen) return res.send("Account frozen");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.send("Invalid password");

    req.session.user = user;
    res.redirect("/dashboard");
});

// ---------------- DASHBOARD ----------------
app.get("/dashboard", protectUser, async (req, res) => {
    // make sure the stored user document has a proper transactions array
    await User.updateOne(
        { _id: req.session.user._id, transactions: { $not: { $type: "array" } } },
        { $set: { transactions: [] } }
    );
    const user = await User.findById(req.session.user._id);
    res.render("dashboard", { user, username: user.username, balance: user.balance, accountNumber: user.accountNumber, transactions: user.transactions });
});

// ---------------- TRANSFER ----------------
app.post("/transfer", protectUser, async (req, res) => {
    const recipientAccount = Number(req.body.recipientAccount);
    const transferAmount = Number(req.body.amount);

    // sanitize both sender and recipient if corrupted
    await User.updateMany(
        { _id: req.session.user._id, transactions: { $not: { $type: "array" } } },
        { $set: { transactions: [] } }
    );
    await User.updateOne(
        { accountNumber: recipientAccount, transactions: { $not: { $type: "array" } } },
        { $set: { transactions: [] } }
    );

    const sender = await User.findById(req.session.user._id);
    const recipient = await User.findOne({ accountNumber: recipientAccount });

    if (!recipient) return res.send("Recipient not found");
    if (sender.accountNumber === recipient.accountNumber) return res.send("Cannot transfer to yourself");
    if (sender.balance < transferAmount) return res.send("Insufficient balance");

    sender.balance -= transferAmount;
    recipient.balance += transferAmount;

    sender.transactions.push({
        type: "Transfer Sent",
        amount: transferAmount,
        description: `Sent to ${recipient.username}`
    });

    recipient.transactions.push({
        type: "Transfer Received",
        amount: transferAmount,
        description: `Received from ${sender.username}`
    });

    await sender.save();
    await recipient.save();

    res.redirect("/transfer-success");
});

// ---------------- GET USER INFO ----------------
app.get("/user-info/:accountNumber", protectUser, async (req, res) => {
    const accountNumber = Number(req.params.accountNumber);
    const user = await User.findOne({ accountNumber });

    if (!user) return res.json({ success: false });
    res.json({ success: true, username: user.username });
});

// ---------------- TRANSFER SUCCESS PAGE ----------------
app.get("/transfer-success", protectUser, (req, res) => {
    res.render("transfer-success");
});

// ---------------- LOGOUT ----------------
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

// ---------------- ADMIN LOGIN ----------------
// ensure any corrupted transaction fields are fixed before admin operations
app.use("/admin", async (req, res, next) => {
    try {
        // convert any non-array transactions field back to an empty array
        await User.updateMany(
            { transactions: { $not: { $type: "array" } } },
            { $set: { transactions: [] } }
        );
    } catch (err) {
        console.error("Error sanitizing transactions", err);
    }
    next();
});

app.get("/admin", (req, res) => {
    res.redirect("/admin/login");
});
// legacy or typo-friendly route
app.get("/admin-login", (req, res) => {
    // redirect to the correct path
    res.redirect("/admin/login");
});

app.get("/admin/login", (req, res) => {
    res.render("admin-login");
});

app.post("/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "admin123") {
        req.session.admin = true;
        res.redirect("/admin/dashboard");
    } else {
        res.send("Invalid admin login");
    }
});

// ---------------- ADMIN DASHBOARD ----------------
app.get("/admin/dashboard", protectAdmin, async (req, res) => {
    const users = await User.find();
    res.render("admin-dashboard", { users, keyword: "" });
});

// ---------------- ADMIN SEARCH ----------------
app.get("/admin/search", protectAdmin, async (req, res) => {
    const keyword = req.query.keyword || "";
    const users = await User.find({ username: { $regex: keyword, $options: "i" } });
    res.render("admin-dashboard", { users, keyword });
});

// ---------------- ADMIN TRANSACTIONS ----------------
app.get("/admin/transactions", protectAdmin, async (req, res) => {
    const users = await User.find();
    let transactions = [];
    users.forEach(user => {
        user.transactions.forEach(t => {
            transactions.push({
                username: user.username,
                accountNumber: user.accountNumber,
                ...t._doc
            });
        });
    });
    res.render("admin-transactions", { transactions });
});

// ---------------- ADMIN ACTIONS ----------------
app.post("/admin/add-money", protectAdmin, async (req, res) => {
    const { accountNumber, amount } = req.body;

    // in case there was corrupted data for this particular user
    await User.updateOne(
        { accountNumber: Number(accountNumber), transactions: { $not: { $type: "array" } } },
        { $set: { transactions: [] } }
    );

    const user = await User.findOne({ accountNumber: Number(accountNumber) });
    if (!user) return res.send("User not found");

    if (!Array.isArray(user.transactions)) user.transactions = [];
    user.balance += Number(amount);
    user.transactions.push({ type: "Admin Deposit", amount: Number(amount), description: "Admin added funds" });
    await user.save();
    res.redirect("/admin/dashboard");
});

app.post("/admin/withdraw", protectAdmin, async (req, res) => {
    const { accountNumber, amount } = req.body;

    // sanitize this user record if needed
    await User.updateOne(
        { accountNumber: Number(accountNumber), transactions: { $not: { $type: "array" } } },
        { $set: { transactions: [] } }
    );

    const user = await User.findOne({ accountNumber: Number(accountNumber) });
    if (!user) return res.send("User not found");
    if (user.balance < Number(amount)) return res.send("Insufficient balance");

    if (!Array.isArray(user.transactions)) user.transactions = [];
    user.balance -= Number(amount);
    user.transactions.push({ type: "Admin Withdraw", amount: Number(amount), description: "Admin withdrew funds" });
    await user.save();
    res.redirect("/admin/dashboard");
});

app.post("/admin/freeze", protectAdmin, async (req, res) => {
    const { accountNumber } = req.body;
    const user = await User.findOne({ accountNumber: Number(accountNumber) });
    if (!user) return res.send("User not found");

    user.frozen = !user.frozen;
    await user.save();
    res.redirect("/admin/dashboard");
});

app.post("/admin/delete", protectAdmin, async (req, res) => {
    const { accountNumber } = req.body;
    await User.deleteOne({ accountNumber: Number(accountNumber) });
    res.redirect("/admin/dashboard");
});

// ---------------- ADMIN LOGOUT ----------------
app.get("/admin/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/admin/login");
});
app.get("/admin/dashboard", protectAdmin, async (req, res) => {
    const users = await User.find();
    res.render("admin-dashboard", { users, keyword: "" });
});

app.get("/admin/search", protectAdmin, async (req, res) => {
    const keyword = req.query.keyword || "";
    const users = await User.find({ username: { $regex: keyword, $options: "i" } });
    res.render("admin-dashboard", { users, keyword });
});
// ---------------- SERVER ----------------
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});