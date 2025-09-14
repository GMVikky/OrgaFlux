# 🚀 Quick Local Setup Instructions

## Step 1: Prerequisites
Make sure you have **Node.js** (v16+) installed on your system.
- Download from: https://nodejs.org/

## Step 2: Install Dependencies
Open terminal in the project folder and run:
```bash
npm install
```

## Step 3: Environment Setup (Optional for basic testing)
Create a `.env` file in the root directory:
```env
VITE_RAZORPAY_KEY_ID=your_key_here
VITE_GOOGLE_FORM_URL=your_form_url_here
```

## Step 4: Start the Application
```bash
npm run dev
```

The website will open automatically at: **http://localhost:5173**

## 🎉 That's it!
You can now:
- Browse products
- Add items to cart
- Test the checkout flow (payment will be in test mode)

## For Full Payment Integration:
1. Sign up at https://razorpay.com/
2. Get your test API keys
3. Update the `.env` file with your keys

## Need Help?
Check the detailed `README.md` file for complete setup instructions.