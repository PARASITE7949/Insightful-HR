# 🏢 Insightful HR - Full Stack Application

A comprehensive Human Resources management system with React frontend and Node.js backend.

## 📁 Project Structure

```
insightful-hr-main/
│
├── client/                          # 🎨 React Frontend (Vite)
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── contexts/               # Auth context
│   │   ├── pages/                  # Page components
│   │   ├── lib/
│   │   │   ├── apiClient.ts        # API service
│   │   │   └── storage.ts          # Local storage
│   │   ├── types/                  # TypeScript types
│   │   └── App.tsx                 # Main app
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── README.md
│
├── server/                          # ⚙️ Express Backend
│   ├── src/
│   │   ├── models/                 # Mongoose models
│   │   ├── controllers/            # Request handlers
│   │   ├── routes/                 # API routes
│   │   ├── middleware/             # Express middleware
│   │   ├── config/                 # Configuration
│   │   ├── utils/                  # Utilities
│   │   ├── types/                  # TypeScript types
│   │   └── index.ts                # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── README.md
│
├── docs/                            # 📚 Documentation
│   ├── API.md                      # API reference
│   ├── SETUP.md                    # Setup guide
│   ├── TESTING.md                  # Testing guide
│   └── DATABASE.md                 # Database schema
│
├── .gitignore                       # Git ignore rules
├── README.md                        # This file
├── SETUP.md                         # Quick setup guide
└── package.json                     # Root scripts (optional)
```

## 🚀 Quick Start

### Prerequisites
- Node.js v16+ and npm
- MongoDB (local or Atlas)
- Git

### 1️⃣ Clone/Setup Project

```bash
cd insightful-hr-main
```

### 2️⃣ Setup Backend

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB connection
npm run dev
```

✅ Backend runs on: `http://localhost:5001`

### 3️⃣ Setup Frontend (New Terminal)

```bash
cd ../client
npm install
cp .env.example .env
npm run dev
```

✅ Frontend runs on: `http://localhost:5173`

### 4️⃣ Test the Application

Open browser: `http://localhost:5173`

Follow the [E2E Testing Guide](docs/TESTING.md) for detailed testing procedures.

## 📋 Project Features

### 👤 User Management
- Multi-role support (Super Admin, HR Manager, Admin, Employee)
- User registration with OTP verification
- JWT-based authentication
- Company-based data isolation

### 📊 Attendance System
- Daily check-in/check-out tracking
- Attendance status management
- Working hours calculation
- Monthly reports

### 📝 Task Management
- Task creation and assignment
- Priority and status tracking
- Due date management
- Task completion logging

### 📈 Performance Appraisals
- Monthly/yearly appraisals
- Performance scoring
- AI-powered analysis (extensible)
- Appraisal workflow

### 🔐 Security
- Password hashing (bcrypt)
- JWT authentication
- Role-based access control
- Rate limiting
- Audit logging

## 🛠 Tech Stack

### Frontend
- React 18.3
- TypeScript 5.8
- Vite 5.4
- React Router 6.30
- React Hook Form 7.61
- Tailwind CSS 3.4
- Shadcn/ui Components
- Recharts 2.15

### Backend
- Node.js + Express 4.18
- MongoDB + Mongoose 8.0
- TypeScript 5.3
- JWT Authentication
- bcrypt Password Hashing
- Morgan Logging
- Helmet Security

## 📖 Documentation

| Document | Purpose |
|----------|---------|
| [Setup Guide](SETUP.md) | Complete setup instructions |
| [API Documentation](docs/API.md) | API endpoints reference |
| [Testing Guide](docs/TESTING.md) | E2E testing procedures |
| [Database Schema](docs/DATABASE.md) | Database structure |
| [Client README](client/README.md) | Frontend documentation |
| [Server README](server/README.md) | Backend documentation |

## 🧪 Testing

### API Testing
```bash
# Test server is running
curl http://localhost:5001/health

# See detailed testing guide
cat docs/TESTING.md
```

