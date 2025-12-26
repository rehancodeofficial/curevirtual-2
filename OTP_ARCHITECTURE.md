# OTP Email Verification System - Architecture & Flow

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         OTP VERIFICATION SYSTEM                      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────┐      ┌──────────────┐      ┌─────────────┐      ┌──────────┐
│             │      │              │      │             │      │          │
│   Frontend  │─────▶│   Backend    │─────▶│  Database   │      │  Email   │
│   (React)   │◀─────│  (Express)   │◀─────│   (MySQL)   │      │ Service  │
│             │      │              │──────▶│             │      │(SendGrid)│
└─────────────┘      └──────────────┘      └─────────────┘      └──────────┘
                              │
                              │
                              ▼
                     ┌────────────────┐
                     │ OTP Generation │
                     │   (Crypto)     │
                     └────────────────┘
```

## 🔄 Complete Registration & Verification Flow

```
┌──────────┐
│  START   │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 1. USER FILLS REGISTRATION FORM                 │
│    - Name, Email, Password, Role                │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 2. FRONTEND SENDS POST /api/auth/register       │
│    Body: { name, email, password, role }        │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 3. BACKEND PROCESSES REGISTRATION                │
│    ✓ Validate input                             │
│    ✓ Check email uniqueness                     │
│    ✓ Hash password (bcrypt)                     │
│    ✓ Create User record                         │
│    ✓ Provision default profile                  │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 4. BACKEND GENERATES OTP                         │
│    ✓ Generate secure 6-digit code (crypto)      │
│    ✓ Calculate expiration (now + 5 min)         │
│    ✓ Delete old unverified OTPs for email       │
│    ✓ Store in EmailOTP table                    │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 5. BACKEND SENDS EMAIL                           │
│    ✓ Check EMAIL_PROVIDER config                │
│    ✓ Format email with HTML template            │
│    ✓ Send via Gmail/SendGrid                    │
│    ✓ Log success/failure                        │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 6. BACKEND RESPONDS TO FRONTEND                  │
│    Response: {                                   │
│      message: "Registration successful",         │
│      user: { id, name, email, role },           │
│      requiresVerification: true                  │
│    }                                             │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 7. FRONTEND SHOWS OTP VERIFICATION PANEL         │
│    ✓ Display 6 input boxes                      │
│    ✓ Show countdown timer (5:00)                │
│    ✓ Enable resend button after expiry          │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 8. USER RECEIVES EMAIL                           │
│    Subject: Email Verification - CureVirtual    │
│    Body: Your code is: 123456                   │
│    (Expires in 5 minutes)                       │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 9. USER ENTERS OTP IN FRONTEND                   │
│    ✓ Auto-focus on next input                   │
│    ✓ Supports paste (Ctrl+V)                    │
│    ✓ Real-time validation                       │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 10. FRONTEND SENDS POST /api/otp/verify          │
│     Body: { email, otp: "123456" }              │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│ 11. BACKEND VERIFIES OTP                         │
│     ✓ Find OTP record in database                │
│     ✓ Check OTP matches                          │
│     ✓ Check not expired (< 5 min)               │
│     ✓ Check not already verified                │
│     ✓ Mark as verified                          │
└────┬────────────────────────────────────────────┘
     │
     ├─── Valid OTP ───▶┌──────────────────────┐
     │                   │ SUCCESS              │
     │                   │ Return: verified=true│
     │                   └──────────────────────┘
     │                            │
     │                            ▼
     │                   ┌──────────────────────┐
     │                   │ REDIRECT TO LOGIN    │
     │                   │ or DASHBOARD         │
     │                   └──────────────────────┘
     │
     └─── Invalid/Expired ──▶┌──────────────────┐
                             │ ERROR            │
                             │ Show error msg   │
                             │ Clear OTP inputs │
                             └──────────────────┘
```

## 🔐 Security Flow

```
┌────────────────────────────────────────────────┐
│           SECURITY MEASURES                     │
└────────────────────────────────────────────────┘

1. OTP GENERATION
   ├─ Uses crypto.randomBytes()
   ├─ 6-digit range (100000-999999)
   └─ Cryptographically secure

2. RATE LIMITING
   ├─ In-memory map tracking
   ├─ 3 requests per minute per email
   └─ Prevents brute force

3. EXPIRATION
   ├─ 5-minute lifetime
   ├─ Timestamp checked on verify
   └─ Auto-cleanup available

4. ONE-TIME USE
   ├─ Verified flag in database
   ├─ Cannot reuse same OTP
   └─ Deleted on new request

5. DATABASE SECURITY
   ├─ Indexed for performance
   ├─ No sensitive data exposure
   └─ Cleanup of old records
