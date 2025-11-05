# Authentication System - Setup Guide

## Overview

This guide covers the complete authentication system implementation for StickyWork admin dashboard.

## Features Implemented

- **Secure Login System**: JWT-based authentication with bcrypt password hashing
- **Admin Dashboard**: Full-featured dashboard with booking management
- **Protected API Routes**: Secured endpoints requiring authentication
- **Role-Based Access**: Support for owner, admin, and staff roles
- **Session Management**: Token-based authentication with automatic expiration
- **Password Management**: Secure password change functionality

## File Structure

```
backend/
├── middleware/
│   └── auth.js              # Authentication middleware & JWT utilities
├── routes/
│   └── auth.js              # Authentication API endpoints
├── routes.js                # Main routes with protected endpoints
└── setup-database.js        # Database schema (updated with admin_users table)

Root:
├── admin-login.html         # Admin login page
├── admin-dashboard.html     # Admin dashboard interface
└── AUTH_SETUP.md           # This file
```

## Database Schema

### admin_users Table

```sql
CREATE TABLE admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('owner', 'admin', 'staff') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_business (business_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;
```

## Installation

### 1. Install Dependencies

Already installed:
```bash
npm install bcrypt express-session jsonwebtoken
```

### 2. Configure Environment Variables

Add to your `.env` file:
```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Database Configuration (if not already set)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=stickywork
DB_PORT=3306
```

**IMPORTANT**: Change `JWT_SECRET` to a strong random string in production!

### 3. Run Database Setup

This will create the `admin_users` table and a demo admin account:

```bash
npm run setup
```

### 4. Demo Admin Credentials

After running the setup, you can login with:
- **Email**: admin@demo.com
- **Password**: admin123

## API Endpoints

### Authentication Routes

#### POST `/api/auth/register`
Register a new admin user

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "securepassword123",
  "fullName": "John Doe",
  "businessId": 1,
  "role": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": 2,
      "business_id": 1,
      "email": "admin@example.com",
      "full_name": "John Doe",
      "role": "admin",
      "is_active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### POST `/api/auth/login`
Login with email and password

**Request Body:**
```json
{
  "email": "admin@demo.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": 1,
      "business_id": 1,
      "email": "admin@demo.com",
      "full_name": "Administrador Demo",
      "role": "owner"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET `/api/auth/verify`
Verify if current token is valid (requires authentication)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "business_id": 1,
      "email": "admin@demo.com",
      "full_name": "Administrador Demo",
      "role": "owner"
    }
  }
}
```

#### POST `/api/auth/logout`
Logout current user (requires authentication)

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

#### POST `/api/auth/change-password`
Change password for current user (requires authentication)

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newSecurePassword456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

### Protected Routes

The following existing routes now require authentication:

- `GET /api/bookings/:businessId` - Get all bookings (requires auth + business access)
- `PATCH /api/booking/:id` - Update booking status (requires auth)
- `GET /api/stats/:businessId` - Get business statistics (requires auth + business access)

### Using Protected Routes

Include the JWT token in the Authorization header:

```javascript
fetch('http://localhost:3000/api/bookings/1', {
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
})
```

## Middleware

### requireAuth
Protects routes by requiring a valid JWT token.

```javascript
const { requireAuth } = require('./backend/middleware/auth');

router.get('/api/protected', requireAuth, (req, res) => {
  // req.user contains decoded token payload
  res.json({ user: req.user });
});
```

### requireRole
Restricts access to specific roles.

```javascript
const { requireAuth, requireRole } = require('./backend/middleware/auth');

router.delete('/api/admin/delete', requireAuth, requireRole('owner', 'admin'), (req, res) => {
  // Only owners and admins can access
});
```

### requireBusinessAccess
Ensures user has access to the specified business.

```javascript
const { requireAuth, requireBusinessAccess } = require('./backend/middleware/auth');

router.get('/api/bookings/:businessId', requireAuth, requireBusinessAccess, (req, res) => {
  // User must belong to the business in params
});
```

## Security Features

