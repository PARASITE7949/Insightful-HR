# 🚀 Quick Setup Guide

Get the Insightful HR application running in 30 minutes.

## Prerequisites

✅ **Node.js** v16+ - [Download](https://nodejs.org/)
✅ **MongoDB** - See below
✅ **npm** or **yarn** or **bun**
✅ **Git** (optional)

## Step 1: MongoDB Setup (5 minutes)

### Option A: Local MongoDB (Windows)

1. Download from: https://www.mongodb.com/try/download/community
2. Run installer and follow wizard
3. MongoDB will start as Windows Service automatically
4. Verify: Open Command Prompt and type `mongosh`

### Option B: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and free cluster
3. Get connection string
4. Update in `server/.env` (see Step 3)

## Step 2: Install Dependencies (10 minutes)

### Backend Setup

```bash
cd server
npm install
```

Takes ~3-5 minutes

### Frontend Setup

```bash
cd ../client
npm install
```

Takes ~3-5 minutes

## Step 3: Configure Environment

### Backend Configuration

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/insightful-hr
PORT=5001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration

```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_API_URL=http://localhost:5001/api
```

## Step 4: Start Application (5 minutes)

### Terminal 1: Start Backend

```bash
cd server
npm run dev
```

Expected output:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5001
```

### Terminal 2: Start Frontend

```bash
cd client
npm run dev
```

Expected output:
```
VITE v5.4.19  ready in 500 ms

➜  Local:   http://localhost:5173/
```

## Step 5: Access Application

Open browser: **http://localhost:5173**

## ✅ Initial Testing

### 1. Company Registration
- Click "Create Company Account"
- Fill in test data:
  - Company: Tech Corp
  - Domain: techcorp.com
  - Admin Name: John Admin
  - Email: admin@techcorp.com
  - Password: Admin@123
- Submit

### 2. Employee Registration
- Click "Register as Employee"
- Fill in:
  - Email: john@techcorp.com
  - Password: Pass@123
  - Name: John Developer
  - Role: Employee
  - Department: Engineering
  - Position: Developer
- Request OTP (check console in dev mode)
- Enter OTP and submit

### 3. Login
- Email: john@techcorp.com
- Password: Pass@123
- Click Login

### 4. Test Features
- Attendance: Mark check-in/check-out
- Tasks: Create and update tasks
- Profile: View user information

## 🧪 Full Testing Guide

See [Testing Guide](docs/TESTING.md) for:
- 12 API test cases
- Database verification
- Troubleshooting
- Performance monitoring

## 📁 Project Structure

```
insightful-hr-main/
├── client/                # React Frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── server/                # Express Backend
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── docs/                  # Documentation
└── README.md              # Main README
```

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB won't connect | Ensure `mongod` is running |
| Port 5001 in use | Change `PORT=5001` in `.env` |
| Port 5173 in use | Vite will auto-use different port |
| Module not found | Run `npm install` again |
| API not responding | Check backend is running on 5001 |
| CORS errors | Verify `FRONTEND_URL` in `server/.env` |

## 📖 Detailed Documentation

- **Setup**: See [SETUP.md](SETUP.md) (this file)
- **Testing**: See [docs/TESTING.md](docs/TESTING.md)
- **API**: See [docs/API.md](docs/API.md)
- **Database**: See [docs/DATABASE.md](docs/DATABASE.md)
- **Backend**: See [server/README.md](server/README.md)
- **Frontend**: See [client/README.md](client/README.md)

## 🎯 Next Steps

### For Development
1. ✅ Setup complete
2. Open http://localhost:5173
3. Start building features
4. Follow testing guide for validation

### For Testing
1. ✅ Setup complete
2. Follow [docs/TESTING.md](docs/TESTING.md)
3. Run all 12 API tests
4. Verify database data

### For Deployment
1. ✅ Setup complete
2. Build frontend: `cd client && npm run build`
3. Build backend: `cd server && npm run build`
4. Deploy to cloud platform
5. Configure environment variables

## 💡 Tips

- **Keep terminals open**: You'll need both backend and frontend running
- **Check console**: Frontend shows useful debugging info
- **Save credentials**: Remember test user credentials
- **Check logs**: Backend shows all requests and errors
- **Browser DevTools**: Use F12 to debug frontend

## 🚀 You're Ready!

```
✅ MongoDB running
✅ Backend running on http://localhost:5001
✅ Frontend running on http://localhost:5173
✅ Ready to test and develop
```

Happy coding! 🎉

---

**Issues?** Check [Troubleshooting](#-quick-troubleshooting) or see [docs/TESTING.md](docs/TESTING.md#troubleshooting)
