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
  removeAddress,
  updateAddress,
} = useAddress();

const emptyForm = { name: "", phone: "", city: "", state: "", pincode: "", address: "" };

const [form, setForm] = useState(emptyForm);
const [editingId, setEditingId] = useState(null);
const [editForm, setEditForm] = useState(emptyForm);

  const [showAddressModal,
  setShowAddressModal] =
  useState(false);

  function handleSubmit(e) {
  e.preventDefault();
  if (form.phone.length !== 10) return;
  addAddress(form);
  setForm(emptyForm);
}

function handleEditSave(e) {
  e.preventDefault();
  if (editForm.phone.length !== 10) return;
  updateAddress(editingId, editForm);
  setEditingId(null);
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
        <h2>Addresses</h2>
        <button onClick={() => setShowAddressModal(false)}>✕</button>
      </div>

      {/* SAVED LIST */}
      {addresses.length > 0 && (
        <div className="address-modal-section">
          <p className="address-section-label">Saved Addresses</p>
          <div className="saved-address-grid">
            {addresses.map((item) => (
              <div key={item.id} className="saved-address-card">

                {editingId === item.id ? (
                  <form className="address-edit-form" onSubmit={handleEditSave}>
                    <input value={editForm.name} placeholder="Full Name" onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
                    <div className="phone-field">
                      <input type="tel" placeholder="+91 Phone Number" value={editForm.phone} maxLength={10} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, "") })} required />
                      {editForm.phone.length > 0 && editForm.phone.length !== 10 && (
                        <span className="phone-warning">Phone number must be 10 digits</span>
                      )}
                    </div>
                    <input value={editForm.city} placeholder="City" onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} required />
                    <input value={editForm.state} placeholder="State" onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} required />
                    <input value={editForm.pincode} placeholder="Pincode" onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })} required />
                    <textarea value={editForm.address} placeholder="Street / Full Address" onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} required />
                    <div className="address-card-actions">
                      <button type="submit" className="addr-save-btn">Save</button>
                      <button type="button" className="addr-cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <h4>{item.name}</h4>
                    <p>{item.phone}</p>
                    <p>{item.address}</p>
                    <p>{item.city}, {item.state} — {item.pincode}</p>
                    <div className="address-card-actions">
                      <button
                        type="button"
                        className="addr-edit-btn"
                        onClick={() => { setEditingId(item.id); setEditForm(item); }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="addr-delete-btn"
                        onClick={() => removeAddress(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}

              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIVIDER */}
      <div className="address-modal-divider" />

      {/* ADD FORM */}
      <div className="address-modal-section">
        <p className="address-section-label">Add New Address</p>
        <form className="address-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="phone-field">
            <input
              type="tel"
              placeholder="+91 Phone Number"
              value={form.phone}
              maxLength={10}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "") })}
              required
            />
            {form.phone.length > 0 && form.phone.length !== 10 && (
              <span className="phone-warning">Phone number must be 10 digits</span>
            )}
          </div>
          <input
            type="text"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="State"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Pincode"
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value })}
            required
          />
          <textarea
            placeholder="Street / Full Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
          <button type="submit">Save Address</button>
        </form>
      </div>

    </div>

  </div>
)}
    </section>
  );
}