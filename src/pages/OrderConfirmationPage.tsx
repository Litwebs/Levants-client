import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";

// Redirect old route to new success page
const OrderConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const hasClearedRef = useRef(false);

  useEffect(() => {
    if (!hasClearedRef.current) {
      hasClearedRef.current = true;
      clearCart();
    }
    navigate("/checkout/success", { replace: true });
  }, [clearCart, navigate]);

  return null;
};

export default OrderConfirmationPage;
