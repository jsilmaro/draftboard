# 🔒 CORS Security Configuration Guide

## 🎯 **When to Apply This**

**Apply this AFTER your Vercel deployment is working correctly** and you've confirmed:
- ✅ Authentication works
- ✅ API endpoints respond properly
- ✅ All functionality is working

## 📋 **Step-by-Step Process**

### **Step 1: Get Your Vercel Domain**

1. **Go to your Vercel dashboard**
2. **Find your deployed project**
3. **Copy your domain URL** - it will look like:
   - `https://your-app-name.vercel.app` (default)
   - `https://your-custom-domain.com` (if you set up a custom domain)

### **Step 2: Update the CORS Configuration**

**File to edit:** `server/index.js`

**Current configuration (temporary - allows all origins):**
```javascript
app.use(cors({
  origin: true, // Allow all origins for now
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

**Replace with (secure - restricts to your domain):**
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://draftboard-b44q.vercel.app', // Replace with your actual domain
        'https://www.draftboard-b44q.vercel.app', // Include www version
        'https://draftboard-b44q-git-master-jsilmaros-projects.vercel.app',
        'https://draftboard-b44q-guyh12yl8-jsilmaros-projects.vercel.app',
        // Add custom domains if you have them:
        // 'https://your-custom-domain.com',
        // 'https://www.your-custom-domain.com'
      ]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
```

### **Step 3: Test Locally First**

1. **Test the change locally:**
   ```bash
   npm run dev
   ```

2. **Verify everything still works:**
   - ✅ Authentication
   - ✅ API calls
   - ✅ All functionality

### **Step 4: Deploy to Vercel**

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "feat: Restrict CORS to production domain for security"
   git push
   ```

2. **Vercel will automatically redeploy**

### **Step 5: Verify Production**

1. **Test your production site**
2. **Check that authentication still works**
3. **Verify all API endpoints respond correctly**

## 🔍 **Example Configurations**

### **For Default Vercel Domain:**
```javascript
origin: [
  'https://my-brand-creator-app.vercel.app',
  'https://www.my-brand-creator-app.vercel.app'
]
```

### **For Custom Domain:**
```javascript
origin: [
  'https://myapp.com',
  'https://www.myapp.com',
  'https://api.myapp.com' // If you have separate API domain
]
```

### **For Multiple Environments:**
```javascript
origin: process.env.NODE_ENV === 'production' 
  ? [
      'https://myapp.com',
      'https://www.myapp.com'
    ]
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ]
```

## ⚠️ **Common Issues & Solutions**

### **Issue: CORS Error After Restriction**
**Symptoms:** Browser shows CORS error in console
**Solution:** 
1. Check that your domain is exactly correct (including https://)
2. Make sure you're testing from the correct domain
3. Clear browser cache and try again

### **Issue: Authentication Fails**
**Symptoms:** Google OAuth or JWT authentication stops working
**Solution:**
1. Verify your domain is in the allowed origins list
2. Check that `credentials: true` is set
3. Ensure your Google OAuth redirect URI matches your domain

### **Issue: API Calls Fail**
**Symptoms:** 401/403 errors on API requests
**Solution:**
1. Check that your frontend is making requests from the allowed domain
2. Verify the Authorization header is being sent correctly
3. Check Vercel function logs for specific errors

## 🔧 **Troubleshooting Commands**

### **Check Current CORS Configuration:**
```bash
# In your browser console on your production site:
fetch('/api/test-db', {
  method: 'GET',
  credentials: 'include'
}).then(r => r.json()).then(console.log)
```

### **Test CORS Headers:**
```bash
# Using curl to test CORS headers:
curl -H "Origin: https://your-domain.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-domain.vercel.app/api/test-db
```

## 🎯 **Security Benefits**

After applying this restriction:

- ✅ **Prevents unauthorized domains** from accessing your API
- ✅ **Protects against CSRF attacks**
- ✅ **Improves security posture**
- ✅ **Complies with security best practices**
- ✅ **Maintains functionality** for your legitimate users

## 📞 **Need Help?**

If you encounter issues:
1. **Revert to `origin: true`** temporarily to confirm it's a CORS issue
2. **Check Vercel function logs** for specific error messages
3. **Verify your domain** is exactly correct
4. **Test with browser dev tools** to see specific CORS errors

## 🚀 **Final Checklist**

Before going live with restricted CORS:
- [ ] Your Vercel domain is working correctly
- [ ] All authentication methods work
- [ ] All API endpoints respond properly
- [ ] You've tested the restricted CORS configuration
- [ ] You have a backup plan (can revert if needed)
- [ ] Your domain is correctly specified in the CORS configuration