```

## 📊 Database Schema

```sql
CREATE TABLE EmailOTP (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  otp        VARCHAR(6) NOT NULL,
  expiresAt  DATETIME NOT NULL,
  verified   BOOLEAN DEFAULT FALSE,
  createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_email (email),
  INDEX idx_expiresAt (expiresAt)
);
```

## 🎨 Frontend Component Hierarchy

```
OTPVerification Component
│
├─ State Management
│  ├─ otp: ['', '', '', '', '', '']
│  ├─ loading: boolean
│  ├─ resending: boolean
│  ├─ timeLeft: number (seconds)
│  └─ canResend: boolean
│
├─ Countdown Timer (useEffect)
│  └─ Updates every second
│
├─ UI Elements
│  ├─ Icon (email)
│  ├─ Title & Description
│  ├─ 6 OTP Input Boxes
│  │  ├─ Auto-focus next
│  │  ├─ Backspace navigation
│  │  └─ Paste support
│  ├─ Countdown Timer Display
│  ├─ Verify Button
│  └─ Action Buttons
│     ├─ Resend Code
│     └─ Back to Registration
│
└─ Event Handlers
   ├─ handleOtpChange()
   ├─ handleKeyDown()
   ├─ handlePaste()
   ├─ handleVerify()
   └─ handleResend()
```

## 🔄 API Endpoints Summary

```
POST /api/auth/register
├─ Creates user
├─ Generates OTP
├─ Sends email
└─ Returns: { user, requiresVerification: true }

POST /api/otp/send
├─ Generates new OTP
├─ Sends email
└─ Returns: { message, expiresAt }

POST /api/otp/verify
├─ Validates OTP
├─ Marks as verified
└─ Returns: { message, verified: true }

POST /api/otp/resend
├─ Deletes old OTP
├─ Generates new OTP
├─ Sends email
└─ Returns: { message, expiresAt }

DELETE /api/otp/cleanup
├─ Deletes expired OTPs
└─ Returns: { message, deletedCount }
```

## 📧 Email Providers Configuration

```
┌─────────────────────────────────────────┐
│        GMAIL/SMTP FLOW                  │
└─────────────────────────────────────────┘

.env Config:
├─ EMAIL_PROVIDER=gmail
├─ EMAIL_HOST=smtp.gmail.com
├─ EMAIL_PORT=587
├─ EMAIL_USER=your-email@gmail.com
└─ EMAIL_PASS=app-password

Flow:
nodemailer → SMTP → Gmail → User Inbox


┌─────────────────────────────────────────┐
│        SENDGRID FLOW                    │
└─────────────────────────────────────────┘

.env Config:
├─ EMAIL_PROVIDER=sendgrid
└─ SENDGRID_API_KEY=SG.xxxxx

Flow:
@sendgrid/mail → SendGrid API → User Inbox
```

## 🧪 Testing Flow

```
1. Registration Test
   ├─ POST /api/auth/register
   ├─ Verify response has requiresVerification
   └─ Check database for EmailOTP record

2. OTP Send Test
   ├─ POST /api/otp/send
   ├─ Check email inbox
   └─ Verify OTP in database

3. Verification Test
   ├─ POST /api/otp/verify with correct OTP
   ├─ Verify success response
   └─ Check verified=true in database

4. Invalid OTP Test
   ├─ POST /api/otp/verify with wrong OTP
   └─ Verify error response

5. Rate Limit Test
   ├─ Send 4 rapid requests
   └─ Verify 4th is rejected

6. Expiration Test
   ├─ Wait 5+ minutes
   ├─ Try to verify
   └─ Verify expiration error

7. Cleanup Test
   ├─ DELETE /api/otp/cleanup
   └─ Verify expired OTPs removed
```

## 📈 Production Monitoring Points

```
Monitor These Metrics:
├─ OTP generation rate
├─ Email delivery success rate
├─ Verification success rate
├─ Average time to verify
├─ Rate limit triggers
├─ Expired OTP percentage
└─ Error rates by type

Alert On:
├─ Email delivery failures
├─ High rate limit triggers
├─ Database connection issues
├─ Unusual verification patterns
└─ Performance degradation
```

## 🎯 Success Metrics

- ✅ OTP generation: < 100ms
- ✅ Email delivery: < 5 seconds
- ✅ Verification check: < 50ms
- ✅ Rate limiting: < 1ms overhead
- ✅ Database cleanup: < 1 second
- ✅ Frontend load: < 200ms

---

This architecture provides a secure, scalable, and user-friendly OTP verification system ready for production use.
