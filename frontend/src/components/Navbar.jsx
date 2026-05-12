import {
  useState,
  useEffect,
} from "react";
import {
  useUser,
} from "@clerk/clerk-react";
import { Link } from "react-router-dom";

import {
  Heart,
  Search,
} from "lucide-react";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";

import { useCart }
from "./CartContext";

import {
  useWishlist,
} from "./WishlistContext";

import {
  getProducts,
} from "../lib/api";

import "./Navbar.css";
import "./CartDrawer.css";

export default function Navbar() {
const { user } =
  useUser();
  
  const [isMenuOpen,
    setIsMenuOpen] =
    useState(false);

  // CART
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    cartCount,
    cartTotal,
    removeFromCart,
    toast,
  } = useCart();

  // WISHLIST
  const {
    wishlist,
  } = useWishlist();

  // SEARCH
  const [searchOpen,
    setSearchOpen] =
    useState(false);

  const [searchQuery,
    setSearchQuery] =
    useState("");

  const [results,
    setResults] =
    useState([]);

  const [debouncedQuery,
    setDebouncedQuery] =
    useState("");

  const [searchLoading,
    setSearchLoading] =
    useState(false);

  // MENU
  const toggleMenu =
    () =>
      setIsMenuOpen(
        !isMenuOpen
      );

  const closeMenu =
    () =>
      setIsMenuOpen(false);

  // CART
  const toggleCart =
    () =>
      setIsCartOpen(
        !isCartOpen
      );

  // FETCH PRODUCTS
  useEffect(() => {

    async function
    fetchSearchProducts() {

      try {

        const data =
          await getProducts();

        setResults(data);

      } catch (err) {

        console.log(err);
      }
    }

    fetchSearchProducts();

  }, []);

  // SEARCH DEBOUNCE
  useEffect(() => {

    setSearchLoading(true);

    const timer =
      setTimeout(() => {

        setDebouncedQuery(
          searchQuery
        );

        setSearchLoading(false);

      }, 350);

    return () =>
      clearTimeout(timer);

  }, [searchQuery]);

  // ESC CLOSE
  useEffect(() => {

    function handleEsc(e) {

      if (
        e.key === "Escape"
      ) {

        setSearchOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleEsc
    );

    return () => {

      window.removeEventListener(
        "keydown",
        handleEsc
      );
    };

  }, []);

  // FILTER RESULTS
  const filteredResults =
    results.filter(
      (product) =>

        product.name
          .toLowerCase()

          .includes(
            debouncedQuery.toLowerCase()
          )
    );

  return (
    <>

      {/* HEADER */}
      <header>

        {/* LOGO */}
        <div className="logo-container">

          <Link to="/">

            <img
              src="/logo with name.webp"
              alt="Emerald Green Labs"
            />

          </Link>

        </div>

        {/* NAV */}
        <nav>

          <ul
            className={
              isMenuOpen
                ? "active"
                : ""
            }
            id="nav-menu"
          >

            <li>
              <Link
                to="/"
                onClick={
                  closeMenu
                }
              >
                Home
              </Link>
            </li>

            <li>
              <Link
                to="/philosophy"
                onClick={
                  closeMenu
                }
              >
                Philosophy
              </Link>
            </li>

            <li>
              <Link
                to="/collection"
                onClick={
                  closeMenu
                }
              >
                Collection
              </Link>
            </li>

            <li>
              <Link
                to="/wishlist"
                onClick={
                  closeMenu
                }
              >
                Wishlist
              </Link>
            </li>

            <li>
              <Link
                to="/myorders"
                onClick={
                  closeMenu
                }
              >
                My Orders
              </Link>
            </li>

            {user?.publicMetadata?.role === "admin" && (
              <li>
                <Link
                  to="/admin"
                  onClick={closeMenu}
                  className="nav-admin-link"
                >
                  Admin
                </Link>
              </li>
            )}

          </ul>

        </nav>

        {/* RIGHT */}
        <div className="header-controls">

          {/* SEARCH */}
          <button
            className="nav-icon-btn"
            onClick={() =>
              setSearchOpen(true)
            }
          >

            <Search size={20} />

          </button>

          {/* WISHLIST */}
          <Link
            to="/wishlist"
            className="wishlist-nav-btn"
          >

            <Heart size={22} />

            {wishlist.length >
              0 && (

              <span className="wishlist-count">

                {wishlist.length}

              </span>
            )}

          </Link>

          {/* AUTH */}
          <SignedOut>

            <SignInButton mode="modal">

              <button
                className="signin-btn"
              >

                Sign In

              </button>

            </SignInButton>

          </SignedOut>

          <SignedIn>

         <Link to="/account">

  <img
    src={user?.imageUrl}
    alt="profile"
    className="navbar-profile"
  />

</Link>

          </SignedIn>

          {/* CART */}
          <button
            className="cart-btn"
            onClick={
              toggleCart
            }
          >

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >

              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>

              <line
                x1="3"
                y1="6"
                x2="21"
                y2="6"
              ></line>

              <path d="M16 10a4 4 0 0 1-8 0"></path>

            </svg>

            <span>
              ({cartCount})
            </span>

          </button>

          {/* MOBILE */}
          <button
            className="mobile-menu-btn"
            onClick={
              toggleMenu
            }
          >

            {isMenuOpen
              ? "✕"
              : "☰"}

          </button>

        </div>

      </header>

      {/* CART OVERLAY */}
      <div
        className={`cart-overlay ${
          isCartOpen
            ? "open"
            : ""
        }`}
        onClick={
          toggleCart
        }
      />

      {/* CART DRAWER */}
      <div
        className={`cart-drawer ${
          isCartOpen
            ? "open"
            : ""
        }`}
      >

        <div className="cart-header">

          <h3>
            Your Cart
          </h3>

          <button
            onClick={
              toggleCart
            }
            className="close-cart"
          >

            ✕

          </button>

        </div>

        <div className="cart-body">

          {cartItems.length ===
          0 ? (

            <p className="empty-cart-msg">

              Your cart is currently empty.

            </p>

          ) : (

            <div className="cart-items-list">

              {cartItems.map(
                (item) => (

                  <div
                    key={item.id}
                    className="cart-item"
                  >

                    <img
                      src={item.img}
                      alt={item.title}
                      className="cart-item-img"
                    />

                    <div className="cart-item-info">

                      <h4>
                        {item.title}
                      </h4>

                      <p>

                        ₹
                        {item.price}
                        {" "}
                        ×
                        {" "}
                        {item.quantity}

                      </p>

                    </div>

                    <button
                      onClick={() =>
                        removeFromCart(
                          item.id
                        )
                      }
                      className="remove-cart-item"
                    >

                      ✕

                    </button>

                  </div>
                )
              )}

            </div>
          )}

        </div>

        <div className="cart-footer">

          <Link
            to="/checkout"
            onClick={
              toggleCart
            }
            className="btn btn-buy-now checkout-btn"
          >

            Checkout —
            {" "}
            ₹
            {cartTotal.toFixed(
              2
            )}

          </Link>

        </div>

      </div>

      {/* TOAST */}
      <div
        className={`premium-toast ${
          toast?.isVisible
            ? "show"
            : ""
        }`}
      >

        <div className="toast-content">

          <img
            src={toast?.img}
            alt="Product"
            className="toast-img"
          />

          <div className="toast-text">

            <span className="toast-label">

              Added to Cart

            </span>

            <p>
              {toast?.productName}
            </p>

          </div>

        </div>

      </div>

      {/* SEARCH MODAL */}
      {searchOpen && (

        <div
          className="search-modal"
          onClick={() =>
            setSearchOpen(false)
          }
        >

          <div
            className="search-box"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(
                  e.target.value
                )
              }
              autoFocus
            />

            <button
              onClick={() =>
                setSearchOpen(false)
              }
            >

              ✕

            </button>

          </div>

          <div
            className="search-results"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {searchLoading && (

              <div className="search-loading">

                Searching...

              </div>
            )}

            {filteredResults.length >
            0 ? (

              filteredResults
                .slice(0, 6)
                .map((product) => (

                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="search-result-card"
                    onClick={() =>
                      setSearchOpen(false)
                    }
                  >

                    <img
                      src={product.imageUrl}
                      alt={product.name}
                    />

                    <div>

                      <h4>
                        {product.name}
                      </h4>

                      <p>
                        ₹{product.price}
                      </p>

                    </div>

                  </Link>
                ))

            ) : (

              <div className="no-search-results">

                <span>
                  No products found
                </span>

                <p>
                  Try searching
                  with a different
                  keyword.
                </p>

              </div>
            )}

          </div>

        </div>
      )}

    </>
  );
}