### Password Hashing
- Uses bcrypt with 10 salt rounds
- Passwords never stored in plain text
- Compare function for verification

### JWT Tokens
- Signed with secret key
- Includes user ID, email, business ID, and role
- Automatic expiration (default 24 hours)
- Stateless authentication

### Validation
- Email format validation
- Password minimum length (6 characters)
- Input sanitization
- SQL injection prevention (prepared statements)

### Access Control
- Business-level isolation
- Role-based permissions
- Token expiration
- Active user checks

## Frontend Integration

### Login Flow

```javascript
// 1. User submits login form
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

// 2. Store token and user data
localStorage.setItem('authToken', data.data.token);
localStorage.setItem('userData', JSON.stringify(data.data.user));

// 3. Redirect to dashboard
window.location.href = 'admin-dashboard.html';
```

### Making Authenticated Requests

```javascript
const token = localStorage.getItem('authToken');

const response = await fetch('http://localhost:3000/api/bookings/1', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Logout

```javascript
// 1. Call logout endpoint
await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Clear local storage
localStorage.removeItem('authToken');
localStorage.removeItem('userData');

// 3. Redirect to login
window.location.href = 'admin-login.html';
```

## Testing

### 1. Start the Server

```bash
npm start
```

### 2. Access Admin Login

Open: http://localhost:3000/admin-login.html

### 3. Login with Demo Account

- Email: admin@demo.com
- Password: admin123

### 4. Explore Dashboard

After login, you'll be redirected to the admin dashboard where you can:
- View booking statistics
- Manage reservations
- See business metrics

## Troubleshooting

### Database Connection Error

If you see "Access denied for user 'root'@'localhost'":
1. Configure MySQL credentials in `.env`
2. Run `npm run setup` again

### Token Invalid or Expired

If you get authentication errors:
1. Clear localStorage
2. Login again to get a new token

### CORS Errors

If making requests from a different domain:
1. Check CORS configuration in `server.js`
2. Ensure frontend domain is allowed

## Production Deployment

### Security Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Use HTTPS for all requests
- [ ] Set secure environment variables
- [ ] Enable rate limiting
- [ ] Add CSRF protection
- [ ] Implement refresh tokens
- [ ] Add audit logging
- [ ] Set up monitoring

### Recommended Improvements

1. **Refresh Tokens**: Implement refresh token rotation
2. **2FA**: Add two-factor authentication
3. **Password Reset**: Email-based password recovery
4. **Session Management**: Track active sessions
5. **Audit Logs**: Log all admin actions
6. **Rate Limiting**: Prevent brute force attacks
7. **Email Verification**: Verify email on registration

## Support

For issues or questions:
1. Check server logs for errors
2. Verify database connection
3. Confirm environment variables are set
4. Test API endpoints with tools like Postman

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (Client)   │
└─────┬───────┘
      │
      │ 1. POST /api/auth/login
      │    {email, password}
      │
      ▼
┌─────────────────────┐
│   Express Server    │
│                     │
│  ┌──────────────┐   │
│  │ Auth Routes  │   │
│  │  auth.js     │   │
│  └──────┬───────┘   │
│         │           │
│         │ 2. Verify credentials
│         │    bcrypt.compare()
│         │
│  ┌──────▼───────┐   │
│  │  Database    │   │
│  │  MySQL       │   │
│  └──────┬───────┘   │
│         │           │
│         │ 3. Generate JWT
│         │    jwt.sign()
│         │
└─────────┼───────────┘
          │
          │ 4. Return token
          │    {user, token}
          │
      ┌───▼────┐
      │Browser │
      │Store   │
      │Token   │
      └───┬────┘
          │
          │ 5. Subsequent requests
          │    Authorization: Bearer {token}
          │
      ┌───▼─────────────┐
      │ requireAuth     │
      │ Middleware      │
      │  - Verify token │
      │  - Check expiry │
      │  - Load user    │
      └─────────────────┘
```

## Credits

Developed as part of the StickyWork booking system.
Authentication system implemented with industry best practices.
