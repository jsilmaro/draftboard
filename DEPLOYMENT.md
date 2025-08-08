# Deployment Guide

This guide will help you deploy your Brand-Creator Platform to various hosting platforms.

## Quick Deploy Options

### 1. Railway (Recommended - Easiest)

**Steps:**
1. Go to [Railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `draftboard` repository
5. Add environment variables:
   - `JWT_SECRET`: Generate a secure random string
   - `DATABASE_URL`: Railway will auto-generate this
   - `PORT`: Railway will set this automatically
6. Deploy!

**Railway will automatically:**
- Install dependencies
- Run database migrations
- Start your application
- Provide a public URL

### 2. Render

**Steps:**
1. Go to [Render.com](https://render.com)
2. Sign up and connect your GitHub
3. Create a new "Web Service"
4. Select your repository
5. Configure:
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm run dev`
   - **Environment**: Node.js
6. Add environment variables (same as Railway)
7. Deploy!

### 3. Vercel + Railway (Split Deployment)

**Frontend (Vercel):**
1. Go to [Vercel.com](https://vercel.com)
2. Import your repository
3. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable: `VITE_API_URL` (your Railway backend URL)

**Backend (Railway):**
- Follow Railway steps above
- Update frontend to use Railway URL

## Environment Variables

Set these in your deployment platform:

```env
DATABASE_URL="postgresql://username:password@host:port/database"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
```

## Database Setup

The application uses PostgreSQL with Prisma. Railway and Render will handle the database setup automatically. Make sure to use a PostgreSQL database URL in your DATABASE_URL environment variable.

## File Uploads

The application supports file uploads to the `uploads/` directory. Most platforms will handle this automatically.

## Troubleshooting

### Common Issues:

1. **Database not found**: Run `npx prisma migrate deploy` in your deployment platform
2. **JWT errors**: Make sure `JWT_SECRET` is set
3. **CORS errors**: Update your frontend to use the correct backend URL
4. **File uploads not working**: Check if the `uploads/` directory exists

### Local Testing:

```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

## Production Considerations

1. **Security**: Change the JWT_SECRET to a secure random string
2. **Database**: Consider using PostgreSQL for production (Railway/Render support this)
3. **File Storage**: Use cloud storage (AWS S3, Cloudinary) for file uploads
4. **HTTPS**: All platforms provide HTTPS automatically
5. **Monitoring**: Set up logging and monitoring for production

## Support

If you encounter issues:
1. Check the platform's logs
2. Verify environment variables are set correctly
3. Ensure database migrations have run
4. Check that all dependencies are installed 