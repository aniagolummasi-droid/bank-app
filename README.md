# Bank App

A full-stack banking application built with **Node.js**, **Express**, **MongoDB**, and **EJS**. Features user registration, login, fund transfers, and an admin dashboard for managing accounts.

---

## Features

✅ **User Authentication**
- Register a new account
- Secure login with bcrypt password hashing
- Session management

✅ **User Dashboard**
- View account balance
- View account number
- View transaction history

✅ **Money Transfer**
- Transfer funds to other accounts
- Track transfer history
- Receive confirmation page

✅ **Admin Dashboard**
- View all users
- Search users by username
- Manage user accounts (freeze/unfreeze, delete)
- Add/withdraw funds from user accounts
- View all transactions across the platform

✅ **Security**
- Password hashing with bcrypt
- Session validation
- Admin-only protected routes
- Frozen account detection

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **Template Engine:** EJS
- **Authentication:** bcrypt, express-session
- **Hosting:** Render

---

## Installation (Local Setup)

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aniagolummasi-droid/bank-app.git
   cd bank-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory:
   ```
   MONGODB_URI=mongodb://127.0.0.1:27017/bankDB
   PORT=3000
   ```
   
   **For MongoDB Atlas:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bankDB?retryWrites=true&w=majority
   PORT=3000
   ```

4. **Run the server:**
   ```bash
   node app.js
   ```

5. **Access the app:**
   Open `http://localhost:3000` in your browser.

---

## Testing Locally

### Create a Test User
Run the provided script to add a test user:
```bash
node scripts/add_test_user.js
```

This creates:
- **Username:** testuser
- **Password:** test123
- **Balance:** $100

### User Login
- URL: `http://localhost:3000/login`
- Username: `testuser`
- Password: `test123`

### Admin Login
- URL: `http://localhost:3000/admin/login`
- Username: `admin`
- Password: `admin123`

---

## Project Structure

```
bank-app/
├── app.js                 # Main Express application
├── package.json          # Dependencies
├── .env                  # Environment variables
├── models/
│   └── user.js          # MongoDB User schema
├── scripts/
│   ├── add_test_user.js # Script to create test user
│   └── clean_transactions.js # Data cleanup utility
└── views/               # EJS templates
    ├── register.ejs     # User registration page
    ├── login.ejs        # User login page
    ├── dashboard.ejs    # User dashboard
    ├── transfer-success.ejs # Transfer confirmation
    ├── admin-login.ejs  # Admin login page
    ├── admin-dashboard.ejs # Admin dashboard
    └── admin-transactions.ejs # Transaction history
```

---

## Routes

### User Routes
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/` | Redirect to login | ❌ |
| GET | `/register` | Registration page | ❌ |
| POST | `/register` | Register user | ❌ |
| GET | `/login` | Login page | ❌ |
| POST | `/login` | Login user | ❌ |
| GET | `/dashboard` | User dashboard | ✅ |
| POST | `/transfer` | Transfer funds | ✅ |
| GET | `/transfer-success` | Transfer confirmation | ✅ |
| GET | `/logout` | Logout user | ✅ |

### Admin Routes
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/admin/login` | Admin login page | ❌ |
| POST | `/admin/login` | Admin login | ❌ |
| GET | `/admin/dashboard` | View all users | ✅ Admin |
| GET | `/admin/search` | Search users | ✅ Admin |
| GET | `/admin/transactions` | View all transactions | ✅ Admin |
| POST | `/admin/add-money` | Add funds to account | ✅ Admin |
| POST | `/admin/withdraw` | Withdraw from account | ✅ Admin |
| POST | `/admin/freeze` | Freeze/unfreeze account | ✅ Admin |
| POST | `/admin/delete` | Delete user account | ✅ Admin |
| GET | `/admin/logout` | Logout admin | ✅ Admin |

---

## Database Schema

### User Collection
```javascript
{
  username: String,           // Unique username
  password: String,           // Bcrypt hashed password
  accountNumber: Number,      // Unique 10-digit account number
  balance: Number,            // Account balance (default: 0)
  frozen: Boolean,            // Account frozen status (default: false)
  transactions: [
    {
      type: String,           // "Transfer Sent", "Transfer Received", "Admin Deposit", etc.
      amount: Number,         // Transaction amount
      description: String,    // Transaction details
      date: Date             // Timestamp (default: current date)
    }
  ]
}
```

---

## Deployment to Render

### Step 1: Set Up MongoDB Atlas
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Add a database user with a secure password
4. Allow network access from `0.0.0.0/0`
5. Copy the connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/bankDB?retryWrites=true&w=majority
   ```

### Step 2: Deploy to Render
1. Push your code to GitHub
2. Go to [Render.com](https://render.com)
3. Click **New Web Service** and select your GitHub repo
4. Configure:
   - **Name:** bank-app
   - **Build Command:** `npm install`
   - **Start Command:** `node app.js`
   - **Environment Variable:**
     - `MONGODB_URI` = (your Atlas connection string from Step 1)
5. Click **Create Web Service**

### Step 3: Verify Deployment
- Once live, visit your Render URL (e.g., `https://bank-app-xxxx.onrender.com`)
- Test with admin or user login
- Check Render logs if you encounter errors

---

## Troubleshooting

### "MongoDB connection error: bad auth"
- Verify your credentials in the connection string
- Check that the database user has read/write permissions
- Ensure the IP `0.0.0.0/0` is whitelisted in Atlas Network Access

### "User not found" on login
- Register a new user at `/register`
- Or use the test user created by `scripts/add_test_user.js`

### Port already in use
- Change `PORT` in `.env` to an available port
- Or kill the process using port 3000

### Build failure on Render
- Ensure `package.json` exists and is valid
- Set Build Command to `npm install`
- Clear build cache and redeploy

---

## Security Notes

⚠️ **For Production:**
- Replace the simple memory session store with `connect-mongo`
- Use environment variables for sensitive data (never commit `.env`)
- Enable HTTPS (Render does this automatically)
- Use stronger admin credentials
- Implement rate limiting
- Add input validation and sanitization

---

## Future Enhancements

- 📧 Email notifications for transactions
- 🔐 Two-factor authentication
- 📊 Advanced analytics dashboard
- 💳 Payment gateway integration
- 🔔 Real-time notifications
- 📱 Mobile app

---

## Contributing

Feel free to fork, modify, and improve! Pull requests are welcome.

---

## License

ISC

---

## Support

For issues or questions, contact the developer or open an issue on GitHub.

**Happy Banking! 🏦**
