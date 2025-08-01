# Brand-Creator Platform Dashboard

A comprehensive platform connecting brands with creators, featuring user management, brief management, submission tracking, and analytics.

## Features

### User Management
- **Smart Login System**: Automatically detects whether a user is a brand or creator
- **User Registration**: Separate registration flows for brands and creators
- **User Verification**: Track verification status for all users

### Admin Dashboard
- **Overview**: Key metrics and statistics
- **Brand Management**: View and manage all registered brands
- **Creator Management**: View and manage all registered creators
- **Brief Management**: Monitor campaign briefs and their status
- **Submission Monitoring**: Track creator submissions and their approval status
- **Payout Management**: Monitor and track creator payouts
- **Analytics**: Comprehensive analytics on platform usage and revenue

### For Brands
- Company profile with logo upload
- Contact information management
- Banking verification (mocked)
- Dashboard with analytics
- Creator discovery (coming soon)

### For Creators
- Professional profile creation
- Portfolio showcase
- Social media integration
- Banking verification (mocked)
- Brand discovery (coming soon)

### Key Features
- **No Authentication Required**: Admin dashboard is accessible without login (for demo purposes)
- **Real-time Data**: Connected to backend API for live data
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS for a clean, professional look

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form handling
- **Vite** for development and building

### Backend
- **Node.js** with Express.js
- **SQLite** with Prisma ORM
- **bcrypt** for password hashing
- **jsonwebtoken** for authentication
- **multer** for file uploads

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd brand-creator-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
   PORT=3001
   ```

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start both the backend server (port 3001) and frontend development server (port 3000).

## Project Structure

```
├── server/                 # Backend server
│   └── index.js           # Express server with API routes
├── src/                   # Frontend React application
│   ├── components/        # React components
│   │   ├── LandingPage.tsx
│   │   ├── BrandForm.tsx
│   │   ├── CreatorForm.tsx
│   │   ├── BrandDashboard.tsx
│   │   └── CreatorDashboard.tsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── App.tsx           # Main app component
│   └── main.tsx          # React entry point
├── prisma/               # Database schema and migrations
│   └── schema.prisma
├── uploads/              # File uploads directory
└── package.json
```

## Routes

- `/` - Landing page with registration options
- `/login` - Smart login form (detects user type)
- `/admin` - Admin dashboard (no login required)
- `/brand/register` - Brand registration
- `/creator/register` - Creator registration
- `/brand/dashboard` - Brand dashboard (requires login)
- `/creator/dashboard` - Creator dashboard (requires login)

## API Endpoints

### Authentication
- `POST /api/brands/register` - Brand registration
- `POST /api/brands/login` - Brand login
- `POST /api/creators/register` - Creator registration
- `POST /api/creators/login` - Creator login
- `GET /api/profile` - Get user profile (protected)

### Admin Endpoints
- `GET /api/admin/brands` - Get all brands
- `GET /api/admin/creators` - Get all creators
- `GET /api/admin/briefs` - Get all briefs
- `GET /api/admin/submissions` - Get all submissions
- `GET /api/admin/analytics` - Get platform analytics

### File Uploads
- Logo uploads are handled via multer and stored in the `uploads/` directory

## Database Schema

The platform includes models for:
- **Brands**: Company information, verification status
- **Creators**: User profiles, portfolios, verification status
- **Briefs**: Campaign details, requirements, budgets
- **Submissions**: Creator submissions with approval workflow

### Brand Model
- `id` - Unique identifier
- `companyName` - Company name
- `contactInfo` - Contact information
- `contactName` - Contact person name
- `logo` - Logo file path (optional)
- `email` - Email address (unique)
- `password` - Hashed password
- `bankingInfo` - Banking information (mocked)
- `isVerified` - Verification status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Creator Model
- `id` - Unique identifier
- `userName` - Username (unique)
- `email` - Email address (unique)
- `password` - Hashed password
- `fullName` - Full name
- `socialHandles` - Social media handles (JSON string)
- `portfolio` - Portfolio URL (optional)
- `bankingInfo` - Banking information (mocked)
- `isVerified` - Verification status
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Brief Model
- `id` - Unique identifier
- `title` - Brief title
- `description` - Brief description
- `requirements` - Campaign requirements
- `budget` - Campaign budget
- `deadline` - Submission deadline
- `status` - Brief status (draft, active, completed, cancelled)
- `brandId` - Associated brand
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

### Submission Model
- `id` - Unique identifier
- `briefId` - Associated brief
- `creatorId` - Associated creator
- `content` - Submission content
- `files` - File URLs (JSON string)
- `amount` - Payout amount
- `status` - Submission status (pending, approved, rejected)
- `submittedAt` - Submission timestamp
- `reviewedAt` - Review timestamp
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

## Development Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run server` - Start only the backend server
- `npm run client` - Start only the frontend development server
- `npm run build` - Build the frontend for production
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio for database management

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected routes with middleware
- Input validation and sanitization
- File upload restrictions

## Admin Features

### Overview Dashboard
- Total brands and creators
- Active briefs count
- Monthly revenue tracking

### User Management
- View all registered users
- Track verification status
- Manage user accounts

### Brief Management
- Monitor campaign briefs
- Track submission counts
- Manage brief status

### Submission Monitoring
- Review creator submissions
- Approve/reject submissions
- Track payout amounts

### Analytics
- Platform usage statistics
- Revenue analytics
- User growth metrics

## Future Enhancements

- Email verification
- Real banking integration
- Messaging system between brands and creators
- Advanced search and filtering
- Payment processing
- Mobile app development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. 