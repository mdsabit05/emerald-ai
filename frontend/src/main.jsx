import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { WishlistProvider } from "./components/WishlistContext.jsx";
import { ClerkProvider } from "@clerk/clerk-react";

import App from "./App.jsx";
import { CartProvider } from "./components/CartContext.jsx";
import { Toaster } from "react-hot-toast";
import "./index.css";
import {
  AddressProvider,
} from "./components/AddressContext";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPubKey}>
      <BrowserRouter>
        <CartProvider>
          <WishlistProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 2500,

                style: {
                  background: "#132e24",
                  color: "#fff",

                  borderRadius: "14px",

                  padding: "14px 18px",
                },
              }}
            />

            <AddressProvider>
  <App />
</AddressProvider>
          </WishlistProvider>
        </CartProvider>
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>,
);
