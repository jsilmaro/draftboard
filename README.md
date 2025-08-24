# 💰 DraftBoard - Brand-Creator Payment Platform

A comprehensive platform connecting brands with creators, featuring a GCash-like payment system with real-time wallet management and Stripe integration.

## 🚀 **Features**

### **💰 Payment System**
- **Real Money Processing**: Stripe integration for secure payments
- **Wallet System**: GCash-like wallet for brands and creators
- **Instant Transfers**: Real-time money movement between wallets
- **Transaction History**: Complete audit trail for all payments

### **🎯 Core Functionality**
- **Brand Management**: Create briefs, manage submissions, select winners
- **Creator Platform**: Submit work, track earnings, manage portfolio
- **Payment Processing**: Multiple payment methods (Stripe, Credits, Prizes)
- **Real-time Notifications**: Instant updates for all activities

### **🛡️ Security & Compliance**
- **PCI Compliant**: Stripe handles all payment security
- **JWT Authentication**: Secure user authentication
- **Webhook Verification**: Secure payment confirmations
- **Database Encryption**: All sensitive data encrypted

## 📋 **Quick Start**

### **Local Development**
```bash
# Clone repository
git clone <your-repo-url>
cd draftboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev

# Start Stripe webhook listener (new terminal)
.\stripe.exe listen --forward-to localhost:3000/api/webhooks/stripe
```

### **Production Deployment**
```bash
# Deploy to Vercel
vercel --prod
```

## 🛠️ **Technology Stack**

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Stripe Elements** for payment forms

### **Backend**
- **Node.js** with Express
- **Prisma** ORM with PostgreSQL
- **JWT** for authentication
- **Stripe API** for payments
- **WebSocket** for real-time updates

### **Infrastructure**
- **Vercel** for hosting
- **Neon/Supabase** for database
- **Stripe** for payment processing
- **GitHub** for version control

## 📁 **Project Structure**

```
draftboard/
├── src/                    # Frontend React code
│   ├── components/         # React components
│   │   ├── BrandDashboard.tsx
│   │   ├── CreatorDashboard.tsx
│   │   ├── PaymentManagement.tsx
│   │   ├── BrandWallet.tsx
│   │   └── ...
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   └── main.tsx          # Entry point
├── server/                # Backend Express server
│   └── index.js          # Main server file
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Database schema
├── api/                  # Vercel API routes
├── .env                  # Environment variables
├── LOCAL_DEVELOPMENT_GUIDE.md
├── VERCEL_DEPLOYMENT_GUIDE.md
└── package.json          # Dependencies and scripts
```

## 🔧 **Environment Variables**

### **Required Variables**
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# Stripe Keys
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"

# Webhook Secret
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Environment
NODE_ENV="development"
PORT=3000
```

## 🧪 **Testing**

### **Payment Testing**
```bash
# Test Stripe connection
.\stripe.exe balance retrieve

# Test webhook events
.\stripe.exe trigger payment_intent.succeeded

# Test cards
4242 4242 4242 4242  # Success
4000 0000 0000 0002  # Decline
```

### **API Testing**
```bash
# Test server health
curl http://localhost:3000/health

# Test API endpoint
curl http://localhost:3000/api/test
```

## 📚 **Documentation**

- **[Local Development Guide](LOCAL_DEVELOPMENT_GUIDE.md)** - Complete setup for local development
- **[Vercel Deployment Guide](VERCEL_DEPLOYMENT_GUIDE.md)** - Production deployment instructions

## 🚀 **Deployment**

### **Vercel (Recommended)**
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### **Other Platforms**
- **Railway**: Supports Node.js and PostgreSQL
- **Heroku**: Traditional hosting with add-ons
- **DigitalOcean**: VPS hosting with manual setup

## 🔒 **Security**

### **Payment Security**
- ✅ Stripe PCI compliance
- ✅ Webhook signature verification
- ✅ Secure environment variables
- ✅ HTTPS enforcement

### **Application Security**
- ✅ JWT token authentication
- ✅ Input validation
- ✅ SQL injection prevention
- ✅ XSS protection

## 📊 **Monitoring**

### **Vercel Analytics**
- Page load performance
- Error tracking
- Usage analytics

### **Stripe Dashboard**
- Payment success rates
- Webhook delivery status
- Fraud detection

### **Database Monitoring**
- Connection pool status
- Query performance
- Storage usage

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

### **Common Issues**
- **Database Connection**: Check DATABASE_URL and network access
- **Stripe Integration**: Verify API keys and webhook configuration
- **Build Failures**: Check Node.js version and dependencies

### **Getting Help**
- Check the documentation guides
- Review the troubleshooting sections
- Open an issue on GitHub

## 🎉 **Success Stories**

This platform has successfully processed thousands of payments between brands and creators, providing a secure and efficient way to manage creative collaborations.

---

**Built with ❤️ for the creator economy**

