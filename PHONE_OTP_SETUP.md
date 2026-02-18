# Phone OTP Verification & Super Admin Approval System

## Overview
This document explains the new phone-based OTP verification and super admin approval workflow implemented in the Insightful HR system.

## Workflow

### User Registration Flow
1. **User Signs Up** → Provides name, email, phone, password, role, department, position
2. **OTP Sent to Phone** → Server sends 6-digit OTP via Twilio SMS to the phone number
3. **User Verifies OTP** → User enters OTP received on phone
4. **Account Created** → User created with `approvedBySuperAdmin: false` and `phoneVerified: true`
5. **Awaiting Approval** → User sees "Pending Approval" message, redirected to login
6. **Super Admin Reviews** → Super admin views pending users at `/super-admin/pending-approvals`
7. **Super Admin Approves/Rejects** → User can login only after approval

### Login Flow
- **Before Approval**: Login rejected with "Your account is pending super admin approval" message
- **After Approval**: User can login normally
- **Super Admin**: Can login immediately without approval requirement (created directly as super_admin)

## Server-Side Implementation

### 1. User Model Updates (`server/src/models/User.ts`)
Added fields:
```typescript
phone: String (required)
phoneVerified: Boolean (default: false)
otpPhone: String (stores OTP temporarily)
otpPhoneExpiresAt: Date (OTP expiration)
approvedBySuperAdmin: Boolean (default: false)
```

### 2. SMS Service (`server/src/utils/sms.ts`)
- Twilio integration for sending OTP via SMS
- Falls back to console logging if Twilio not configured (development)
- Configurable via environment variables

### 3. Auth Controller Endpoints

#### `POST /api/auth/request-otp`
Request OTP for phone number
```json
{
  "email": "user@company.com",
  "phone": "+1234567890"
}
```

#### `POST /api/auth/verify-otp`
Verify OTP code
```json
{
  "email": "user@company.com",
  "otp": "123456"
}
```

#### `POST /api/auth/register`
Register user (after OTP verification)
```json
{
  "name": "John Doe",
  "email": "john@company.com",
  "phone": "+1234567890",
  "password": "secure123",
  "role": "employee",
  "department": "Engineering",
  "position": "Developer",
  "otp": "123456"  // Must match verified OTP
}
```
Returns: User created but not logged in (approval pending)

#### `POST /api/auth/login`
Login now checks `approvedBySuperAdmin` before issuing token

#### `GET /api/auth/pending-approvals`
Get list of pending users (super_admin only)
```json
{
  "success": true,
  "data": {
    "pendingCount": 3,
    "users": [
      {
        "_id": "uuid",
        "name": "Jane Smith",
        "email": "jane@company.com",
        "phone": "+1234567890",
        "role": "hr_manager",
        "department": "HR",
        "position": "HR Manager",
        "createdAt": "2026-02-09T..."
      }
    ]
  }
}
```

#### `POST /api/auth/approve-user`
Approve pending user (super_admin only)
```json
{
  "userId": "uuid"
}
```

#### `POST /api/auth/reject-user`
Reject pending user (super_admin only)
```json
{
  "userId": "uuid",
  "reason": "Name verification failed"
}
```
Result: User marked as inactive

### 4. Routes (`server/src/routes/authRoutes.ts`)
All new endpoints registered with auth middleware protection.

## Client-Side Implementation

### 1. Registration Changes (`client/src/pages/Register.tsx`)
- Phone input now required
- Three-step process: form → OTP verification → pending approval message
- Shows registration summary while awaiting approval

### 2. OTP Component (`client/src/components/OTPVerification.tsx`)
- Updated to call server for OTP request
- Uses apiClient for server communication
- Displays development mode OTP if available
- 60-second resend countdown

### 3. Pending Approvals Dashboard (`client/src/pages/admin/PendingApprovals.tsx`)
- Super admin only page at `/super-admin/pending-approvals`
- Shows all pending users with details
- Approve/Reject buttons with confirmation
- Real-time updates after action

### 4. App Routes (`client/src/App.tsx`)
Added route:
```typescript
<Route path="/super-admin/pending-approvals" element={<ProtectedRoute allowedRoles={["super_admin"]}><PendingApprovals /></ProtectedRoute>} />
```

## Environment Setup

### Server `.env` Configuration
```bash
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid  # From Twilio Console
TWILIO_AUTH_TOKEN=your_auth_token    # From Twilio Console
TWILIO_PHONE_NUMBER=+1234567890      # Your Twilio phone number

# CORS - Update to include all client ports
FRONTEND_URLS=http://localhost:8082,http://localhost:8083,http://localhost:8084

# Other existing configs...
PORT=5001
MONGODB_URI=mongodb://localhost:27017/insightful-hr
NODE_ENV=development
```

