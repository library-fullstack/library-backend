# Library Management API

A modern backend system for managing an online library, built with Node.js, Express, TypeScript, and MySQL. This API handles user authentication, book management, borrowing requests, and administrative features with a focus on security and scalability.

## Overview

This is the backend service for a complete library management platform. It provides REST APIs for students to borrow books, view the catalog, and manage their accounts, while admins can manage users, books, events, news, and borrowing records.

Key Stack:

- Runtime: Node.js with TypeScript
- Framework: Express.js
- Database: MySQL
- Authentication: JWT + bcrypt
- Caching: Redis
- File Storage: Cloudinary
- Email: Nodemailer
- Communication: Twilio SMS

## Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- MySQL 8.0+
- Redis (optional, for caching)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd library-api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your database and API credentials
# Then run migrations if needed

# Start development server
npm run dev
```

The API will be available at `http://localhost:4000/api/v1`

### Build & Deploy

```bash
npm run build
npm start
```

## Tech Stack & Dependencies

| Component           | Technology        | Version |
| ------------------- | ----------------- | ------- |
| **Runtime**         | Node.js           | 16+     |
| **Language**        | TypeScript        | Latest  |
| **Web Framework**   | Express.js        | 4.x     |
| **Database**        | MySQL             | 8.0+    |
| **Caching**         | Redis             | 5.x     |
| **Authentication**  | JWT + bcrypt      | -       |
| **Image Storage**   | Cloudinary        | -       |
| **Email Service**   | Nodemailer        | 7.x     |
| **SMS Service**     | Twilio            | 5.x     |
| **Task Scheduling** | node-cron         | 4.x     |
| **Code Quality**    | ESLint + Prettier | Latest  |

## Project Structure

```
src/
├── controllers/          # Request handlers
│   ├── auth.controller.ts
│   ├── books.controller.ts
│   ├── borrow.controller.ts
│   ├── user.controller.ts
│   ├── admin.controller.ts
│   └── ... (more controllers)
├── routes/              # API endpoints
│   ├── auth.routes.ts
│   ├── books.routes.ts
│   └── ... (more routes)
├── middlewares/         # Express middlewares
│   ├── auth.middleware.ts
│   ├── error.middleware.ts
│   └── ... (more middlewares)
├── models/              # Database models/queries
├── services/            # Business logic
├── config/              # Configuration files
│   ├── db.ts           # Database connection
│   ├── env.ts          # Environment variables
│   └── redis.ts        # Redis setup
├── types/              # TypeScript type definitions
└── utils/              # Helper functions
```

## Features

### Authentication & Security

- User registration and login
- JWT-based authentication with refresh tokens
- Role-based access control (Admin & Student)
- Password hashing with bcrypt + pepper
- Secure middleware for token validation
- Rate limiting to prevent abuse

### User Management

- Create, read, update, delete users (Admin only)
- User profile management
- Activity logging
- User search and filtering

### Book Management

- Create and manage book catalog (Admin only)
- Book details with author, ISBN, category, and description
- Search, filter, and sort books
- Book availability tracking
- Featured books and recommendations

### Borrowing System

- Create borrowing requests
- Track borrowed books and due dates
- Manage borrow cart
- Return book functionality
- Overdue notifications via email/SMS
- Borrowing history

### Admin Dashboard

- User management panel
- Book management panel
- Borrowing request approvals
- System statistics and reports
- News and events management
- Banner management

### Additional Features

- Notification system (Email & SMS)
- Event management
- News/announcements
- Forum/discussion system
- Favorite books tracking
- Settings and preferences
- Redis caching for performance
- Cloudinary integration for book covers

## Available Endpoints

### Auth Routes

```
POST   /api/v1/auth/register        - Register new user
POST   /api/v1/auth/login           - Login user
POST   /api/v1/auth/refresh-token   - Refresh JWT token
POST   /api/v1/auth/logout          - Logout user
```

### Book Routes

```
GET    /api/v1/books                - List all books
GET    /api/v1/books/:id            - Get book details
POST   /api/v1/books                - Create book (Admin)
PUT    /api/v1/books/:id            - Update book (Admin)
DELETE /api/v1/books/:id            - Delete book (Admin)
```

### User Routes

```
GET    /api/v1/users                - List users (Admin)
GET    /api/v1/users/:id            - Get user details
PUT    /api/v1/users/:id            - Update user profile
DELETE /api/v1/users/:id            - Delete user (Admin)
```

### Borrow Routes

```
POST   /api/v1/borrow               - Create borrow request
GET    /api/v1/borrow               - Get borrow history
PUT    /api/v1/borrow/:id           - Return borrowed book
GET    /api/v1/borrow-cart          - Get items in borrow cart
POST   /api/v1/borrow-cart          - Add book to cart
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server
NODE_ENV=development
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=library_db

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRE=30d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Image Storage (Cloudinary)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Password hashing
PASSWORD_PEPPER=your_pepper_string
```

## Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload

# Production
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production server

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier

# Admin Tools
npm run createAdmin      # Create an admin user
npm run send:test-mail   # Send test email
npm run clear:cache      # Clear Redis cache
```

## Development Guidelines

### Architecture Principles

- Separation of Concerns: Controllers handle requests, services handle business logic, models handle data
- Error Handling: Centralized error middleware for consistent error responses
- Validation: Use Joi for input validation before processing
- Security: Always validate, sanitize, and authenticate requests
- Performance: Use caching where appropriate, optimize database queries

### Adding a New Feature

1. Create route in `src/routes/`
2. Create controller in `src/controllers/`
3. Create service in `src/services/` (if needed)
4. Add validation schemas
5. Test with Postman or similar
6. Update this README

### Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use meaningful variable names
- Write JSDoc comments for public functions
- Keep functions small and focused

## API Response Format

All responses follow a consistent format:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

Error response:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Error description",
  "errors": [
    // Detailed error information
  ]
}
```

## Common Errors & Solutions

### Database Connection Failed

- Ensure MySQL is running
- Check DB credentials in `.env`
- Verify database exists

### JWT Token Expired

- Client should use refresh token endpoint
- Frontend should handle token refresh automatically

### CORS Issues

- Check `corsOptions` in `app.ts`
- Ensure frontend URL is whitelisted

### Redis Connection Errors

- Redis is optional; set `REDIS_PASSWORD` if required
- Or remove Redis integration if not needed

## Future Enhancements

- GraphQL API support
- Advanced search with Elasticsearch
- Payment gateway integration (PayOS, Stripe)
- Shipping API integration (GHN)
- Machine learning recommendations
- Real-time notifications with WebSockets
- Mobile app support
- Multi-language support
- Advanced analytics dashboard

## Testing

Testing infrastructure is currently being set up. We plan to use:

- Jest for unit tests
- Supertest for API integration tests
- Run tests with `npm test`

## Performance Considerations

- API responses are cached using Redis
- Database queries are optimized with indexes
- Images are stored on Cloudinary (not locally)
- Compression middleware reduces payload size
- Rate limiting prevents abuse

## Security Features

- HTTPS-ready with Helmet.js
- JWT authentication with expiration
- Password hashing with bcrypt + pepper
- Input validation with Joi
- CORS configuration
- Rate limiting
- SQL injection prevention
- XSS protection

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Express.js and TypeScript
- Thanks to the open source community
- Inspired by modern API design practices

---
