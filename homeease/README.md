# 🏠 HomeEase – Home Services Booking Platform

A full-stack MERN application for booking trusted home service professionals.

---

## 📋 Table of Contents
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [Seeding the Database](#seeding-the-database)
- [Test Credentials](#test-credentials)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)

---

## 🛠 Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | React.js (Vite), React Router, Axios, React Toastify |
| Backend   | Node.js, Express.js                |
| Database  | MongoDB, Mongoose                  |
| Auth      | JWT, bcryptjs                      |
| Styling   | Pure CSS3 (design system)          |
| Icons     | Lucide React                       |

---

## ✅ Prerequisites

Make sure you have these installed:

1. **Node.js** (v18 or later) – https://nodejs.org
2. **MongoDB** – https://www.mongodb.com/try/download/community
   - OR use MongoDB Atlas (cloud): https://cloud.mongodb.com

---

## 📦 Installation

### Step 1 – Install Backend Dependencies

```bash
cd homeease/backend
npm install
```

### Step 2 – Configure Backend Environment

The `.env` file is already created. Edit it if needed:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/homeease
JWT_SECRET=homeease_jwt_secret_key_2024_change_me
JWT_EXPIRE=7d
NODE_ENV=development
```

> **MongoDB Atlas users**: Replace `MONGO_URI` with your Atlas connection string:
> `mongodb+srv://username:password@cluster.mongodb.net/homeease`

### Step 3 – Install Frontend Dependencies

```bash
cd homeease/frontend
npm install
```

---

## 🚀 Running the App

Open **two separate terminal windows**.

**Terminal 1 – Backend:**
```bash
cd homeease/backend
npm run dev
```
Backend runs on: `http://localhost:5000`

**Terminal 2 – Frontend:**
```bash
cd homeease/frontend
npm run dev
```
Frontend runs on: `http://localhost:5173`

---

## 🌱 Seeding the Database

After backend is running and MongoDB is connected, seed initial data:

```bash
cd homeease/backend
npm run seed
```

This creates:
- 8 service categories
- 13+ services
- 5 verified professionals
- Admin, customer, and professional users

---

## 🔑 Test Credentials

| Role         | Email                      | Password     |
|--------------|----------------------------|--------------|
| Admin        | admin@homeease.com         | password123  |
| Customer     | john@homeease.com          | password123  |
| Professional | michael@homeease.com       | password123  |
| Professional | robert@homeease.com        | password123  |

---

## 📁 Project Structure

```
homeease/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── serviceController.js
│   │   ├── bookingController.js
│   │   ├── professionalController.js
│   │   ├── reviewController.js
│   │   ├── adminController.js
│   │   └── categoryController.js
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT protect, role checks
│   │   └── errorMiddleware.js      # Global error handler
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── Professional.js
│   │   ├── Booking.js
│   │   ├── Review.js
│   │   └── Category.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── bookingRoutes.js
│   │   ├── professionalRoutes.js
│   │   ├── reviewRoutes.js
│   │   ├── adminRoutes.js
│   │   └── categoryRoutes.js
│   ├── utils/
│   │   └── seedData.js             # Database seed script
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx + .css
    │   │   ├── Footer.jsx + .css
    │   │   ├── ServiceCard.jsx + .css
    │   │   ├── ProfessionalCard.jsx + .css
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx      # Auth state management
    │   │   └── BookingContext.jsx   # Booking state management
    │   ├── pages/
    │   │   ├── Home.jsx + .css
    │   │   ├── Services.jsx + .css
    │   │   ├── ServiceDetails.jsx + .css
    │   │   ├── Booking.jsx + .css
    │   │   ├── MyBookings.jsx + .css
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Auth.css
    │   │   ├── Profile.jsx + .css
    │   │   ├── About.jsx + .css
    │   │   ├── Contact.jsx + .css
    │   │   ├── ProfessionalDashboard.jsx + .css
    │   │   ├── AdminDashboard.jsx + .css
    │   │   └── NotFound.jsx + .css
    │   ├── services/
    │   │   ├── api.js               # Axios instance
    │   │   ├── authService.js
    │   │   ├── serviceService.js
    │   │   └── bookingService.js
    │   ├── styles/
    │   │   └── global.css           # Design system tokens
    │   ├── App.jsx
    │   └── main.jsx
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint                    | Access   |
|--------|-----------------------------|----------|
| POST   | /api/auth/register          | Public   |
| POST   | /api/auth/login             | Public   |
| GET    | /api/auth/me                | Private  |
| PUT    | /api/auth/profile           | Private  |
| PUT    | /api/auth/change-password   | Private  |
| POST   | /api/auth/address           | Private  |

### Services
| Method | Endpoint              | Access   |
|--------|-----------------------|----------|
| GET    | /api/services         | Public   |
| GET    | /api/services/featured| Public   |
| GET    | /api/services/:id     | Public   |
| POST   | /api/services         | Admin    |
| PUT    | /api/services/:id     | Admin    |
| DELETE | /api/services/:id     | Admin    |

### Bookings
| Method | Endpoint                          | Access       |
|--------|-----------------------------------|--------------|
| POST   | /api/bookings                     | Customer     |
| GET    | /api/bookings/my-bookings         | Customer     |
| GET    | /api/bookings/professional-bookings| Professional|
| GET    | /api/bookings/available-slots     | Public       |
| GET    | /api/bookings/:id                 | Private      |
| PUT    | /api/bookings/:id/status          | Professional |
| PUT    | /api/bookings/:id/cancel          | Customer     |

### Reviews
| Method | Endpoint                 | Access   |
|--------|--------------------------|----------|
| POST   | /api/reviews             | Customer |
| GET    | /api/reviews/:professionalId | Public |

### Admin
| Method | Endpoint                          | Access |
|--------|-----------------------------------|--------|
| GET    | /api/admin/dashboard              | Admin  |
| GET    | /api/admin/users                  | Admin  |
| GET    | /api/admin/bookings               | Admin  |
| GET    | /api/admin/professionals          | Admin  |
| GET    | /api/admin/revenue                | Admin  |
| PUT    | /api/admin/users/:id/toggle-status| Admin  |
| PUT    | /api/admin/professionals/:id/verify| Admin |

---

## 📝 Notes

- Payment is implemented as a **demo flow** — no real payment gateway is connected.
- Images are loaded from Unsplash CDN for demonstration.
- In production, update `JWT_SECRET`, configure proper CORS origins, and add image upload storage (e.g., AWS S3 or Cloudinary).
