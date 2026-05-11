import {
  useState,
} from "react";

import {
  useUser,
  UserButton,
} from "@clerk/clerk-react";
import { Link }
from "react-router-dom";
import {
  useAddress,
} from "../components/AddressContext";
import {
  Heart,
  ShoppingBag,
  MapPin,
  Package,
} from "lucide-react";

import "./account.css";

export default function Account() {
   
  const { user } =
    useUser();
  
    

    const {
  addresses,
  addAddress,
} = useAddress();

const [form,
  setForm] =
  useState({
    name: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
  });

  const [showAddressModal,
  setShowAddressModal] =
  useState(false);

  function handleSubmit(e) {

  e.preventDefault();

  addAddress(form);

  setForm({
    name: "",
    phone: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
  });
}


  return (

    <section className="account-page">

      <div className="account-container">

        {/* HERO */}
        <div className="account-hero">

          <div className="account-user">

            <img
              src={
                user?.imageUrl
              }
              alt="profile"
            />

            <div>

              <h1>
                {
                  user?.fullName
                }
              </h1>

              <p>
                {
                  user
                    ?.primaryEmailAddress
                    ?.emailAddress
                }
              </p>

            </div>

          </div>

          <UserButton />

        </div>

        {/* GRID */}
        <div className="account-grid">

          {/* WISHLIST */}
          <Link
            to="/wishlist"
            className="account-card"
          >
         

            <Heart size={22} />

            <h3>
              Wishlist
            </h3>

            <p>
              Save products you
              love for later.
            </p>

          </Link>

          {/* ORDERS */}
          <Link
            to="/myorders"
            className="account-card"
          >

            <ShoppingBag size={22} />

            <h3>
              Orders
            </h3>

            <p>
              Track recent
              purchases and
              deliveries.
            </p>

          </Link>

          {/* ADDRESS */}
          <button
  className="account-card"
  onClick={() =>
    setShowAddressModal(true)
  }
>

            <MapPin size={22} />

            <h3>
              Addresses
            </h3>

            <p>
              Manage shipping
              and billing
              addresses.
            </p>

          </button>

          {/* COLLECTION */}
          <Link
            to="/collection"
            className="account-card"
          >

            <Package size={22} />

            <h3>
              Explore Collection
            </h3>

            <p>
              Discover premium
              wellness products.
            </p>

          </Link>


        </div>

      </div>
{showAddressModal && (

  <div
    className="address-modal-overlay"
    onClick={() =>
      setShowAddressModal(false)
    }
  >

    <div
      className="address-modal"
      onClick={(e) =>
        e.stopPropagation()
      }
    >

      <div className="address-modal-top">

        <h2>
          Saved Addresses
        </h2>

        <button
          onClick={() =>
            setShowAddressModal(false)
          }
        >
          ✕
        </button>

      </div>

      <form
        className="address-form"
        onSubmit={handleSubmit}
      >

        <input
          type="text"
          placeholder="Full Name"
          value={form.name}
          onChange={(e) =>
            setForm({
              ...form,
              name: e.target.value,
            })
          }
          required
        />

        <input
          type="text"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) =>
            setForm({
              ...form,
              phone: e.target.value,
            })
          }
          required
        />

        <input
          type="text"
          placeholder="City"
          value={form.city}
          onChange={(e) =>
            setForm({
              ...form,
              city: e.target.value,
            })
          }
          required
        />

        <input
          type="text"
          placeholder="State"
          value={form.state}
          onChange={(e) =>
            setForm({
              ...form,
              state: e.target.value,
            })
          }
          required
        />

        <input
          type="text"
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) =>
            setForm({
              ...form,
              pincode: e.target.value,
            })
          }
          required
        />

        <textarea
          placeholder="Full Address"
          value={form.address}
          onChange={(e) =>
            setForm({
              ...form,
              address: e.target.value,
            })
          }
          required
        />

        <button type="submit">

          Save Address

        </button>

      </form>

      <div className="saved-address-grid">

        {addresses.map((item) => (

          <div
            key={item.id}
            className="saved-address-card"
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
              {item.city}, {item.state}
            </p>

            <p>
              {item.pincode}
            </p>

          </div>
        ))}

      </div>

    </div>

  </div>
)}
    </section>
  );
}