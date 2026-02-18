# Insightful HR - Backend Setup Guide

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or bun package manager

## Installation

1. **Install dependencies**
```bash
cd insightful-hr-backend
npm install
# or with bun
bun install
```

2. **Setup Environment Variables**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/insightful-hr
NODE_ENV=development
PORT=5001
JWT_SECRET=your_super_secret_jwt_key_change_in_production
FRONTEND_URL=http://localhost:5173
```

## MongoDB Setup

### Option 1: Local MongoDB (Windows)

1. **Download and Install MongoDB Community Server**
   - Download from: https://www.mongodb.com/try/download/community
   - Run the installer and follow the setup wizard
   - Choose "Install MongoDB as a Service" for automatic startup

2. **Start MongoDB Service**
   ```bash
   # MongoDB should start automatically if installed as service
   # Or start manually:
   mongod
   ```

3. **Verify Connection**
   ```bash
   mongosh
   # or
   mongo
   ```

### Option 2: MongoDB Atlas (Cloud)

1. **Create MongoDB Atlas Account**
   - Go to: https://www.mongodb.com/cloud/atlas
   - Create a new project
   - Create a cluster

2. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Update `MONGODB_URI` in `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/insightful-hr?retryWrites=true&w=majority
   ```

## Running the Backend

### Development Mode
```bash
npm run dev
# or with bun
bun run dev
```

The server will start on `http://localhost:5001`

### Build for Production
```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register-company` - Register a new company
- `POST /api/auth/request-otp` - Request OTP for email
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Users
- `GET /api/users` - Get all users in company (requires auth)
- `POST /api/users/:userId/attendance` - Create attendance record
- `GET /api/users/:userId/attendance` - Get attendance records
- `POST /api/users/:userId/tasks` - Create task
- `GET /api/users/:userId/tasks` - Get tasks
- `PUT /api/users/tasks/:taskId` - Update task
- `GET /api/users/:userId/appraisals` - Get appraisals

## Testing the API

### 1. Register Company
```bash
curl -X POST http://localhost:5001/api/auth/register-company \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "domain": "acme.com",
    "superAdminName": "John Doe",
    "superAdminEmail": "admin@acme.com",
    "superAdminPassword": "Password123"
  }'
```

### 2. Request OTP
```bash
curl -X POST http://localhost:5001/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "employee@acme.com"}'
```

### 3. Register User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "employee@acme.com",
    "phone": "1234567890",
    "password": "Password123",
    "role": "employee",
    "department": "Engineering",
    "position": "Software Developer",
    "otp": "123456"
  }'
```

### 4. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@acme.com",
    "password": "Password123"
  }'
```

## Database Schema

### Companies Collection
- `_id`: ObjectId
- `name`: String
- `domain`: String (unique)
- `superAdminId`: String
- `createdAt`: Date
- `updatedAt`: Date

### Users Collection
- `_id`: ObjectId
- `companyId`: String (indexed)
- `email`: String (unique)
- `password`: String (hashed)
- `name`: String
- `role`: String (enum: super_admin, hr_manager, admin_staff, employee)
- `department`: String
- `position`: String
- `phone`: String
- `isActive`: Boolean
- `joinDate`: Date
- `createdAt`: Date
- `updatedAt`: Date

### Attendance Collection
- `userId`: String (indexed)
- `companyId`: String (indexed)
- `date`: String
- `checkIn`: String
- `checkOut`: String
- `status`: String (enum: present, absent, late, half-day)
- `workingHours`: Number

### Tasks Collection
- `userId`: String (indexed)
- `companyId`: String (indexed)
- `title`: String
- `description`: String
- `project`: String
- `status`: String (enum: pending, in-progress, completed)
- `priority`: String (enum: low, medium, high)
- `dueDate`: String
- `completedAt`: String

### Appraisals Collection
- `userId`: String (indexed)
- `companyId`: String (indexed)
- `employeeName`: String
- `department`: String
- `month`: String
- `year`: Number
- `attendanceScore`: Number
- `punctualityScore`: Number
- `taskCompletionScore`: Number
- `projectScore`: Number
- `overallScore`: Number
- `status`: String (enum: pending, reviewed, approved, rejected)
- `finalRating`: String

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB service is running
- Check `MONGODB_URI` in `.env`
- Verify firewall/security settings for Atlas connection

### Port Already in Use
- Change PORT in `.env`
- Or kill process using port 5001

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -r node_modules
npm install
```

## Next Steps

1. Update frontend to use backend API
2. Replace localStorage with API calls
3. Implement token storage in localStorage
4. Add error handling for API responses
5. Test end-to-end flow
