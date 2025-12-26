# CureVirtual V2.0 - Production Deployment Checklist

## Pre-Deployment Checklist

### 1. Code Quality & Testing ✅

- [ ] **All unit tests passing**

  ```bash
  npm test
  ```

- [ ] **Integration tests passed**

  - Payment flow
  - Order workflow
  - Prescription dispatch
  - Video calling

- [ ] **Security audit completed**

  - No SQL injection vulnerabilities
  - XSS prevention verified
  - CSRF protection enabled
  - Input validation on all endpoints

- [ ] ** Code review completed**
  - All PRs reviewed
  - No critical TODOs remaining
  - Deprecated code removed

### 2. Database & Data ✅

- [ ] **Production database created**

  - MySQL 8.0+ configured
  - Proper user permissions set
  - Connection pooling configured

- [ ] **Migrations executed**

  ```bash
  npx prisma migrate deploy
  ```

- [ ] **Seed data loaded** (if needed)

  ```bash
  node prisma/seed.js
  ```

- [ ] **Backup strategy implemented**

  - Automated daily backups
  - Point-in-time recovery enabled
  - Backup restoration tested

- [ ] **Database indexes optimized**
  - Query performance verified
  - Slow query log analyzed

### 3. Environment Configuration ✅

- [ ] **Production .env file configured**

```bash
# Server
NODE_ENV=production
PORT=5001
API_VERSION=v1
FRONTEND_URL=https://curevirtual.com

# Database
DATABASE_URL="mysql://user:password@host:3306/curevirtual_prod?schema=public"

# JWT
JWT_SECRET=CHANGE_THIS_TO_64_CHAR_RANDOM_STRING
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=CHANGE_THIS_TO_64_CHAR_RANDOM_STRING
REFRESH_TOKEN_EXPIRES_IN=30d

# Stripe (PRODUCTION KEYS!)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Pharmacy Subscription Price IDs
STRIPE_PRICE_ID_PHARMACY_MONTHLY=price_...
STRIPE_PRICE_ID_PHARMACY_YEARLY=price_...

# Video (Agora)
AGORA_APP_ID=your_production_app_id
AGORA_APP_CERTIFICATE=your_production_certificate

# Email (SendGrid)
SENDGRID_API_KEY=SG....
FROM_EMAIL=noreply@curevirtual.com
SUPPORT_EMAIL=support@curevirtual.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# Redis
REDIS_URL=redis://your-redis-host:6379
REDIS_PASSWORD=your_redis_password

# AWS S3
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=curevirtual-prod-uploads
AWS_REGION=us-east-1

# Monitoring
SENTRY_DSN=https://...@sentry.io/...

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

- [ ] **Environment secrets secured**
  - Not committed to git
  - Stored in secure vault (AWS Secrets Manager / Vault)
  - Access logs enabled

### 4. Security Hardening ✅

- [ ] **HTTPS/SSL configured**

  - Valid SSL certificate installed
  - HTTP redirects to HTTPS
  - HSTS header enabled

- [ ] **Security headers configured**

  ```javascript
  // Helmet.js configuration
  app.use(
    helmet({
      contentSecurityPolicy: true,
      hsts: { maxAge: 31536000 },
      frameguard: { action: "deny" },
    })
  );
  ```

- [ ] **CORS properly configured**

  ```javascript
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );
  ```

- [ ] **Rate limiting enabled**

  - Per IP: 100 requests/15 minutes
  - Per user: Custom limits per role
  - DDoS protection via Cloudflare (recommended)

- [ ] **Input validation & sanitization**

  - All inputs validated with Joi/Zod
  - SQL injection prevention (Prisma ORM)
  - XSS prevention (sanitize-html)

- [ ] **Authentication & Authorization**
  - JWT tokens signed with strong secret
  - Refresh token rotation
  - RBAC enforced on all protected routes
  - Session management with Redis

### 5. Third-Party Services ✅

- [ ] **Stripe configured (LIVE mode)**

  - Live API keys set
  - Webhook endpoint registered: `https://api.curevirtual.com/api/v1/payments/webhook`
  - Webhook signature verification enabled
  - Test payment processed successfully

