import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import Booking from './pages/Booking';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import About from './pages/About';
import Contact from './pages/Contact';
import ProfessionalDashboard from './pages/ProfessionalDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* Admin routes – no Navbar/Footer */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Main layout routes */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/services/:id" element={<ServiceDetails />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/booking/:serviceId"
                    element={
                      <ProtectedRoute allowedRoles={['customer', 'admin']}>
                        <Booking />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-bookings"
                    element={
                      <ProtectedRoute allowedRoles={['customer']}>
                        <MyBookings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute allowedRoles={['customer', 'professional', 'admin']}>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/professional/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['professional']}>
                        <ProfessionalDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </>
  );
}

export default App;
