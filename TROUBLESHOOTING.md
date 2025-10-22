# Troubleshooting Guide

## Rate Limiting Issues

### Problem: "Too many login attempts" error

**Symptoms:**
- Unable to login to admin portal (`/admin/login`)
- Unable to login to organization portal (`/login`)
- Error message: "Too many login attempts, please try again after 15 minutes"

**Root Cause:**
The application uses an in-memory rate limiter to protect authentication endpoints from brute force attacks. After multiple failed login attempts, the rate limiter blocks further login attempts for 15 minutes.

**Configuration:**
- **Development Mode**: 50 attempts per 15-minute window
- **Production Mode**: 5 attempts per 15-minute window
- Rate limiter configuration: `server/middleware/security.ts`

**Solution 1: Restart the Application (Quick Fix)**
```bash
# Stop all Node.js processes
pkill -9 node

# Restart the application
npm run dev
```

**Solution 2: Wait for Rate Limit Window to Expire**
Wait 15 minutes for the rate limit window to reset automatically.

**Solution 3: Adjust Rate Limiter for Testing**
The rate limiter is already configured to be more lenient in development mode (50 attempts vs 5 in production). To further increase the limit, edit `server/middleware/security.ts`:

```typescript
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Increase to 100 for development
  // ... rest of configuration
});
```

**Prevention:**
- Use correct credentials during testing
- In development, the rate limiter allows 50 attempts per 15 minutes
- For load testing, consider temporarily disabling or increasing the rate limit

---

## Environment Variables Not Loading

**Problem:** Application crashes with "DATABASE_URL must be set" error

**Solution:**
1. Ensure `.env` file exists in the project root
2. Verify `dotenv` package is installed: `npm install dotenv`
3. Verify `dotenv.config()` is called at the top of `server/db.ts`

---

## Database Connection Issues

**Problem:** Cannot connect to PostgreSQL database

**Solution:**
1. Verify PostgreSQL is running:
   ```bash
   ps aux | grep postgres
   ```

2. Test database connection:
   ```bash
   PGPASSWORD=your_password psql -U bizverse_user -d bizverse_db -h localhost -c "SELECT 1;"
   ```

3. Check DATABASE_URL in `.env` file matches your PostgreSQL configuration

---

## Login Credentials

### Platform Admin Portal (`/admin/login`)
- Email: `hugenetwork7@gmail.com`
- Password: `ADMIN_PASSWORD_PLACEHOLDER`

### Organization Portal (`/login`)
- Email: `testuser@example.com`
- Password: `test123`

---

## Common Issues After Code Changes

**Problem:** Application not reflecting changes

**Solution:**
1. Clear build cache: `rm -rf dist/`
2. Restart development server: `npm run dev`
3. Clear browser cache or use incognito mode

---

## Port Already in Use

**Problem:** Error: "Port 5000 is already in use"

**Solution:**
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or kill all Node.js processes
pkill -9 node
```

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the application logs: `tail -f /tmp/bizverse.log`
2. Check browser console for client-side errors
3. Review server logs for detailed error messages
4. Verify all environment variables are set correctly in `.env`

---

**Last Updated:** October 22, 2025