- [ ] **Agora/Twilio configured**

  - Production credentials set
  - Test video call completed
  - Recording enabled (if needed)

- [ ] **SendGrid configured**

  - Domain verified
  - SPF/DKIM records set
  - Test email sent successfully
  - Unsubscribe link added

- [ ] **AWS S3 configured**

  - Bucket created
  - CORS configured for uploads
  - Public read access for images
  - Lifecycle policies set (optional)

- [ ] **Redis configured**
  - Production instance running
  - Password authentication enabled
  - Connection tested

### 6. Frontend Build ✅

- [ ] **Production build created**

  ```bash
  cd frontend
  npm run build
  ```

- [ ] **Environment variables set**

  ```bash
  # .env.production
  VITE_API_URL=https://api.curevirtual.com
  VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
  VITE_AGORA_APP_ID=your_production_app_id
  ```

- [ ] **Assets optimized**

  - Images compressed
  - Code minified
  - Source maps generated (for debugging)

- [ ] **CDN configured** (optional but recommended)
  - Static assets served from CDN
  - Cache headers set
  - Gzip compression enabled

### 7. Deployment Infrastructure ✅

- [ ] **Server provisioned**

  - Minimum: 2 CPU, 4GB RAM
  - OS: Ubuntu 22.04 LTS
  - Firewall configured (ports 80, 443, 5001)

- [ ] **Docker setup** (recommended)

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5001
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build: .
    ports:
      - "5001:5001"
    env_file:
      - .env.production
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

- [ ] **Process manager configured**
  - PM2 or Docker Compose
  - Auto-restart on crash
  - Log rotation enabled

```json
// ecosystem.config.js (PM2)
module.exports = {
  apps: [{
    name: 'curevirtual-api',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
```

- [ ] **Nginx reverse proxy configured**

