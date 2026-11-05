import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState({
    service: null,
    professional: null,
    date: '',
    timeSlot: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    instructions: '',
  });

  const updateBookingData = (updates) => {
    setBookingData((prev) => ({ ...prev, ...updates }));
  };

  const resetBooking = () => {
    setBookingData({
      service: null,
      professional: null,
      date: '',
      timeSlot: '',
      address: { street: '', city: '', state: '', zipCode: '' },
      instructions: '',
    });
  };

  return (
    <BookingContext.Provider value={{ bookingData, updateBookingData, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) throw new Error('useBooking must be used within BookingProvider');
  return context;
};
