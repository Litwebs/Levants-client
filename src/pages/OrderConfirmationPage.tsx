import React from 'react';
import { Navigate } from 'react-router-dom';

// Redirect old route to new success page
const OrderConfirmationPage: React.FC = () => {
  return <Navigate to="/checkout/success" replace />;
};

export default OrderConfirmationPage;