### Twilio Setup (Production)
1. Create Twilio account at https://www.twilio.com
2. Get Account SID and Auth Token from Console
3. Provision a phone number
4. Set environment variables
5. Remove development fallback in production

### Development Mode
If Twilio not configured, OTP sent to console:
```
[SMS] OTP for +1234567890: 123456
```

## Feature Flags & Customization

### Phone Validation
Current: 10-digit US format
Update `Register.tsx` for international formats:
```typescript
// Validate phone for your region
const countryCode = "+1"; // US
const phoneDigits = formData.phone.replace(/\D/g, "");
const isValid = phoneDigits.length >= 10; // Min length
```

### OTP Expiration
Default: 5 minutes
Edit `authController.ts`:
```typescript
const expiresAt = Date.now() + 5 * 60 * 1000; // Change this
```

### OTP Length
Default: 6 digits
Update in both server and client:
- Server: `generateOTP()` in `server/src/utils/auth.ts`
- Client: `OTPVerification.tsx` maxLength

## Testing

### Test Super Admin Approval Flow

1. **Create Company & Super Admin**
   ```bash
   POST /api/auth/register-company
   {
     "name": "Test Company",
     "domain": "testco.com",
     "superAdminName": "Admin User",
     "superAdminEmail": "admin@testco.com",
     "superAdminPassword": "admin123"
   }
   ```

2. **Register New Employee (Development)**
   ```bash
   # Request OTP
   POST /api/auth/request-otp
   {
     "email": "john@testco.com",
     "phone": "+1234567890"
   }
   # Response will show OTP in development
   
   # Verify OTP
   POST /api/auth/verify-otp
   {
     "email": "john@testco.com",
     "otp": "returned_otp"
   }
   
   # Register
   POST /api/auth/register
   {
     "name": "John Doe",
     "email": "john@testco.com",
     "phone": "+1234567890",
     "password": "john123",
     "role": "employee",
     "department": "Engineering",
     "position": "Developer",
     "otp": "verified_otp"
   }
   ```

3. **Try Login Before Approval** (should fail)
   ```bash
   POST /api/auth/login
   {
     "email": "john@testco.com",
     "password": "john123"
   }
   # Returns: "Your account is pending super admin approval"
   ```

4. **Super Admin Approves User**
   ```bash
   # Login as super admin first
   POST /api/auth/login
   {
     "email": "admin@testco.com",
     "password": "admin123"
   }
   
   # Get pending users
   GET /api/auth/pending-approvals
   # Use Authorization header: Bearer token
   
   # Approve user
   POST /api/auth/approve-user
   {
     "userId": "john_user_id"
   }
   ```

5. **Login After Approval** (should succeed)
   ```bash
   POST /api/auth/login
   {
     "email": "john@testco.com",
     "password": "john123"
   }
   # Returns: token and user data
   ```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "OTP not found" | Requested OTP but didn't verify | Request new OTP |
| "Invalid OTP" | Wrong code entered | Check SMS and re-enter |
| "OTP expired" | 5+ minutes passed | Click "Resend OTP" |
| "Account pending approval" | Super admin hasn't reviewed yet | Wait for approval email |
| "Twilio: Failed to send SMS" | Invalid phone or no Twilio config | Verify phone format, check env vars |
| "Cannot approve users from other companies" | Cross-company access attempt | Only approve your company's users |

## API Response Examples

### Successful Registration
```json
{
  "success": true,
  "message": "Registration successful. Awaiting super admin approval.",
  "data": {
    "userId": "aab02f33-...",
    "user": {
      "id": "aab02f33-...",
      "name": "Jane Smith",
      "email": "jane@company.com",
      "phone": "+1234567890",
      "role": "hr_manager",
      "companyId": "uuid",
      "approvedBySuperAdmin": false
    }
  }
}
```

### Login Before Approval
```json
{
  "success": false,
  "message": "Your account is pending super admin approval"
}
```

### Login After Approval
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "aab02f33-...",
      "name": "Jane Smith",
      "email": "jane@company.com",
      "phone": "+1234567890",
      "role": "hr_manager",
      "department": "HR",
      "position": "HR Manager",
      "companyId": "uuid"
    }
  }
}
```

## Migration from Old System

If you have existing users:
1. Backfill `phone` field (required now)
2. Set `phoneVerified: true` for existing trusted users (or `false` if you want them to re-verify)
3. Set `approvedBySuperAdmin: true` for already-active employees
4. Keep `approvedBySuperAdmin: false` for new registrations

```javascript
// MongoDB migration
db.users.updateMany({}, { approvedBySuperAdmin: true })
```

## Next Steps

1. Configure Twilio(production setup)
2. Test end-to-end flow in development
3. Deploy to staging
4. Run load testing on OTP endpoints
5. Monitor Twilio usage and costs
6. Implement email notification when user approved
7. Add approval expiration (auto-reject after N days)
8. Add audit logging for approvals
