# GreenWeave - E-Commerce Platform

> A modern, scalable, full-stack e-commerce platform built with ASP.NET Core and React. Engineered for high performance, security, and maintainability.

[![.NET Version](https://img.shields.io/badge/.NET-8.0-blue)](https://dotnet.microsoft.com/)
[![React Version](https://img.shields.io/badge/React-19.1-61dafb)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![Build Status](https://img.shields.io/badge/status-active-success)](./README.md)

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Performance Considerations](#performance-considerations)
- [Security](#security)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

GreenWeave is a comprehensive e-commerce platform designed to handle complex business operations with enterprise-grade standards. The system provides a complete ecosystem for product management, order processing, payment handling, and real-time inventory updates.

### Key Highlights
- **Microservice-Ready Architecture** - Modular design with clear separation of concerns
- **Real-Time Features** - SignalR integration for live inventory updates
- **Payment & Shipping Integration** - PayOS for payments, ViettelPost for logistics
- **AI-Powered Features** - AI cartoon generation and image editing capabilities
- **Multi-Layer Security** - JWT authentication, role-based access control, rate limiting
- **Enterprise-Grade Performance** - Optimized queries, caching strategies, async operations

## 🛠️ Tech Stack

### Backend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | ASP.NET Core | 8.0 |
| ORM | Entity Framework Core | 8.0.8 |
| Database | SQL Server | Compatible |
| Authentication | JWT Bearer Tokens | 8.0.2 |
| Payment Gateway | PayOS SDK | 1.0.9 |
| Image Processing | Cloudinary, ImageSharp | 3.1.11 |
| PDF Generation | DinkToPdf | 1.0.8 |
| API Documentation | Swagger/OpenAPI | 9.0.4 |
| Real-Time | SignalR | Built-in |
| Rate Limiting | AspNetCoreRateLimit | 5.0.0 |
| Email Service | SendGrid | 9.29.3 |
| AI Services | Google Vertex AI | 3.53.0 |

### Frontend
| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | React | 19.1.1 |
| Routing | React Router | 7.8.2 |
| State Management | Redux | Via middleware |
| UI Components | Tailwind CSS | 4.1.13 |
| Icons | Lucide React | 0.554.0 |
| Canvas Library | Konva.js | 10.0.1 |
| HTTP Client | Axios | 1.11.0 |
| Real-Time | SignalR | 9.0.6 |
| Build Tool | Vite | 7.1.5 |

## 🏗️ Architecture

### Backend Architecture

```
backend/
├── Controllers/        # API endpoints (25+ controllers)
├── Services/          # Business logic layer
├── Repositories/      # Data access abstraction
├── Models/            # Domain entities
├── DTOs/              # Data transfer objects
├── Middleware/        # Custom middleware pipeline
├── Configuration/     # Settings & configurations
├── Interfaces/        # Service & repository contracts
├── Extensions/        # Extension methods
├── Hubs/              # SignalR hubs for real-time
├── Migrations/        # EF Core database migrations
├── Utilities/         # Helper utilities
└── Data/              # DbContext & data seeding
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/    # Reusable React components
│   ├── pages/         # Page-level components
│   ├── services/      # API & external services
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Helper functions
│   ├── styles/        # Global styles & Tailwind
│   └── App.jsx        # Root component
└── public/            # Static assets
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  React Frontend                          │
│         (Vite + React 19 + Tailwind CSS)                │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/WebSocket
┌──────────────────────▼──────────────────────────────────┐
│              ASP.NET Core 8.0 API                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Middleware Pipeline                              │  │
│  │ (Auth, Logging, Exception Handling, CORS)       │  │
│  └──────────────────────────────────────────────────┘  │
│                      │                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Controllers Layer (25+ endpoints)                │  │
│  └──────────────────────────────────────────────────┘  │
│                      │                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Services Layer (Business Logic)                  │  │
│  │ - Authentication/Authorization                   │  │
│  │ - Payment Processing                             │  │
│  │ - Order Management                               │  │
│  │ - Inventory Management                           │  │
│  └──────────────────────────────────────────────────┘  │
│                      │                                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Repository Layer (Data Abstraction)              │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ EF Core
┌──────────────────────▼──────────────────────────────────┐
│              SQL Server Database                         │
└──────────────────────────────────────────────────────────┘
```

## ✨ Features

### Product Management
- Complete CRUD operations for products
- Advanced search and filtering (by category, price, rating)
- Product variants and custom designs
- Stock management across multiple warehouses
- Real-time inventory updates via SignalR

### User Management & Authentication
- JWT-based authentication with refresh tokens
- Role-based access control (Admin, User, Vendor)
- User profile management
- Email verification system
- Password reset functionality
- Secure password hashing with Identity

### Shopping & Orders
- Shopping cart with persistent state
- Multiple checkout methods
- Order tracking and history
- Order status management
- Invoice generation and management

### Payment & Billing
- PayOS payment gateway integration
- Secure webhook handling for payment notifications
- Multiple payment method support
- Transaction logging and audit trail
- Invoice PDF generation with DinkToPdf

### Shipping & Logistics
- ViettelPost API integration
- Real-time address validation
- Shipping rate calculation
- Parcel tracking integration
- Multi-carrier support ready

### Content & Media
- Cloudinary integration for image hosting
- Image optimization and transformation
- Product image gallery management
- Blog/content management system
- AI-powered cartoon generation
- AI image editing capabilities

### Admin & Analytics
- Comprehensive admin dashboard
- Sales analytics and reporting
- User management interface
- Product performance metrics
- Order analytics

### Real-Time Features
- SignalR hubs for live stock updates
- Real-time notifications
- Live order status updates
- Collaborative features ready

### System Features
- Rate limiting to prevent abuse
- Comprehensive error handling and logging
- Webhook management system
- Automated data seeding
- Environment-based configuration
- CORS support for cross-origin requests

## 📋 Prerequisites

### System Requirements
- **.NET SDK 8.0+** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **SQL Server 2019+** - Local or remote instance
- **Git** - Version control

### Development Tools (Recommended)
- Visual Studio 2022+ or Visual Studio Code
- Postman or Thunder Client for API testing
- SQL Server Management Studio (SSMS)
- Git client

### Required API Keys & Credentials
- PayOS Account (Client ID, API Key, Checksum Key)
- Cloudinary Account (Cloud Name, API Key, API Secret)
- SendGrid Account (API Key)
- ViettelPost Account (API credentials)
- Google Cloud Account (for AI features)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/khainm/GreenWeave.git
cd GreenWeave
```

### 2. Backend Setup

```bash
cd backend

# Restore dependencies
dotnet restore

# Install Entity Framework tools (if not already installed)
dotnet tool install --global dotnet-ef

# Create user secrets for sensitive data
dotnet user-secrets init

# Apply migrations and create database
dotnet ef database update
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Optional: Clear npm cache if experiencing issues
npm cache clean --force
npm install
```

## ⚙️ Configuration

### Backend Configuration

#### 1. Environment Variables (.env file)

Create a `.env` file in the backend root directory:

```env
# Database
DB_CONNECTION_STRING=Server=localhost;Database=GreenWeaveDb;Integrated Security=true;TrustServerCertificate=true;

# JWT Settings
JWT_SECRET_KEY=your-super-secret-key-min-32-characters-here
JWT_SECRET_KEY_DEV=your-development-secret-key

# PayOS Configuration
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key

# Google Cloud (for AI features)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_CREDENTIALS=path_to_credentials_json

# ViettelPost Configuration
VIETTEL_POST_API_KEY=your_viettel_post_key

# Application Settings
ASPNETCORE_ENVIRONMENT=Development
```

#### 2. appsettings.json Configuration

Key sections in `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=GreenWeaveDb;Integrated Security=true;"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key",
    "ExpirationMinutes": 60,
    "RefreshExpirationDays": 7
  },
  "PayOS": {
    "ClientId": "",
    "ApiKey": "",
    "ChecksumKey": ""
  },
  "Cloudinary": {
    "CloudName": "",
    "ApiKey": "",
    "ApiSecret": ""
  },
  "IpRateLimiting": {
    "EnableEndpointRateLimiting": true,
    "StackBlockedRequests": true,
    "RealIpHeader": "X-Real-IP",
    "HttpStatusCode": 429,
    "IpWhiteList": [],
    "GeneralRules": [
      {
        "Endpoint": "*",
        "Period": "1m",
        "Limit": 100
      }
    ]
  }
}
```

### Frontend Configuration

Create a `.env.local` file in the frontend root directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SIGNALR_URL=http://localhost:5000
VITE_ENVIRONMENT=development
```

## ▶️ Running the Application

### Backend (Development)

```bash
cd backend

# Run with hot reload
dotnet watch run

# Or standard run
dotnet run
```

The API will be available at:
- **HTTP**: http://localhost:5000
- **Swagger UI**: http://localhost:5000/swagger

### Frontend (Development)

```bash
cd frontend

# Start development server with Vite
npm run dev

# Access at http://localhost:5173
```

### Running Both Simultaneously

In separate terminal windows:
```bash
# Terminal 1 - Backend
cd backend && dotnet watch run

# Terminal 2 - Frontend
cd frontend && npm run dev
```

## 📚 API Documentation

### Interactive Swagger UI

Once the backend is running, visit: **http://localhost:5000/swagger**

### Key API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout

#### Products
- `GET /api/products` - List all products (with filtering)
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/{id}` - Update product (Admin)
- `DELETE /api/products/{id}` - Delete product (Admin)

#### Orders
- `GET /api/orders` - Get user's orders
- `GET /api/orders/{id}` - Get order details
- `POST /api/orders` - Create new order
- `PUT /api/orders/{id}` - Update order status (Admin)

#### Payment
- `POST /api/payos/create-payment` - Create payment link
- `GET /api/payos/payment-details` - Get payment details
- `POST /api/payos/webhook` - Payment webhook handler

#### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/{id}` - Update cart item
- `DELETE /api/cart/items/{id}` - Remove from cart

### Testing with Postman

1. Import the OpenAPI schema from Swagger UI
2. Configure variables:
   - `baseUrl`: http://localhost:5000/api
   - `token`: JWT token from login response
3. Use pre-configured requests for each endpoint

## 🗄️ Database Schema

### Core Entities

```
User (ASP.NET Identity)
├── Orders
├── Addresses
├── Reviews
└── Cart

Product
├── Category
├── Images
├── Warehouse Stock
├── Reviews
└── Variants

Order
├── OrderItems
├── Payment
├── Shipping
└── Invoice

Category
└── Products

Warehouse
├── Stock
└── Locations
```

### Key Tables
- **AspNetUsers** - User authentication data
- **Products** - Product catalog
- **Orders** - Order records
- **OrderItems** - Order line items
- **Categories** - Product categories
- **WarehouseStock** - Inventory tracking
- **Payments** - Payment records
- **Invoices** - Invoice documents

### Migrations

View all migrations:
```bash
dotnet ef migrations list
```

Add new migration:
```bash
dotnet ef migrations add MigrationName -o Migrations
```

Update database:
```bash
dotnet ef database update
```

## 🚢 Deployment

### Backend Deployment

#### Docker Deployment

```dockerfile
# Create Dockerfile in backend root
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source
COPY . .
RUN dotnet restore
RUN dotnet publish -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 5000
ENTRYPOINT ["dotnet", "backend.dll"]
```

Build and run:
```bash
docker build -t greenweave-backend .
docker run -p 5000:5000 -e "ASPNETCORE_ENVIRONMENT=Production" greenweave-backend
```

#### Publish for Production

```bash
cd backend

# Publish as self-contained app
dotnet publish -c Release -o ./publish

# Or publish as framework-dependent
dotnet publish -c Release
```

### Frontend Deployment

```bash
cd frontend

# Build for production
npm run build

# Output in 'dist' directory - ready for static hosting
```

Deploy the `dist` folder to:
- Vercel (recommended for this stack)
- Netlify
- Azure Static Web Apps
- AWS S3 + CloudFront
- GitHub Pages

## ⚡ Performance Considerations

### Database Optimization
- **Indexing**: Performance indexes on frequently queried columns
- **Query Optimization**: Eager loading for related entities
- **Pagination**: Implemented on all list endpoints
- **Caching**: Consider Redis for session storage

### Backend Optimization
- **Async/Await**: All I/O operations are async
- **Compression**: Response compression enabled
- **Rate Limiting**: Prevents abuse and DDoS
- **Connection Pooling**: Entity Framework manages connection pools

### Frontend Optimization
- **Code Splitting**: React Router lazy loading
- **Image Optimization**: Cloudinary transformations
- **Caching**: Browser cache headers configured
- **Minification**: Vite handles bundling and minification

### Recommended Enhancements
```csharp
// Add Redis caching
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString("Redis");
});

// Add response compression
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});
```

## 🔒 Security

### Authentication & Authorization
- **JWT Tokens**: Stateless, scalable authentication
- **Refresh Tokens**: Extended sessions with renewed access
- **Role-Based Access**: Admin, User, Vendor roles
- **Password Hashing**: Using ASP.NET Identity with bcrypt

### API Security
- **CORS**: Configured for allowed origins
- **Rate Limiting**: IP-based request throttling
- **Input Validation**: Server-side DTO validation
- **HTTPS**: Enforced in production
- **SQL Injection Prevention**: Parameterized queries via EF Core

### Data Security
- **Sensitive Data**: Stored in environment variables
- **Webhook Validation**: Checksum verification for PayOS
- **User Secrets**: .NET user-secrets for development
- **PII Protection**: Email encryption for sensitive data

### OWASP Top 10 Mitigations
- ✅ Broken Authentication - JWT with refresh tokens
- ✅ Injection - Parameterized queries, input validation
- ✅ Sensitive Data - Environment-based configuration
- ✅ XML External Entities - Not applicable
- ✅ Broken Access Control - Role-based authorization
- ✅ Security Misconfiguration - Environment-specific configs
- ✅ XSS Prevention - React's built-in XSS protection
- ✅ Insecure Deserialization - Input validation
- ✅ Using Components with Known Vulnerabilities - Regular updates
- ✅ Insufficient Logging - Comprehensive logging

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow coding standards
   - Write meaningful commit messages
   - Keep commits atomic

3. **Test Locally**
   ```bash
   # Backend
   cd backend && dotnet test
   
   # Frontend
   cd frontend && npm test
   ```

4. **Submit Pull Request**
   - Provide clear description
   - Reference related issues
   - Include testing details

### Code Standards

#### C# (.NET)
- Follow Microsoft's C# coding conventions
- Use meaningful variable names
- Add XML documentation for public methods
- Keep methods focused and testable

#### JavaScript/React
- Use ESLint configuration provided
- Follow functional component patterns
- Use hooks instead of class components
- Maintain consistent formatting with Prettier

### Commit Message Format
```
[TYPE] Brief description

Detailed explanation of changes if needed.

Fixes #123
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Errors
```
Error: Cannot connect to SQL Server
```

**Solution:**
1. Verify SQL Server is running
2. Check connection string in appsettings.json
3. Ensure database exists or run migrations
4. Check Windows/SQL authentication is enabled

#### JWT Token Errors
```
Error: Invalid token
```

**Solution:**
1. Verify JWT_SECRET_KEY is at least 32 characters
2. Check token hasn't expired
3. Ensure Authorization header format: `Bearer <token>`

#### CORS Errors
```
Error: Access to XMLHttpRequest has been blocked by CORS
```

**Solution:**
1. Check frontend URL is in CORS allowed origins
2. Verify credentials mode in axios config
3. Check header values match CORS policy

#### Cloudinary Upload Errors
```
Error: Unauthorized cloudinary request
```

**Solution:**
1. Verify Cloudinary credentials in .env
2. Check Cloud Name matches account
3. Ensure API Key has correct permissions

#### PayOS Payment Integration
```
Error: Invalid PayOS credentials
```

**Solution:**
1. Verify PayOS credentials from dashboard
2. Check Checksum Key is correctly set
3. Ensure webhook URL is registered
4. Verify payment environment (test/production)

#### Port Already in Use
```
Error: Address already in use :5000
```

**Solution:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
dotnet run --urls="http://localhost:5001"
```

### Debug Mode

#### Backend Debugging
```bash
# Run with debugging enabled
dotnet run --configuration Debug

# In Visual Studio: Press F5
```

#### Frontend Debugging
- Open DevTools: F12 or Cmd+Option+I
- Use React Developer Tools extension
- Check browser console for errors

### Logging

Enable detailed logging in `appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

## 📞 Support

For issues and questions:
1. Check this README and troubleshooting section
2. Review API documentation in Swagger
3. Check repository issues
4. Contact development team

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Authors

- **Development Team** - GreenWeave Project

## 🎓 Learning Resources

- [ASP.NET Core Documentation](https://docs.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [JWT Authentication](https://jwt.io/)

---

**Last Updated**: March 5, 2026  
**Version**: 1.0.0  
**Status**: Active Development
