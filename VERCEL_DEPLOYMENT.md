# Vercel Deployment Guide

## 🚀 Deploying to Vercel

This guide will help you deploy your Brand-Creator Platform to Vercel.

## 📋 Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Neon Database**: Your PostgreSQL database should be set up on Neon
4. **Google OAuth**: Your Google OAuth credentials should be configured

## 🔧 Environment Variables Setup

Before deploying, you need to set up the following environment variables in Vercel:

### Required Environment Variables

1. **DATABASE_URL**
   ```
   your-neon-database-connection-string
   ```

2. **JWT_SECRET**
   ```
   your-super-secret-jwt-key-change-this-in-production
   ```

3. **NODE_ENV**
   ```
   production
   ```

4. **VITE_GOOGLE_CLIENT_ID** (Frontend)
   ```
   your-google-client-id
   ```

5. **GOOGLE_CLIENT_ID** (Backend)
   ```
   your-google-client-id
   ```

## 🚀 Deployment Steps

### Step 1: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing your project

### Step 2: Configure Project Settings

1. **Framework Preset**: Select "Other"
2. **Root Directory**: Leave as `./` (root)
3. **Build Command**: `npm run vercel-build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install`

### Step 3: Set Environment Variables

1. In the project settings, go to "Environment Variables"
2. Add each environment variable listed above
3. Make sure to set them for **Production**, **Preview**, and **Development** environments

### Step 4: Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your application
3. The deployment process will:
   - Install dependencies
   - Run Prisma generate
   - Build the React frontend
   - Deploy the serverless functions

## 🔍 Post-Deployment Verification

### 1. Check API Endpoints

Test your API endpoints:
- Health check: `https://your-domain.vercel.app/health`
- API test: `https://your-domain.vercel.app/api/test-db`

### 2. Test Authentication

1. Try to register/login with Google OAuth
2. Verify that JWT tokens are working
3. Test protected routes

### 3. Test Database Connection

1. Check if the database connection is working
2. Verify that data is being saved/retrieved correctly

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check if Neon database is accessible
   - Ensure SSL mode is properly configured

2. **Build Errors**
   - Check if all dependencies are in package.json
   - Verify TypeScript compilation
   - Check for missing environment variables

3. **API 404 Errors**
   - Verify vercel.json routing configuration
   - Check if serverless functions are deployed correctly

4. **CORS Errors**
   - Verify frontend is making requests to the correct API URL
   - Check CORS configuration in server/index.js

### Debug Commands

```bash
# Check build logs
vercel logs

# Check function logs
vercel logs --function api/index.js

# Redeploy with debug info
vercel --debug
```

## 🔄 Continuous Deployment

Once set up, Vercel will automatically:
- Deploy on every push to the main branch
- Create preview deployments for pull requests
- Provide automatic HTTPS certificates
- Handle CDN distribution

## 📊 Monitoring

Vercel provides:
- Real-time analytics
- Function execution logs
- Performance monitoring
- Error tracking

## 🔒 Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **JWT Secret**: Use a strong, unique JWT secret in production
3. **Database**: Ensure your Neon database has proper security settings
4. **CORS**: Configure CORS properly for your domain

## 🎯 Production Checklist

- [ ] All environment variables are set
- [ ] Database is accessible and working
- [ ] Google OAuth is configured for production domain
- [ ] JWT secret is strong and unique
- [ ] All API endpoints are working
- [ ] Frontend is loading correctly
- [ ] File uploads are working (if applicable)
- [ ] Error handling is in place
- [ ] Performance is acceptable

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with production environment variables
4. Check Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