### Browser Testing
1. Open http://localhost:5173
2. Register company and user
3. Test all features
4. Follow [Testing Guide](docs/TESTING.md)

## 🗄️ Database Setup

### Option 1: Local MongoDB
```bash
# Install MongoDB Community Edition
# Windows: Download from https://www.mongodb.com/try/download/community

# Start MongoDB service
mongod

# Or in background
start mongod
```

### Option 2: MongoDB Atlas (Cloud)
```bash
# Create account at https://www.mongodb.com/cloud/atlas
# Create cluster and get connection string
# Update MONGODB_URI in server/.env
```

## 📚 API Endpoints

### Authentication
```
POST   /api/auth/register-company
POST   /api/auth/request-otp
POST   /api/auth/verify-otp
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Users & Operations
```
GET    /api/users
POST   /api/users/:userId/attendance
GET    /api/users/:userId/attendance
POST   /api/users/:userId/tasks
GET    /api/users/:userId/tasks
PUT    /api/users/tasks/:taskId
GET    /api/users/:userId/appraisals
```

See [API Documentation](docs/API.md) for complete reference.

## 🔧 Available Scripts

### Frontend
```bash
cd client

npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run test       # Run tests
npm run lint       # Run ESLint
```

### Backend
```bash
cd server

npm run dev        # Start development server with hot reload
npm run build      # Build TypeScript
npm start          # Start production server
npm run lint       # Run ESLint
npm run test       # Run tests
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `server/.env`
- Verify connection string format

### Port Already in Use
```bash
# Find process using port 5001
lsof -i :5001
# or
netstat -ano | findstr :5001

# Kill process
kill -9 <PID>
# or
taskkill /PID <PID> /F
```

### Module Not Found
```bash
# Reinstall dependencies
cd client && npm install
cd ../server && npm install
```

### CORS Issues
- Check `FRONTEND_URL` in `server/.env`
- Verify CORS configuration in `server/src/index.ts`

See [Testing Guide](docs/TESTING.md#troubleshooting) for more issues.

## 📦 Dependencies

### Frontend
See [client/package.json](client/package.json)

### Backend
See [server/package.json](server/package.json)

## 🚢 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the dist/ folder
```

### Backend Deployment (Heroku/Railway)
```bash
cd server
npm run build
npm start
```

Set environment variables in deployment platform.

## 🔐 Security Considerations

- ✅ Passwords hashed with bcrypt
- ✅ JWT tokens (7 days expiry)
- ✅ Role-based access control
- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Audit logging

## 📞 Support

1. **Setup Issues** → See [SETUP.md](SETUP.md)
2. **API Issues** → See [docs/API.md](docs/API.md)
3. **Testing Problems** → See [docs/TESTING.md](docs/TESTING.md)
4. **Database Questions** → See [docs/DATABASE.md](docs/DATABASE.md)

## 📝 Project Status

✅ Backend: Production Ready
✅ Frontend: Production Ready
✅ Database: Fully Integrated
✅ Authentication: Implemented
✅ Testing: Complete Guide
✅ Documentation: Comprehensive
✅ Security: Multiple Layers
✅ Ready for Deployment

## 📄 License

Proprietary - All rights reserved

## 👥 Team

Built with ❤️ for HR Management

---

**Next Steps**: 
1. Follow [SETUP.md](SETUP.md)
2. Complete [docs/TESTING.md](docs/TESTING.md)
3. Deploy to production
4. Monitor and maintain

**Questions?** Check the relevant documentation or see [Troubleshooting](docs/TESTING.md#troubleshooting).
#   I n s i g h t f u l - H R  
 #   I n s i g h t f u l - H R  
 #   I n s i g h t f u l - H R  
 #   I n s i g h t f u l - H R  
 #   I n s i g h t f u l - H R  
 #   I n s i g h t f u l - H R  
 #   I n s i g h t f u l - H R  
 #   I n s i g h t f u l - H R  
 