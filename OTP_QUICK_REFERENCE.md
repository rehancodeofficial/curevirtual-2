# 🚀 OTP System - Quick Reference Card

## ⚡ Quick Setup (2 Minutes)

### 1. Choose Email Provider

**Gmail (Easy Setup):**

```bash
# Get app password from: https://myaccount.google.com/apppasswords
# Add to .env:
EMAIL_PROVIDER=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=xxxx-xxxx-xxxx-xxxx
```

**SendGrid (Production):**

```bash
# Get API key from: https://sendgrid.com
# Add to .env:
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxx
```

### 2. Restart Backend

```bash
docker-compose restart backend
```

### 3. Test It

```bash
./test_otp_system.sh
```

---

## 📋 API Cheat Sheet

### Send OTP

```bash
curl -X POST http://localhost:5001/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Verify OTP

```bash
curl -X POST http://localhost:5001/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "otp": "123456"}'
```

### Resend OTP

```bash
curl -X POST http://localhost:5001/api/otp/resend \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

## 🎨 Frontend Integration

### Basic Usage

```jsx
import OTPVerification from "./components/OTPVerification";

function App() {
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState("");

  return showOTP ? (
    <OTPVerification
      email={email}
      onVerified={() => navigate("/dashboard")}
      onBack={() => setShowOTP(false)}
    />
  ) : (
    <RegistrationForm
      onSuccess={(email) => {
        setEmail(email);
        setShowOTP(true);
      }}
    />
  );
}
```

---

## 🔧 Common Tasks

### Check OTP in Database

```bash
docker exec curevirtual2-db-1 mysql -u root -prootpassword \
  curevirtual_db -e "SELECT * FROM EmailOTP WHERE email='user@example.com';"
```

### View Backend Logs

```bash
docker logs curevirtual2-backend-1 -f
```

### Restart Services

```bash
docker-compose restart backend
docker-compose restart frontend
```

### Run Database Migration

```bash
docker exec curevirtual2-backend-1 npx prisma db push
```

---

## 🐛 Troubleshooting One-Liners

### Email Not Sending?

```bash
# Check logs for email errors
docker logs curevirtual2-backend-1 | grep -i "email\|otp"
```

### OTP Not Working?

```bash
# Check if OTP exists in database
docker exec curevirtual2-db-1 mysql -u root -prootpassword \
  curevirtual_db -e "SELECT * FROM EmailOTP ORDER BY createdAt DESC LIMIT 5;"
```

### Rate Limit Issues?

```bash
# Restart backend to clear in-memory rate limits
docker-compose restart backend
```

### Database Out of Sync?

```bash
# Sync schema
docker exec curevirtual2-backend-1 npx prisma db push
docker-compose restart backend
```

---

## 📊 Environment Variables Reference

```env
# Required
DATABASE_URL="mysql://root:rootpassword@localhost:3307/curevirtual_db"
JWT_SECRET="your-secret-key"

# Email (Choose One Provider)
EMAIL_PROVIDER=gmail                    # or 'sendgrid'
FROM_EMAIL=noreply@curevirtual.com

# If using Gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# If using SendGrid
SENDGRID_API_KEY=SG.your-api-key

# Optional
PORT=5001
NODE_ENV=development
```

---

## ⚙️ Configuration Options

### Change OTP Length

**File:** `lib/otpGenerator.js`

```javascript
// 4-digit: const otp = (num % 9000) + 1000;
// 6-digit: const otp = (num % 900000) + 100000;  // Default
// 8-digit: const otp = (num % 90000000) + 10000000;
```

### Change Expiration Time

**File:** `lib/otpGenerator.js`

```javascript
function getOTPExpiration() {
  expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 min (default)
  // Change to 10: expiresAt.setMinutes(expiresAt.getMinutes() + 10);
}
```

### Change Rate Limit

**File:** `routes/otp.js`

```javascript
const RATE_LIMIT_WINDOW = 60000; // 1 minute (default)
const MAX_REQUESTS_PER_WINDOW = 3; // 3 requests (default)
```

---

## 🚨 Production Checklist

```
[ ] Switch to SendGrid from Gmail
[ ] Set strong JWT_SECRET
[ ] Configure HTTPS
[ ] Set up Redis for rate limiting
[ ] Add email monitoring/alerts
[ ] Set up OTP cleanup cron job
[ ] Test email delivery thoroughly
[ ] Configure proper CORS origins
[ ] Add security logging
[ ] Test error scenarios
```

---

## 📁 Key Files Location

```
Backend:
├─ lib/otpGenerator.js          → OTP generation logic
├─ lib/emailService.js          → Email sending
├─ routes/otp.js                → API endpoints
├─ routes/auth.js               → Registration integration
└─ prisma/schema.prisma         → Database model

Frontend:
├─ components/OTPVerification.jsx  → UI component
└─ components/OTPVerification.css  → Styling

Documentation:
├─ OTP_SETUP_GUIDE.md           → Full setup guide
├─ OTP_IMPLEMENTATION_SUMMARY.md → Implementation details
├─ OTP_ARCHITECTURE.md          → System architecture
└─ .env.example                 → Environment template
```

---

## 🎯 Most Common Use Cases

### 1. New User Registration

```javascript
// Auto-sends OTP on registration
POST /api/auth/register
→ Returns: { requiresVerification: true }
→ Show OTPVerification component
```

### 2. Manual OTP Request

```javascript
// For existing users or resend
POST /api/otp/send
→ Sends email
→ Show verification panel
```

### 3. Email Verification

```javascript
// After user enters code
POST /api/otp/verify
→ Validates OTP
→ Redirect to dashboard
```

---

## 💡 Pro Tips

1. **Gmail Setup:** Use app-specific password, NOT regular password
2. **Testing:** Use `./test_otp_system.sh` for quick validation
3. **Logs:** Always check `docker logs curevirtual2-backend-1`
4. **Database:** OTPs auto-expire, run cleanup periodically
5. **Rate Limits:** Restart backend to reset in-memory limits
6. **Production:** Always use SendGrid for reliability
7. **Security:** Never log OTP values in production

---

## 🔗 Quick Links

- **Full Setup:** `web/backend/OTP_SETUP_GUIDE.md`
- **Architecture:** `OTP_ARCHITECTURE.md`
- **Summary:** `OTP_IMPLEMENTATION_SUMMARY.md`
- **Test Script:** `./test_otp_system.sh`

---

## 🆘 Emergency Commands

```bash
# Complete reset
docker-compose down
docker-compose up -d --build

# Database sync
docker exec curevirtual2-backend-1 npx prisma db push

# View all OTPs
docker exec curevirtual2-db-1 mysql -u root -prootpassword \
  curevirtual_db -e "SELECT * FROM EmailOTP;"

# Clear all OTPs
docker exec curevirtual2-db-1 mysql -u root -prootpassword \
  curevirtual_db -e "DELETE FROM EmailOTP;"
```

---

**System Status:** ✅ Production Ready  
**Last Updated:** 2025-12-24  
**Version:** 1.0.0
