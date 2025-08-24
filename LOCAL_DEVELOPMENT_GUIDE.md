# 🚀 Local Development Guide

## 📋 **Prerequisites**

### **Required Software:**
- ✅ Node.js (v18 or higher)
- ✅ npm or yarn
- ✅ Git
- ✅ PostgreSQL database (or Neon, Supabase, etc.)

### **Required Accounts:**
- ✅ Stripe account (for payments)
- ✅ Database provider account

---

## 🛠️ **Setup Instructions**

### **1. Clone and Install**
```bash
# Clone the repository
git clone <your-repo-url>
cd draftboard

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### **2. Environment Setup**
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/draftboard"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-here"

# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# Webhook Secret (Local Development)
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Environment
NODE_ENV="development"
PORT=3000
```

### **3. Database Setup**
```bash
# Run database migrations
npx prisma migrate dev

# (Optional) Seed database with test data
npx prisma db seed
```

### **4. Install Stripe CLI**
```bash
# Windows (using the downloaded stripe.exe)
# Already included in the project

# macOS
brew install stripe/stripe-cli/stripe

# Linux
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

---

## 🚀 **Running the Application**

### **1. Start Development Server**
```bash
# Start both frontend and backend
npm run dev
```

**Expected Output:**
```
🚀 SERVER STARTED SUCCESSFULLY!
🌐 LOCALHOST URL: http://localhost:3000
✅ Ready to use! Open http://localhost:3000 in your browser
```

### **2. Start Stripe Webhook Listener**
```bash
# In a new terminal window
.\stripe.exe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Expected Output:**
```
Ready! You are using Stripe API Version [2025-07-30.basil]
Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### **3. Access the Application**
- **Frontend**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **API Test**: http://localhost:3000/api/test

---

## 🧪 **Testing the Payment System**

### **1. Test Stripe Connection**
```bash
# Test Stripe API
.\stripe.exe balance retrieve

# Test webhook events
.\stripe.exe trigger payment_intent.succeeded
```

### **2. Test Complete Payment Flow**

#### **Step 1: Brand Login**
1. Open http://localhost:3000
2. Login as a brand user
3. Verify dashboard loads

#### **Step 2: Add Funds to Wallet**
1. Go to Wallet section
2. Click "Add Funds"
3. Enter amount: $50
4. Use test card: `4242 4242 4242 4242`
5. Submit payment

#### **Step 3: Send Payment to Creator**
1. Go to Payment Management
2. Select a winner
3. Choose "💰 Wallet Balance (Real Money)"
4. Enter amount: $25
5. Send payment

#### **Step 4: Verify Creator Receives Payment**
1. Login as creator
2. Go to Creator Wallet
3. Check balance and transactions

### **3. Test Cards**
```bash
# Successful payments
4242 4242 4242 4242  # Visa
5555 5555 5555 4444  # Mastercard
3782 822463 10005    # American Express

# Failed payments
4000 0000 0000 0002  # Generic decline
4000 0000 0000 9995  # Insufficient funds
```

---

## 🔧 **Development Commands**

### **Database Commands**
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio

# Seed database
npx prisma db seed
```

### **Server Commands**
```bash
# Start server only
npm run server

# Start client only
npm run client

# Start both (development)
npm run dev

# Build for production
npm run build
```

### **Stripe Commands**
```bash
# Login to Stripe
.\stripe.exe login

# Listen to webhooks
.\stripe.exe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
.\stripe.exe trigger payment_intent.succeeded
.\stripe.exe trigger payment_intent.payment_failed

# View logs
.\stripe.exe logs tail
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Server Won't Start**
```bash
# Check if port 3000 is in use
netstat -ano | findstr :3000

# Kill process using port 3000
taskkill /PID [PID_NUMBER] /F

# Restart server
npm run dev
```

#### **2. Database Connection Issues**
```bash
# Check DATABASE_URL in .env
# Ensure database is running
# Test connection
npx prisma db push
```

#### **3. Stripe Connection Issues**
```bash
# Check Stripe keys in .env
# Test Stripe connection
.\stripe.exe balance retrieve

# Restart webhook listener
.\stripe.exe listen --forward-to localhost:3000/api/webhooks/stripe
```

#### **4. Webhook Not Working**
```bash
# Check webhook secret
# Verify webhook listener is running
# Test webhook events
.\stripe.exe trigger payment_intent.succeeded
```

### **Debug Commands**
```bash
# Test server health
curl http://localhost:3000/health

# Test API endpoint
curl http://localhost:3000/api/test

# Check environment variables
echo $env:DATABASE_URL
echo $env:STRIPE_SECRET_KEY
```

---

## 📁 **Project Structure**
```
draftboard/
├── src/                    # Frontend React code
│   ├── components/         # React components
│   ├── contexts/          # React contexts
│   └── main.tsx          # Entry point
├── server/                # Backend Express server
│   └── index.js          # Main server file
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Database schema
├── api/                  # Vercel API routes
├── .env                  # Environment variables
└── package.json          # Dependencies and scripts
```

---

## 🎯 **Success Criteria**

### **✅ All Systems Working:**
- [ ] Server starts without errors
- [ ] Database connects successfully
- [ ] Stripe integration works
- [ ] Webhook events process
- [ ] Frontend loads correctly
- [ ] Login works for both user types
- [ ] Wallet top-up works
- [ ] Payment to creators works
- [ ] Transaction history updates

### **✅ No Errors:**
- [ ] No 500 errors in console
- [ ] No database connection errors
- [ ] No Stripe API errors
- [ ] No webhook timeout errors

**Your local development environment is ready! 🎉**

