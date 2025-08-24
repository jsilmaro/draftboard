# 🚀 Vercel Deployment Guide

## 📋 **Prerequisites**

### **Required Accounts:**
- ✅ Vercel account (free tier available)
- ✅ Stripe account (for payments)
- ✅ Database provider (Neon, Supabase, Railway, etc.)

### **Required Setup:**
- ✅ Local development environment working
- ✅ Git repository with your code
- ✅ Database URL for production

---

## 🛠️ **Pre-Deployment Setup**

### **1. Prepare Your Code**

#### **Update Environment Variables**
Create a `.env.production` file (don't commit this):
```env
# Database (Production)
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secret (Production)
JWT_SECRET="your-super-secret-production-jwt-key"

# Stripe Keys (Live Mode for Production)
STRIPE_SECRET_KEY="sk_live_your_live_stripe_secret_key"
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_your_live_stripe_publishable_key"

# Webhook Secret (Production)
STRIPE_WEBHOOK_SECRET="whsec_your_production_webhook_secret"

# Environment
NODE_ENV="production"
```

#### **Update Vite Config for Production**
Ensure your `vite.config.ts` handles production builds:
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.vercel.app' 
          : 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
```

### **2. Database Setup**

#### **Create Production Database**
1. **Neon** (Recommended): https://neon.tech
2. **Supabase**: https://supabase.com
3. **Railway**: https://railway.app

#### **Run Production Migrations**
```bash
# Set production DATABASE_URL
export DATABASE_URL="your_production_database_url"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### **3. Stripe Production Setup**

#### **Switch to Live Mode**
1. Go to Stripe Dashboard: https://dashboard.stripe.com
2. Toggle to "Live" mode
3. Get your live keys:
   - **Publishable Key**: `pk_live_...`
   - **Secret Key**: `sk_live_...`

#### **Create Production Webhook**
1. Go to Stripe Dashboard → Webhooks
2. Click "Add endpoint"
3. Enter URL: `https://your-domain.vercel.app/api/webhooks/stripe`
4. Select events:
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `charge.succeeded`
   - ✅ `charge.failed`
5. Copy the webhook secret: `whsec_...`

---

## 🚀 **Deploy to Vercel**

### **1. Connect to Vercel**

#### **Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

#### **Option B: Vercel Dashboard**
1. Go to https://vercel.com
2. Click "New Project"
3. Import your Git repository
4. Configure settings

### **2. Configure Vercel Settings**

#### **Build Settings**
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

#### **Environment Variables**
Add these in Vercel Dashboard → Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# JWT Secret
JWT_SECRET=your-super-secret-production-jwt-key

# Stripe Keys (Live Mode)
STRIPE_SECRET_KEY=sk_live_your_live_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_stripe_publishable_key

# Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret

# Environment
NODE_ENV=production
```

### **3. Deploy**

#### **First Deployment**
```bash
# Deploy to production
vercel --prod
```

#### **Subsequent Deployments**
```bash
# Deploy to production
vercel --prod

# Or push to main branch (if connected to Git)
git push origin main
```

---

## 🔧 **Post-Deployment Configuration**

### **1. Verify Deployment**

#### **Check Your Domain**
- **Production URL**: `https://your-project.vercel.app`
- **Health Check**: `https://your-project.vercel.app/health`
- **API Test**: `https://your-project.vercel.app/api/test`

#### **Test Database Connection**
```bash
# Test database connection
curl https://your-project.vercel.app/api/test
```

### **2. Test Stripe Integration**

#### **Test Production Webhook**
```bash
# Test webhook (replace with your domain)
curl -X POST https://your-project.vercel.app/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: test" \
  -d '{"type":"test"}'
```

#### **Test Payment Flow**
1. **Open your production URL**
2. **Login as brand user**
3. **Test wallet top-up** with live Stripe
4. **Test payment to creators**

### **3. Monitor Webhooks**

#### **In Stripe Dashboard**
1. Go to Webhooks → Your Endpoint
2. Check "Events" tab
3. Verify successful deliveries
4. Monitor for failed deliveries

#### **In Vercel Dashboard**
1. Go to your project
2. Check "Functions" tab
3. Monitor API route performance
4. Check for errors

---

## 🛡️ **Security & Best Practices**

### **1. Environment Variables**
- ✅ Never commit `.env` files
- ✅ Use Vercel's environment variable system
- ✅ Rotate secrets regularly
- ✅ Use different secrets for dev/prod

### **2. Database Security**
- ✅ Use connection pooling
- ✅ Enable SSL connections
- ✅ Restrict database access
- ✅ Regular backups

### **3. Stripe Security**
- ✅ Use live keys only in production
- ✅ Verify webhook signatures
- ✅ Monitor for suspicious activity
- ✅ Enable fraud detection

### **4. Application Security**
- ✅ Enable HTTPS (automatic with Vercel)
- ✅ Set secure headers
- ✅ Validate all inputs
- ✅ Rate limiting

---

## 📊 **Monitoring & Analytics**

### **1. Vercel Analytics**
- **Performance**: Monitor page load times
- **Errors**: Track JavaScript errors
- **Usage**: Monitor bandwidth and requests

### **2. Stripe Dashboard**
- **Payments**: Monitor successful/failed payments
- **Webhooks**: Track webhook delivery status
- **Fraud**: Monitor for suspicious activity

### **3. Database Monitoring**
- **Connection Pool**: Monitor database connections
- **Query Performance**: Track slow queries
- **Storage**: Monitor database size

---

## 🔄 **Continuous Deployment**

### **1. Automatic Deployments**
```bash
# Connect to Git repository
# Push to main branch triggers deployment
git push origin main
```

### **2. Preview Deployments**
```bash
# Create preview deployment
vercel

# Deploy specific branch
vercel --prod
```

### **3. Rollback**
```bash
# Rollback to previous deployment
vercel rollback

# Or use Vercel Dashboard
# Go to Deployments → Select version → Promote
```

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **1. Build Failures**
```bash
# Check build logs in Vercel Dashboard
# Verify all dependencies are installed
# Check for TypeScript errors
```

#### **2. Database Connection Issues**
```bash
# Verify DATABASE_URL is correct
# Check database is accessible from Vercel
# Test connection locally with production URL
```

#### **3. Stripe Webhook Failures**
```bash
# Verify webhook URL is correct
# Check webhook secret matches
# Test webhook signature verification
```

#### **4. Environment Variable Issues**
```bash
# Verify all variables are set in Vercel
# Check variable names match code
# Ensure no typos in values
```

### **Debug Commands**
```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Test production API
curl https://your-project.vercel.app/api/test

# Check environment variables
vercel env ls
```

---

## 🎯 **Success Criteria**

### **✅ Production Ready:**
- [ ] Application deploys successfully
- [ ] Database connects and works
- [ ] Stripe integration works with live keys
- [ ] Webhooks process correctly
- [ ] All payment flows work
- [ ] No security vulnerabilities
- [ ] Performance is acceptable

### **✅ Monitoring Active:**
- [ ] Vercel analytics enabled
- [ ] Stripe dashboard monitoring
- [ ] Database monitoring active
- [ ] Error tracking configured

### **✅ Security Verified:**
- [ ] HTTPS enabled
- [ ] Environment variables secure
- [ ] Database access restricted
- [ ] Stripe webhooks verified

**Your application is now live in production! 🎉**

