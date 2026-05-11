// import { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';

// // --- REAL CLOUD FIREBASE IMPORTS ---
// import { auth, db, googleProvider } from '../firebase';
// import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
// import { doc, getDoc, setDoc } from 'firebase/firestore';

// export default function MyOrders() {
//   const [authMode, setAuthMode] = useState('login'); 
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [activeTab, setActiveTab] = useState('orders'); 
//   const [isNewUser, setIsNewUser] = useState(false);

//   // User Data State
//   const [userData, setUserData] = useState({
//     firstName: '', lastName: '', email: '', phone: '', address: '', city: '', zip: '', profilePic: null
//   });

//   const [formData, setFormData] = useState({ email: '', password: '' });

//   // --- LIVE CLOUD AUTHENTICATION LISTENER ---
//  // --- LIVE CLOUD AUTHENTICATION LISTENER (WITH SAFETY NET) ---
//   // --- TEMPORARY DIAGNOSTIC LISTENER (NO DATABASE) ---
//   // --- LIVE CLOUD AUTHENTICATION & DATABASE LISTENER ---
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (user) {
//         try {
//           // Point directly to this specific user's document in your Indian database
//           const userRef = doc(db, "users", user.uid);
//           const userSnap = await getDoc(userRef);

//           if (userSnap.exists()) {
//             // User exists! Load their saved profile.
//             setUserData(userSnap.data());
//             setIsNewUser(false);
//           } else {
//             // First time logging in! Create a new profile in the database.
//             const newProfile = {
//               firstName: user.displayName?.split(' ')[0] || 'VIP',
//               lastName: user.displayName?.split(' ')[1] || '',
//               email: user.email,
//               phone: '', address: '', city: '', zip: '',
//               profilePic: user.photoURL || null
//             };
//             await setDoc(userRef, newProfile);
//             setUserData(newProfile);
//             setIsNewUser(true);
//           }
//         } catch (error) {
//           console.error("Database connection error:", error);
//           // If a strict firewall blocks it again, it will at least tell us!
//         }
        
//         setIsAuthenticated(true);
//       } else {
//         setIsAuthenticated(false);
//       }
//     });

//     return () => unsubscribe();
//   }, []);

  
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   // --- THE GOOGLE LOGIN TRIGGER ---
// // --- THE GOOGLE LOGIN TRIGGER (UPDATED TO REDIRECT) ---
// const handleGoogleSignIn = async () => {
//     try {
//       await signInWithPopup(auth, googleProvider);
//     } catch (error) {
//       console.error("Popup Error:", error);
//       alert("Please allow popups for localhost to log in!");
//     }
//   };

//   const handleAuthSubmit = (e) => {
//     e.preventDefault();
//     alert("Email/Password login is currently routing through Google for enhanced security. Please click 'Continue with Google'.");
//   };

//   const handleSignOut = () => {
//     const isConfirmed = window.confirm("Are you sure you want to sign out of your Emerald Green account?");
//     if (isConfirmed) {
//       signOut(auth);
//     }
//   };

//   // --- VIEW 1: REAL AUTHENTICATION SCREEN ---
//   if (!isAuthenticated) {
//     return (
//       <div className="profile-page-wrapper auth-view">
//         <div className="auth-container">
//           <div className="auth-header">
//             <h2>Emerald VIP</h2>
//             <p>Access your personal wellness concierge and order tracking.</p>
//           </div>

//           {/* LUXURY GOOGLE BUTTON */}
//           <button type="button" onClick={handleGoogleSignIn} style={{
//             width: '100%', padding: '15px', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
//             backgroundColor: '#fff', color: '#000', border: '1px solid rgba(19, 46, 36, 0.2)', borderRadius: '4px', cursor: 'pointer',
//             fontFamily: 'Montserrat, sans-serif', fontSize: '0.9rem', fontWeight: '600', transition: 'transform 0.3s'
//           }}>
//             <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{width: '20px'}} />
//             Continue with Google
//           </button>

//           <div style={{display: 'flex', alignItems: 'center', gap: '15px', margin: '0 0 2rem 0', opacity: 0.5}}>
//             <div style={{flex: 1, height: '1px', backgroundColor: 'var(--emerald)'}}></div>
//             <span style={{fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '2px'}}>Or</span>
//             <div style={{flex: 1, height: '1px', backgroundColor: 'var(--emerald)'}}></div>
//           </div>

//           <form className="auth-form" onSubmit={handleAuthSubmit}>
//             <input type="email" name="email" className="luxury-input" placeholder="Email Address" value={formData.email} onChange={handleInputChange} />
//             <input type="password" name="password" className="luxury-input" placeholder="Password" value={formData.password} onChange={handleInputChange} />
            
//             <button type="submit" className="btn btn-buy-now">
//               Access Profile
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   // --- VIEW 2: THE VIP DASHBOARD ---
//   return (
//     <div className="profile-page-wrapper dashboard-view">
//       <div className="dashboard-layout">
        
//         {/* Sidebar Navigation */}
//         <aside className="dashboard-sidebar">
//           <div className="user-profile-summary">
//             <div className="avatar-container">
//               {userData.profilePic ? (
//                 <img src={userData.profilePic} alt="Profile" className="user-avatar" referrerPolicy="no-referrer" />
//               ) : (
//                 <div className="avatar-placeholder">{userData.firstName.charAt(0)}</div>
//               )}
//             </div>
//             <div className="user-greeting">
//               <h3>{isNewUser ? 'Welcome,' : 'Welcome back,'}</h3>
//               <h2>{userData.firstName}.</h2>
//               <h3>Tier :</h3>
//               <span className="vip-badge">Emerald Green Member 💌</span>
//             </div>
//           </div>

//           <nav className="dashboard-nav">
//             <div className="nav-tabs-group">
//               <button className={`nav-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>Active Orders</button>
//               <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Order History</button>
//               <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile & Settings</button>
//             </div>
            
//             <button className="nav-btn logout-btn" onClick={handleSignOut}>
//               Sign Out
//             </button>
//           </nav>
//         </aside>

//         {/* Main Content Area */}
//         <main className="dashboard-content">
          
//           {activeTab === 'orders' && (
//             <div className="tracking-hub">
//               <span className="section-label">Live Tracking</span>
//               <h2 className="dashboard-title">Active Orders</h2>
//               <div className="empty-state-card">
//                 <div className="empty-state-icon">📦</div>
//                 <h3>No active orders</h3>
//                 <p>You currently have no orders in transit. Explore our collection to begin your wellness journey.</p>
//                 <Link to="/collection" className="btn" style={{marginTop: '1.5rem'}}>Shop the Collection</Link>
//               </div>
//             </div>
//           )}

//           {activeTab === 'history' && (
//             <div className="history-hub">
//               <span className="section-label">Past Deliveries</span>
//               <h2 className="dashboard-title">Order History</h2>
//               <div className="empty-state-card">
//                 <h3>No order history</h3>
//                 <p>Once your first order is delivered, your receipts and re-order links will appear here.</p>
//               </div>
//             </div>
//           )}

//           {activeTab === 'profile' && (
//             <div className="profile-settings-hub">
//               <span className="section-label">Account Details</span>
//               <h2 className="dashboard-title">Profile & Settings</h2>
              
//               <div className="settings-grid">
//                 <div className="settings-block photo-upload-block">
//                   <div className="current-photo">
//                     {userData.profilePic ? <img src={userData.profilePic} alt="Profile" referrerPolicy="no-referrer" /> : <div className="placeholder">{userData.firstName.charAt(0)}</div>}
//                   </div>
//                   <div className="photo-actions">
//                     <h4>Profile Picture</h4>
//                     <p>Your avatar is currently synced securely via Google.</p>
//                   </div>
//                 </div>

//                 <form className="settings-form" onSubmit={(e) => { e.preventDefault(); alert("Profile Updates via Cloud coming next!"); }}>
//                   <h4 className="form-section-title">Personal Information</h4>
//                   <div className="input-row">
//                     <div className="input-group">
//                       <label>First Name</label>
//                       <input type="text" name="firstName" className="luxury-input" value={userData.firstName} readOnly />
//                     </div>
//                     <div className="input-group">
//                       <label>Last Name</label>
//                       <input type="text" name="lastName" className="luxury-input" value={userData.lastName} readOnly />
//                     </div>
//                   </div>

//                   <div className="input-row">
//                     <div className="input-group">
//                       <label>Email Address</label>
//                       <input type="email" name="email" className="luxury-input" value={userData.email} readOnly style={{opacity: 0.6}} />
//                     </div>
//                     <div className="input-group">
//                       <label>Phone Number</label>
//                       <input type="tel" name="phone" className="luxury-input" placeholder="+91" defaultValue={userData.phone} />
//                     </div>
//                   </div>

//                   <button type="submit" className="btn btn-buy-now" style={{marginTop: '2rem'}}>Save Changes to Cloud</button>
//                 </form>
//               </div>
//             </div>
//           )}

//         </main>
//       </div>
//     </div>
//   );
// }


import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import {
  useAuth,
  useUser,
  UserButton,
} from "@clerk/clerk-react";

import { getMyOrders } from "../lib/api";

export default function MyOrders() {

  const { getToken } = useAuth();

  const { user } = useUser();

  const [orders, setOrders] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [activeTab, setActiveTab] =
    useState("orders");

  // FETCH ORDERS
  useEffect(() => {
    async function fetchOrders() {
      try {
        const token = await getToken({
          template: "default",
        });

        const data = await getMyOrders(
          token
        );

        setOrders(data);

      } catch (err) {
        setError(err.message);

      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  // LOADING
  if (loading) {
    return (
      <div
        style={{
          padding: "4rem",
          textAlign: "center",
        }}
      >
        <h2>Loading orders...</h2>
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div
        style={{
          padding: "4rem",
          textAlign: "center",
        }}
      >
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper dashboard-view">

      <div className="dashboard-layout">

        {/* SIDEBAR */}
        <aside className="dashboard-sidebar">

          <div className="user-profile-summary">

            <div
              style={{
                marginBottom: "1rem",
              }}
            >
              <UserButton />
            </div>

            <div className="user-greeting">

              <h3>Welcome back,</h3>

              <h2>
                {user?.firstName || "VIP"}.
              </h2>

              <span className="vip-badge">
                Emerald Green Member 💌
              </span>

            </div>

          </div>

          <nav className="dashboard-nav">

            <div className="nav-tabs-group">

              <button
                className={`nav-btn ${
                  activeTab === "orders"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab("orders")
                }
              >
                My Orders
              </button>

              <button
                className={`nav-btn ${
                  activeTab === "profile"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveTab("profile")
                }
              >
                Profile
              </button>

            </div>

          </nav>

        </aside>

        {/* MAIN */}
        <main className="dashboard-content">

          {/* ORDERS */}
          {activeTab === "orders" && (

            <div className="tracking-hub">

              <span className="section-label">
                Your Purchases
              </span>

              <h2 className="dashboard-title">
                My Orders
              </h2>

              {orders.length === 0 ? (

                <div className="empty-state-card">

                  <div className="empty-state-icon">
                    📦
                  </div>

                  <h3>No orders yet</h3>

                  <p>
                    Explore our premium
                    collection to begin your
                    wellness journey.
                  </p>

                  <Link
                    to="/collection"
                    className="btn"
                    style={{
                      marginTop: "1.5rem",
                    }}
                  >
                    Shop Collection
                  </Link>

                </div>

              ) : (

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    marginTop: "2rem",
                  }}
                >

                  {orders.map((order) => (

                    <div
                      key={order.id}
                      style={{
                        border:
                          "1px solid #ddd",
                        padding: "1.5rem",
                        borderRadius: "8px",
                        background: "#fff",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          marginBottom:
                            "1rem",
                        }}
                      >

                        <h3>
                          Order #{order.id}
                        </h3>

                        <span
                          style={{
                            fontWeight:
                              "bold",
                          }}
                        >
                          {order.status}
                        </span>

                      </div>

                      <p>
                        Total: ₹
                        {order.totalAmount}
                      </p>

                      <p>
                        Date:{" "}
                        {new Date(
                          order.createdAt
                        ).toLocaleString()}
                      </p>

                    </div>

                  ))}

                </div>

              )}

            </div>

          )}

          {/* PROFILE */}
          {activeTab === "profile" && (

            <div className="profile-settings-hub">

              <span className="section-label">
                Account
              </span>

              <h2 className="dashboard-title">
                Profile
              </h2>

              <div
                style={{
                  marginTop: "2rem",
                }}
              >

                <p>
                  <strong>Name:</strong>{" "}
                  {user?.fullName}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {
                    user?.primaryEmailAddress
                      ?.emailAddress
                  }
                </p>

              </div>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}