import { useCart } from "./CartContext";
import { Link } from "react-router-dom";
import "./CartDrawer.css";
export default function CartDrawer() {

  const {
    cartItems,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
  } = useCart();

  return (
    <>
      {/* OVERLAY */}
      <div
        className={`cart-overlay ${
          isCartOpen ? "open" : ""
        }`}
        onClick={() =>
          setIsCartOpen(false)
        }
      />

      {/* DRAWER */}
      <div
        className={`cart-drawer ${
          isCartOpen ? "open" : ""
        }`}
      >

        {/* HEADER */}
        <div className="cart-header">

          <h2>Your Cart</h2>

          <button
            className="close-cart-btn"
            onClick={() =>
              setIsCartOpen(false)
            }
          >
            ✕
          </button>

        </div>

        {/* ITEMS */}
        <div className="cart-items-container">

          {cartItems.length === 0 ? (

            <div className="empty-cart-message">

              <p>Your bag is currently empty.</p>

              <button
                className="continue-shopping-btn"
                onClick={() =>
                  setIsCartOpen(false)
                }
              >
                Continue Shopping
              </button>

            </div>

          ) : (

            <div className="cart-items">

              {cartItems.map((item) => (

                <div
                  className="cart-item"
                  key={item.id}
                >

                  {/* IMAGE */}
                  <img
                    className="cart-item-image"
                    src={
                      item.image ||
                      item.img ||
                      item.images?.[0] ||
                      "/placeholder.png"
                    }
                    alt={
                      item.name ||
                      item.title
                    }
                  />

                  {/* DETAILS */}
                  <div className="cart-item-content">

                    <div className="cart-item-info">

                      <h4>
                        {item.name ||
                         item.title}
                      </h4>

                      <p>
                        Quantity: {item.quantity}
                      </p>

                      <span>
                        ₹
                        {(
                          item.price *
                          item.quantity
                        ).toFixed(2)}
                      </span>

                    </div>

                    {/* REMOVE */}
                    <button
                      className="remove-item-btn"
                      onClick={() =>
                        removeFromCart(item.id)
                      }
                    >
                      ✕
                    </button>

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* FOOTER */}
        {cartItems.length > 0 && (

          <div className="cart-footer">

            <div className="cart-subtotal">

              <span>Subtotal</span>

              <span>
                ₹{cartTotal.toFixed(2)}
              </span>

            </div>

            <p className="shipping-note">
              Shipping and taxes calculated at checkout.
            </p>

            <Link
              to="/checkout"
              className="cart-checkout-btn"
              onClick={() =>
                setIsCartOpen(false)
              }
            >
              CHECKOUT — ₹{cartTotal.toFixed(2)}
            </Link>

          </div>
        )}

      </div>
    </>
  );
}