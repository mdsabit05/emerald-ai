import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import AdminDashboard from "./pages/AdminDashboard";
// Import all your individual puzzle pieces here
import Navbar from "./components/Navbar";
import Home from "./pages/home";
import ProductPage from "./pages/Productpage";
import Collection from "./pages/Collection";
import Checkout from "./pages/Checkout";
import Footer from "./components/Footer";
import MyOrders from "./pages/MyOrders";
import Philosophy from "./pages/Philosophy";
import Wishlist from "./pages/Wishlist";
import Account
from "./pages/Account";

function App() {
  const location = useLocation();

  // --- PRE-LOADER STATE ---
  const [showLoader, setShowLoader] = useState(true);
  const [fadeLoader, setFadeLoader] = useState(false);

  // The Pre-loader Timer Logic
  useEffect(() => {
    // 1. After 2 seconds, trigger the CSS 'fade-out' class (Slides it up)
    const fadeTimer = setTimeout(() => setFadeLoader(true), 2000);

    // 2. After 2.8 seconds, delete the loader from the code entirely so it doesn't block clicks
    const removeTimer = setTimeout(() => setShowLoader(false), 2800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // This ensures that when you click a link to a new page, it scrolls perfectly to the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {/* --- THE LUXURY SPLASH SCREEN --- */}
      {showLoader && (
        <div className={`luxury-preloader ${fadeLoader ? "fade-out" : ""}`}>
          <img
            src="/Main_logo.webp"
            alt="Emerald Green Labs"
            className="preloader-logo"
          />
        </div>
      )}

      {/* 1. Your Navigation */}
      <Navbar />

      {/* 2. The Router (Swaps the middle content) */}
      <main>

  <Routes>

    <Route
      path="/"
      element={<Home />}
    />

    <Route
      path="/product/:id"
      element={<ProductPage />}
    />

    <Route
      path="/admin"
      element={<AdminDashboard />}
    />

    <Route
      path="/collection"
      element={<Collection />}
    />

    <Route
      path="/wishlist"
      element={<Wishlist />}
    />

    <Route
      path="/checkout"
      element={<Checkout />}
    />

    <Route
      path="/myorders"
      element={<MyOrders />}
    />

    <Route
      path="/philosophy"
      element={<Philosophy />}
    />

    <Route
      path="/account"
      element={<Account />}
    />

  </Routes>

</main>

      {/* 3. Your Footer */}
      <Footer />
    </>
  );
}

export default App;
