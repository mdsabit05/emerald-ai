

import { useState } from "react";

import { useCart }
from "../components/CartContext";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "@clerk/clerk-react";

import {
  createOrder,
} from "../lib/api";

import {
  useAddress,
} from "../components/AddressContext";

import "./checkout.css";

export default function Checkout() {

  const {
    cartItems,
    cartTotal,
      increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  } = useCart();

  const navigate =
    useNavigate();

  const { getToken } =
    useAuth();

  const {
    addresses,
  } = useAddress();

  const [selectedAddress,
    setSelectedAddress] =
    useState(null);

  const [paymentMethod,
    setPaymentMethod] =
    useState("upi");

  const [upiId,
    setUpiId] =
    useState("");

  // SHIPPING
  const qualifiesForVipShipping =
    cartTotal >= 1000;

  const shippingCost =
    qualifiesForVipShipping
      ? 0
      : 150;

  const finalTotal =
    cartTotal + shippingCost;

  // DELIVERY DATE
  const deliveryDate =
    new Date();

  deliveryDate.setDate(
    deliveryDate.getDate() + 4
  );

  const formattedDate =
    deliveryDate.toLocaleDateString(
      "en-US",
      {
        weekday: "long",
        month: "long",
        day: "numeric",
      }
    );

  // EMPTY CART
  if (
    cartItems.length === 0
  ) {

    return (

      <div
        className="checkout-empty-state"
      >

        <h2>
          Your Bag is Empty
        </h2>

        <p>
          Explore our premium
          collection to begin.
        </p>

        <Link
          to="/collection"
          className="btn"
        >

          Return to Collection

        </Link>

      </div>
    );
  }

  // PAYMENT
  const handlePayment =
    async (e) => {

      e.preventDefault();

      // ADDRESS CHECK
      if (
        !selectedAddress
      ) {

        alert(
          "Please select a saved address"
        );

        return;
      }

      // UPI CHECK
      if (
        paymentMethod === "upi" &&
        !upiId
      ) {

        alert(
          "Please enter a valid UPI ID"
        );

        return;
      }

      try {

        const token =
          await getToken({
            template:
              "default",
          });

        const items =
          cartItems.map(
            (item) => ({
              productId:
                item.id,

              quantity:
                item.quantity,
            })
          );

        const data =
          await createOrder(
            token,
            items
          );

        console.log(data);

        alert(
          "Order placed successfully!"
        );

        navigate(
          "/myorders"
        );

      } catch (err) {

        console.error(err);

        alert(
          "Order failed"
        );
      }
    };

  return (

    <div className="checkout-page-wrapper">

      <div className="checkout-header-simple">

        <h2>
          Secure Checkout
        </h2>

      </div>

      <div className="checkout-grid">

        {/* LEFT */}
        <form
          className="checkout-form-section"
          onSubmit={
            handlePayment
          }
        >

          {/* CONTACT */}
          <div className="checkout-block">

            <span className="section-label">

              Contact Information

            </span>

            <input
              type="email"
              className="luxury-input"
              placeholder="Email Address"
              required
            />

            <div className="checkbox-group">

              <input
                type="checkbox"
                id="newsletter"
                defaultChecked
              />

              <label htmlFor="newsletter">

                Keep me updated on
                exclusive releases.

              </label>

            </div>

          </div>

          {/* ADDRESSES */}
          <div className="checkout-addresses">

            <h2>
              Choose Saved Address
            </h2>

            <div className="checkout-address-grid">

              {addresses.map(
                (item) => (

                  <button
                    key={item.id}

                    type="button"

                    className={`checkout-address-card ${
                      selectedAddress?.id ===
                      item.id
                        ? "active"
                        : ""
                    }`}

                    onClick={() =>
                      setSelectedAddress(
                        item
                      )
                    }
                  >

                    <h4>
                      {item.name}
                    </h4>

                    <p>
                      {item.phone}
                    </p>

                    <p>
                      {item.address}
                    </p>

                    <p>
                      {item.city},
                      {" "}
                      {item.state}
                    </p>

                    <p>
                      {
                        item.pincode
                      }
                    </p>

                  </button>
                )
              )}

            </div>

            {/* SELECTED */}
            {selectedAddress && (

              <div className="selected-address-preview">

                <h3>
                  Delivering To
                </h3>

                <p>
                  {
                    selectedAddress.name
                  }
                </p>

                <p>
                  {
                    selectedAddress.phone
                  }
                </p>

                <p>
                  {
                    selectedAddress.address
                  }
                </p>

                <p>
                  {
                    selectedAddress.city
                  }
                  ,
                  {" "}
                  {
                    selectedAddress.state
                  }
                </p>

                <p>
                  {
                    selectedAddress.pincode
                  }
                </p>

              </div>
            )}

          </div>

          {/* PAYMENT */}
          <div className="checkout-block">

            <span className="section-label">

              Payment Gateway

            </span>

            <div className="payment-selector">

              {/* UPI */}
              <label
                className={`payment-option ${
                  paymentMethod ===
                  "upi"
                    ? "active"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="payment"

                  checked={
                    paymentMethod ===
                    "upi"
                  }

                  onChange={() =>
                    setPaymentMethod(
                      "upi"
                    )
                  }
                />

                <div>

                  <span>
                    UPI
                  </span>

                  <small>
                    Instant payment
                    via GPay,
                    PhonePe,
                    Paytm etc.
                  </small>

                </div>

              </label>

              {paymentMethod ===
                "upi" && (

                <div className="upi-details-box">

                  <input
                    type="text"

                    className="luxury-input"

                    placeholder="Enter your UPI ID"

                    value={upiId}

                    onChange={(e) =>
                      setUpiId(
                        e.target.value
                      )
                    }
                  />

                </div>
              )}

              {/* CARD */}
              <label
                className={`payment-option ${
                  paymentMethod ===
                  "card"
                    ? "active"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="payment"

                  checked={
                    paymentMethod ===
                    "card"
                  }

                  onChange={() =>
                    setPaymentMethod(
                      "card"
                    )
                  }
                />

                <div>

                  <span>
                    Credit / Debit Card
                  </span>

                  <small>
                    Secure encrypted
                    payments.
                  </small>

                </div>

              </label>

            </div>

          </div>

          {/* PAY BTN */}
          <button
            type="submit"
            className="btn btn-place-order"
          >

            Pay ₹
            {finalTotal.toFixed(
              2
            )}
            {" "}
            & Place Order

          </button>

          <p className="secure-badge">

            🔒 256-bit Encrypted &
            Secure Processing

          </p>

        </form>

        {/* RIGHT */}
        <div className="checkout-summary-section">

          <div className="summary-box">

            <span className="section-label">

              Order Summary

            </span>

            {cartItems.map((item) => (

  <div
    className="summary-item"
    key={item.id}
  >

    {/* IMAGE */}
    <img
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

      className="summary-product-image"
    />

    {/* CONTENT */}
    <div className="summary-product-content">

      {/* TOP */}
      <div className="summary-product-top">

        <div>

          <h4>
            {item.name ||
             item.title}
          </h4>

          <p>
            Premium Wellness Product
          </p>

        </div>

        <span className="summary-price">

          ₹
          {(
            item.price *
            item.quantity
          ).toFixed(0)}

        </span>

      </div>

      {/* BOTTOM */}
      <div className="summary-bottom-row">

        {/* QUANTITY */}
        <div className="qty-box">

          <button
            type="button"

            onClick={() =>
              decreaseQuantity(
                item.id
              )
            }
          >
            −
          </button>

          <span>
            {item.quantity}
          </span>

          <button
            type="button"

            onClick={() =>
              increaseQuantity(
                item.id
              )
            }
          >
            +
          </button>

        </div>

        {/* REMOVE */}
        <button
          type="button"

          className="remove-cart-btn"

          onClick={() =>
            removeFromCart(
              item.id
            )
          }
        >
          Remove
        </button>

      </div>

    </div>

  </div>
))}

            {/* TOTALS */}
            <div className="summary-totals">

              <div className="total-row">

                <span>
                  Subtotal
                </span>

                <span>
                  ₹
                  {cartTotal.toFixed(
                    2
                  )}
                </span>

              </div>

              <div className="total-row">

                <span>
                  Shipping
                </span>

                {qualifiesForVipShipping ? (

                  <span className="vip-shipping">

                    Complimentary VIP

                  </span>

                ) : (

                  <span>

                    ₹
                    {shippingCost.toFixed(
                      2
                    )}

                  </span>
                )}

              </div>

            </div>

            <div className="total-row grand-total">

              <span>
                Total
              </span>

              <span>
                ₹
                {finalTotal.toFixed(
                  2
                )}
              </span>

            </div>

            {/* DELIVERY */}
            <div className="delivery-estimate">

              <span className="section-label">

                Guaranteed Arrival

              </span>

              <p>

                Arrives by
                {" "}
                <strong>
                  {
                    formattedDate
                  }
                </strong>

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