```nginx
# /etc/nginx/sites-available/curevirtual
server {
    listen 80;
    server_name api.curevirtual.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.curevirtual.com;

    ssl_certificate /etc/letsencrypt/live/api.curevirtual.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.curevirtual.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 8. Monitoring & Logging ✅

- [ ] **Error tracking configured (Sentry)**

  ```javascript
  const Sentry = require("@sentry/node");

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
  });
  ```

- [ ] **Application logs configured**

  ```javascript
  // Winston logger
  const winston = require("winston");

  const logger = winston.createLogger({
    level: "info",
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: "error.log", level: "error" }),
      new winston.transports.File({ filename: "combined.log" }),
    ],
  });
  ```

- [ ] **Health check endpoint**

  ```javascript
  app.get("/health", (req, res) => {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
  ```

- [ ] **Uptime monitoring configured**

  - UptimeRobot or Pingdom
  - Alert on downtime
  - Status page (optional)

- [ ] **Performance monitoring**
  - New Relic / Datadog (optional)
  - Slow query alerts
  - Memory leak detection

### 9. DNS & Domain ✅

- [ ] **Domain registered**

  - curevirtual.com

- [ ] **DNS records configured**

  ```
  A     @           -> [Server IP]
  A     www         -> [Server IP]
  CNAME api         -> api.curevirtual.com
  CNAME www         -> curevirtual.com
  ```

- [ ] **SSL certificate obtained**
  ```bash
  sudo certbot --nginx -d curevirtual.com -d www.curevirtual.com
  sudo certbot --nginx -d api.curevirtual.com
  ```

### 10. CI/CD Pipeline ✅

- [ ] **GitHub Actions workflow created**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/curevirtual
            git pull origin main
            npm ci
            npx prisma migrate deploy
            pm2 restart all
```

---

## Post-Deployment Checklist

### 1. Smoke Tests ✅

- [ ] **User registration works**

  - Patient registration
  - Doctor registration
  - Pharmacy registration

- [ ] **Login works for all roles**

- [ ] **Pharmacy subscription checkout**

  - Stripe payment successful
  - Subscription activated
  - Webhook received

- [ ] **Prescription flow**

  - Doctor creates prescription
  - Dispatched to pharmacy
  - Pharmacy receives it

- [ ] **Medicine order flow**

  - Patient places order
  - Pharmacy receives order
  - Order status updates

- [ ] **Video calling**

  - Call initiated
  - Video/audio working
  - Call ended successfully

- [ ] **Messaging**
  - Messages sent/received in real-time
  - Notifications triggered

### 2. Performance Tests ✅

- [ ] **Load testing completed**

  - Tool: k6 / Apache JMeter
  - Target: 100 concurrent users
  - Response time < 500ms (p95)

- [ ] **Database performance**

  - Query execution time < 100ms
  - Connection pool not exhausted

- [ ] **Memory usage stable**
  - No memory leaks detected
  - Heap size within limits

### 3. Security Verification ✅

- [ ] **Penetration testing**

  - OWASP Top 10 tested
  - No critical vulnerabilities

- [ ] **SSL rating**

  - SSL Labs grade: A or A+
  - https://www.ssllabs.com/ssltest/

- [ ] **Headers security check**
  - Tool: securityheaders.com
  - Score: A or higher

### 4. Compliance ✅

- [ ] **HIPAA compliance verified**

  - PHI encrypted at rest and in transit
  - Access logs enabled
  - BAA signed with third-party services

- [ ] **GDPR compliance** (if EU users)

  - Privacy policy published
  - Cookie consent implemented
  - Data deletion mechanism

- [ ] **Terms of Service published**

- [ ] **Privacy Policy published**

### 5. Monitoring Alerts ✅

- [ ] **Error alerts configured**

  - Sentry notifications to Slack/Email
  - Critical errors trigger immediate alert

- [ ] **Performance alerts**

  - CPU > 80% for 5 minutes
  - Memory > 90%
  - Disk space < 10%

- [ ] **Business alerts**
  - Payment failure rate > 5%
  - Subscription churn spike
  - Order abandonment rate

### 6. Documentation ✅

- [ ] **API documentation published**

  - Swagger/OpenAPI docs
  - Available at: https://api.curevirtual.com/docs

- [ ] **User guides created**

  - Patient onboarding
  - Doctor onboarding
  - Pharmacy setup guide

- [ ] **Admin runbook**
  - Emergency procedures
  - Rollback process
  - Incident response

### 7. Backup & Recovery ✅

- [ ] **Backup restoration tested**

  - Database backup restored successfully
  - Recovery time < 1 hour

- [ ] **Disaster recovery plan documented**

- [ ] **Rollback plan tested**
  - Previous version can be deployed quickly

---

## Go-Live Day Checklist

### Morning ☀️

- [ ] **Final backup taken**
- [ ] **All team members notified**
- [ ] **Support team standing by**
- [ ] **Monitoring dashboards open**

### Deployment 🚀

- [ ] **Maintenance mode enabled** (optional)
- [ ] **Code deployed**
- [ ] **Database migrations run**
- [ ] **Services restarted**
- [ ] **Smoke tests passed**
- [ ] **Maintenance mode disabled**

### Post-Launch 🎉

- [ ] **Monitor for 4 hours**

  - Error rates normal
  - No performance degradation
  - User feedback positive

- [ ] **Send launch announcement**

  - Email to users
  - Social media
  - Blog post

- [ ] **Retrospective scheduled**

---

## Emergency Rollback Procedure 🚨

If critical issues occur:

```bash
# 1. Stop current version
pm2 stop all

# 2. Checkout previous version
git checkout [PREVIOUS_COMMIT_HASH]

# 3. Restore dependencies
npm ci

# 4. Rollback database (if needed - CAREFUL!)
# npx prisma migrate resolve --rolled-back [MIGRATION_NAME]

# 5. Restart services
pm2 start all

# 6. Verify health
curl https://api.curevirtual.com/health
```

---

## Support Contacts

- **System Admin**: [admin@curevirtual.com]
- **DevOps**: [devops@curevirtual.com]
- **On-Call Engineer**: [Phone number]
- **Stripe Support**: https://support.stripe.com
- **Agora Support**: https://console.agora.io

---

**Deployment Status**: [ ] Not Started | [ ] In Progress | [ ] Completed

**Go-Live Date**: ********\_\_********

**Deployed By**: ********\_\_********

**Sign-off**: ********\_\_********
