import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { useAuth } from "@clerk/clerk-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

import {
  getAllOrders,
  updateOrderStatus,
  getProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  getSlides,
  updateSlide,
  getOrderDetails,
  createSlide,
  deleteSlide,
  getAnalytics,
} from "../lib/api";

export default function AdminDashboard() {
  const { getToken } = useAuth();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] =
    useState("orders");

  const [editingProductId,
    setEditingProductId] =
    useState(null);

  const [uploadingImage,
    setUploadingImage] =
    useState(false);

  const [sliderSlides, setSliderSlides] = useState([]);
  const [uploadingSlide, setUploadingSlide] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [newSlideProductId, setNewSlideProductId] = useState("");
  const [creatingSlide, setCreatingSlide] = useState(false);

  const [productForm, setProductForm] =
    useState({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      images: [],
      stock: "",
      category: "",
    });
  const [uploadingExtraImage, setUploadingExtraImage] = useState(false);

    const [toast, setToast] = useState({
  show: false,
  message: "",
  type: "success",
});
const showToast = (message, type = "success") => {
  setToast({
    show: true,
    message,
    type,
  });

  setTimeout(() => {
    setToast({
      show: false,
      message: "",
      type: "success",
    });
  }, 3000);
};

  // SLIDER IMAGE UPLOAD
  async function handleSlideImageUpload(e, slide) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingSlide(slide.id);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ecommerce_upload");
      const res = await fetch("https://api.cloudinary.com/v1_1/dypqnj5e9/image/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");
      const token = await getToken();
      const updated = await updateSlide(token, slide.id, {
        label: slide.label,
        imageUrl: data.secure_url,
        productId: slide.productId,
      });
      setSliderSlides((prev) => prev.map((s) => s.id === slide.id ? updated : s));
      showToast("Slide image updated!");
    } catch (err) {
      console.error(err);
      showToast("Image upload failed", "error");
    } finally {
      setUploadingSlide(null);
    }
  }

  async function handleSlideProductChange(slide, productId) {
    try {
      const token = await getToken();
      const updated = await updateSlide(token, slide.id, {
        label: slide.label,
        imageUrl: slide.imageUrl,
        productId: productId ? Number(productId) : null,
      });
      setSliderSlides((prev) => prev.map((s) => s.id === slide.id ? updated : s));
      showToast("Slide updated!");
    } catch (err) {
      showToast("Failed to update slide", "error");
    }
  }

  async function handleSlideRemoveImage(slide) {
    try {
      const token = await getToken();
      const updated = await updateSlide(token, slide.id, {
        label: slide.label,
        imageUrl: "",
        productId: slide.productId,
      });
      setSliderSlides((prev) => prev.map((s) => s.id === slide.id ? updated : s));
      showToast("Image removed!");
    } catch (err) {
      showToast("Failed to remove image", "error");
    }
  }

  // FETCH ANALYTICS (lazy — only when tab opened)
  async function loadAnalytics() {
    if (analytics) return;
    setAnalyticsLoading(true);
    try {
      const token = await getToken();
      const data = await getAnalytics(token);
      setAnalytics(data);
    } catch (err) {
      showToast("Failed to load analytics", "error");
    } finally {
      setAnalyticsLoading(false);
    }
  }

  // CREATE SLIDE
  async function handleCreateSlide(e) {
    e.preventDefault();
    if (!newSlideProductId) return;
    const selectedProduct = products.find((p) => p.id === Number(newSlideProductId));
    if (!selectedProduct) return;
    setCreatingSlide(true);
    try {
      const token = await getToken({ template: "default" });
      const slide = await createSlide(token, {
        label: selectedProduct.name,
        productId: selectedProduct.id,
        imageUrl: selectedProduct.imageUrl || "",
      });
      setSliderSlides((prev) => [...prev, slide]);
      setNewSlideProductId("");
      showToast("Slide created!");
    } catch (err) {
      showToast("Failed to create slide: " + err.message, "error");
    } finally {
      setCreatingSlide(false);
    }
  }

  // DELETE SLIDE
  async function handleDeleteSlide(slideId) {
    try {
      const token = await getToken();
      await deleteSlide(token, slideId);
      setSliderSlides((prev) => prev.filter((s) => s.id !== slideId));
      showToast("Slide deleted!");
    } catch (err) {
      showToast("Failed to delete slide", "error");
    }
  }

  // IMAGE UPLOAD
  async function handleImageUpload(e) {
    const file = e.target.files[0];

    if (!file) return;

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append("file", file);

      formData.append(
        "upload_preset",
        "ecommerce_upload"
      );

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dypqnj5e9/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!data.secure_url) {
        throw new Error("Upload failed");
      }

      setProductForm((prev) => ({
        ...prev,
        imageUrl: data.secure_url,
      }));

    } catch (err) {
      console.error(err);

      showToast("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  // EXTRA IMAGE UPLOAD
  async function handleExtraImageUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploadingExtraImage(true);
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ecommerce_upload");
        const res = await fetch("https://api.cloudinary.com/v1_1/dypqnj5e9/image/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!data.secure_url) throw new Error("Upload failed");
        return data.secure_url;
      }));
      setProductForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
    } catch {
      showToast("Extra image upload failed", "error");
    } finally {
      setUploadingExtraImage(false);
      e.target.value = "";
    }
  }

  // FETCH DATA
  useEffect(() => {
    async function fetchData() {
      try {
        const token = await getToken();

        const ordersData =
          await getAllOrders(token);

        setOrders(ordersData);

        const productsData = await getProducts();
        setProducts(productsData);

        try {
          const slidesData = await getSlides();
          setSliderSlides(slidesData);
        } catch {}

      } catch (err) {
        console.error(err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // CREATE / UPDATE PRODUCT
  async function handleCreateProduct(e) {
    e.preventDefault();

    try {
      const token = await getToken({
        template: "default",
      });

      const payload = {
        ...productForm,
        price: Number(productForm.price),
        stock: Number(productForm.stock),
      };

      if (editingProductId) {

        await updateProduct(
          token,
          editingProductId,
          payload
        );

        showToast("Product updated!");

      } else {

        await createProduct(
          token,
          payload
        );

        showToast("Product created!");
      }

      const productsData =
        await getProducts();

      setProducts(productsData);

      setProductForm({
        name: "",
        description: "",
        price: "",
        imageUrl: "",
        images: [],
        stock: "",
        category: "",
      });

      setEditingProductId(null);

    } catch (err) {
      console.error(err);

      showToast("Failed to save product", "error");
    }
  }

  // EDIT PRODUCT
  function handleEditClick(product) {

    setEditingProductId(product.id);

    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      images: product.images || [],
      stock: product.stock,
      category: product.category,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // DELETE PRODUCT
  async function handleDeleteProduct(
    productId
  ) {
    try {

      const token = await getToken({
        template: "default",
      });

      await deleteProduct(
        token,
        productId
      );

      setProducts((prev) =>
        prev.filter(
          (product) =>
            product.id !== productId
        )
      );

      showToast("Product deleted!");

    } catch (err) {

      console.error(err);

      showToast("Failed to delete product", "error");
    }
  }

  // UPDATE ORDER STATUS
  async function handleStatusChange(
    orderId,
    status
  ) {
    try {

      const token = await getToken({
        template: "default",
      });

      await updateOrderStatus(
        token,
        orderId,
        status
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status,
              }
            : order
        )
      );

    } catch (err) {

      console.error(err);

      showToast("Failed to update order", "error");
    }
  }

  // VIEW ORDER DETAILS
  async function handleViewDetails(orderId) {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
      setOrderDetail(null);
      return;
    }
    setExpandedOrder(orderId);
    setOrderDetail(null);
    setLoadingDetail(true);
    try {
      const token = await getToken();
      const data = await getOrderDetails(token, orderId);
      setOrderDetail(data);
    } catch (err) {
      showToast("Failed to load order details", "error");
    } finally {
      setLoadingDetail(false);
    }
  }

  // ANALYTICS
  const totalRevenue = orders.reduce(
    (acc, order) =>
      acc + order.totalAmount,
    0
  );

  const pendingOrders =
    orders.filter(
      (order) =>
        order.status === "pending"
    ).length;

  const deliveredOrders =
    orders.filter(
      (order) =>
        order.status === "delivered"
    ).length;

  // LOADING
  if (loading) {
    return (
      <div className="page-spinner"><div className="spinner" /></div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="admin-page">
        <h2>{error}</h2>
      </div>
    );
  }

  return (
    <div className="admin-page">

      <h1 className="admin-title">
        Admin Dashboard
      </h1>

      {/* TABS */}
      <div className="admin-tabs">

        <button
          className={
            activeTab === "orders"
              ? "active-tab"
              : ""
          }
          onClick={() =>
            setActiveTab("orders")
          }
        >
          Orders
        </button>

        <button
          className={
            activeTab === "products"
              ? "active-tab"
              : ""
          }
          onClick={() =>
            setActiveTab("products")
          }
        >
          Products
        </button>

        <button
          className={activeTab === "slider" ? "active-tab" : ""}
          onClick={() => setActiveTab("slider")}
        >
          Slider Images
        </button>

        <button
          className={activeTab === "analytics" ? "active-tab" : ""}
          onClick={() => { setActiveTab("analytics"); loadAnalytics(); }}
        >
          Analytics
        </button>

      </div>

      {/* ORDERS */}
      {activeTab === "orders" && (
        <>

          {/* STATS */}
          <div className="admin-stats">

            <div className="admin-stat-card">
              <h3>Total Revenue</h3>
              <p>₹{totalRevenue}</p>
            </div>

            <div className="admin-stat-card">
              <h3>Total Orders</h3>
              <p>{orders.length}</p>
            </div>

            <div className="admin-stat-card">
              <h3>Pending Orders</h3>
              <p>{pendingOrders}</p>
            </div>

            <div className="admin-stat-card">
              <h3>Delivered Orders</h3>
              <p>{deliveredOrders}</p>
            </div>

          </div>

          {/* ORDERS TABLE */}
          <div className="admin-table-wrapper">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Fulfillment</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <>
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>₹{order.totalAmount}</td>
                      <td>
                        <span className={`payment-badge ${order.paymentStatus === "paid" ? "paid" : "unpaid"}`}>
                          {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <select
                          className="status-select"
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          className="edit-btn"
                          onClick={() => handleViewDetails(order.id)}
                        >
                          {expandedOrder === order.id ? "Close" : "Details"}
                        </button>
                      </td>
                    </tr>

                    {expandedOrder === order.id && (
                      <tr key={`detail-${order.id}`} className="order-detail-row">
                        <td colSpan={6}>
                          {loadingDetail ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "1.5rem" }}><div className="spinner" /></div>
                          ) : orderDetail ? (
                            <div className="order-detail-panel">

                              {/* ADDRESS */}
                              <div className="order-detail-block">
                                <h4>Delivery Address</h4>
                                {orderDetail.address ? (
                                  <>
                                    <p><strong>{orderDetail.address.name}</strong> · {orderDetail.address.phone}</p>
                                    <p>{orderDetail.address.address}</p>
                                    <p>{orderDetail.address.city}, {orderDetail.address.state} — {orderDetail.address.pincode}</p>
                                  </>
                                ) : <p className="no-data">No address recorded</p>}
                              </div>

                              {/* PAYMENT */}
                              <div className="order-detail-block">
                                <h4>Payment Info</h4>
                                <p>Status: <span className={`payment-badge ${orderDetail.paymentStatus === "paid" ? "paid" : "unpaid"}`}>{orderDetail.paymentStatus === "paid" ? "Paid" : "Pending"}</span></p>
                                {orderDetail.razorpayPaymentId && <p>Payment ID: <code>{orderDetail.razorpayPaymentId}</code></p>}
                                {orderDetail.razorpayOrderId && <p>Razorpay Order: <code>{orderDetail.razorpayOrderId}</code></p>}
                              </div>

                              {/* ITEMS */}
                              <div className="order-detail-block">
                                <h4>Items Ordered</h4>
                                <div className="order-detail-items">
                                  {orderDetail.items.map((item, i) => (
                                    <div key={i} className="order-detail-item">
                                      {item.productImage && (
                                        <img src={item.productImage} alt={item.productName} />
                                      )}
                                      <div>
                                        <p><strong>{item.productName}</strong></p>
                                        <p>Qty: {item.quantity} · ₹{item.price} each</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>

            </table>

          </div>

        </>
      )}

      {/* PRODUCTS */}
      {activeTab === "products" && (

        <div className="admin-products-section">

          {/* FORM */}
          <form
            onSubmit={handleCreateProduct}
            className="admin-product-form"
          >

            <h2>
              {editingProductId
                ? "Edit Product"
                : "Create Product"}
            </h2>

            <input
              type="text"
              placeholder="Product Name"
              value={productForm.name}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  name: e.target.value,
                })
              }
            />

            <textarea
              placeholder="Description"
              value={productForm.description}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  description:
                    e.target.value,
                })
              }
              style={{
                borderColor:
                  productForm.description.length > 0 &&
                  productForm.description.length < 10
                    ? "#e53e3e"
                    : "",
              }}
            />

            <input
              type="number"
              placeholder="Price"
              value={productForm.price}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  price: e.target.value,
                })
              }
            />

            {/* IMAGE */}
            <div className="upload-section">

              <label className="upload-box">

                {uploadingImage
                  ? "Uploading image..."
                  : "Choose Image"}

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageUpload
                  }
                  hidden
                />

              </label>

              <input
                type="text"
                placeholder="Or paste image URL"
                value={
                  productForm.imageUrl
                }
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    imageUrl:
                      e.target.value,
                  })
                }
              />

              {productForm.imageUrl && (
                <img
                  src={productForm.imageUrl}
                  alt="Preview"
                  className="image-preview"
                />
              )}

            </div>

            {/* EXTRA IMAGES */}
            <div className="upload-section">
              <label style={{ fontWeight: 600, fontSize: "0.85rem", color: "#555", marginBottom: 6, display: "block" }}>
                Additional Images (Gallery)
              </label>
              <label className="upload-box">
                {uploadingExtraImage ? "Uploading..." : "+ Add More Images"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleExtraImageUpload}
                  hidden
                />
              </label>

              {productForm.images.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                  {productForm.images.map((url, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <img src={url} alt={`extra-${i}`} className="image-preview" style={{ width: 90, height: 90 }} />
                      <button
                        type="button"
                        onClick={() => setProductForm((prev) => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }))}
                        style={{ position: "absolute", top: 4, right: 4, background: "#d50401", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: 12, lineHeight: "22px", textAlign: "center", padding: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <input
              type="number"
              placeholder="Stock"
              value={productForm.stock}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  stock: e.target.value,
                })
              }
            />

            <input
              type="text"
              placeholder="Category"
              value={productForm.category}
              onChange={(e) =>
                setProductForm({
                  ...productForm,
                  category:
                    e.target.value,
                })
              }
            />

            <button
              type="submit"
              className="create-btn"
              disabled={uploadingImage}
            >

              {uploadingImage
                ? "Uploading..."
                : editingProductId
                ? "Update Product"
                : "Create Product"}

            </button>

          </form>

          {/* PRODUCTS TABLE */}
          <div className="admin-table-wrapper">

            <h2 className="product-heading">
              Products
            </h2>

            <table className="admin-table">

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Image</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Category</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {products.map((product) => (

                  <tr key={product.id}>

                    <td>{product.name}</td>

                    <td>

                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="admin-product-image"
                      />

                    </td>

                    <td>
                      ₹{product.price}
                    </td>

                    <td>
                      {product.stock}
                    </td>

                    <td>
                      {product.category}
                    </td>

                    <td className="action-buttons">

                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() =>
                          handleEditClick(
                            product
                          )
                        }
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          handleDeleteProduct(
                            product.id
                          )
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </div>
      )}
      {/* SLIDER IMAGES */}
      {activeTab === "slider" && (
        <div className="admin-slider-section">
          <h2 className="product-heading">Homepage Slider Images</h2>
          <p style={{ color: "#888", marginBottom: "24px", fontSize: "0.9rem" }}>
            Upload images and link each slide to a product. The "Order Now" button on the homepage will go to that product.
          </p>

          {/* ADD SLIDE */}
          <form onSubmit={handleCreateSlide} className="add-slide-form">
            <select
              value={newSlideProductId}
              onChange={(e) => setNewSlideProductId(e.target.value)}
              className="slider-label-input"
              style={{ flex: 1 }}
              required
            >
              <option value="">— Select a product to add as slide —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button type="submit" className="create-btn" disabled={creatingSlide || !newSlideProductId} style={{ width: "auto", padding: "10px 24px" }}>
              {creatingSlide ? "Adding..." : "+ Add Slide"}
            </button>
          </form>

          <div className="slider-admin-grid">
            {sliderSlides.map((slide, i) => (
              <div key={slide.id} className="slider-admin-card">
                <div className="slider-admin-preview">
                  {slide.imageUrl
                    ? <img src={slide.imageUrl} alt={`Slide ${i + 1}`} />
                    : <div className="slider-admin-empty">No image</div>
                  }
                </div>
                <div className="slider-admin-controls">
                  <span className="section-label">Slide {i + 1} — {slide.label}</span>

                  <select
                    className="slider-label-input"
                    value={slide.productId ?? ""}
                    onChange={(e) => handleSlideProductChange(slide, e.target.value)}
                  >
                    <option value="">— No product linked —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <label className="upload-box">
                    {uploadingSlide === slide.id ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSlideImageUpload(e, slide)}
                      hidden
                    />
                  </label>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {slide.imageUrl && (
                      <button
                        type="button"
                        className="edit-btn"
                        style={{ flex: 1 }}
                        onClick={() => handleSlideRemoveImage(slide)}
                      >
                        Remove Image
                      </button>
                    )}
                    <button
                      type="button"
                      className="delete-btn"
                      style={{ flex: 1 }}
                      onClick={() => handleDeleteSlide(slide.id)}
                    >
                      Delete Slide
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="analytics-section">
          <h2 className="product-heading">Analytics</h2>

          {analyticsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}><div className="spinner" /></div>
          ) : analytics ? (
            <>
              {/* ── ROW 1: KPI CARDS ── */}
              <div className="analytics-kpi-grid">
                <div className="admin-stat-card">
                  <h3>Total Revenue</h3>
                  <p>₹{analytics.totalRevenue.toLocaleString("en-IN")}</p>
                </div>
                <div className="admin-stat-card">
                  <h3>Total Orders</h3>
                  <p>{analytics.totalOrders}</p>
                </div>
                <div className="admin-stat-card">
                  <h3>Avg Order Value</h3>
                  <p>₹{analytics.avgOrderValue.toLocaleString("en-IN")}</p>
                </div>
                <div className="admin-stat-card">
                  <h3>Unique Customers</h3>
                  <p>{analytics.uniqueCustomers}</p>
                </div>
                <div className="admin-stat-card">
                  <h3>Repeat Customers</h3>
                  <p>{analytics.repeatCustomers}</p>
                </div>
              </div>

              {/* ── ROW 2: THIS MONTH vs LAST MONTH ── */}
              <div className="analytics-compare-grid">
                <div className="analytics-compare-card">
                  <span className="analytics-compare-label">Revenue — This Month</span>
                  <span className="analytics-compare-value">₹{analytics.thisMonth.revenue.toLocaleString("en-IN")}</span>
                  {analytics.revenuePct !== null && (
                    <span className={`analytics-compare-badge ${analytics.revenuePct >= 0 ? "up" : "down"}`}>
                      {analytics.revenuePct >= 0 ? "▲" : "▼"} {Math.abs(analytics.revenuePct)}% vs last month
                    </span>
                  )}
                  <span className="analytics-compare-sub">Last month: ₹{analytics.lastMonth.revenue.toLocaleString("en-IN")}</span>
                </div>
                <div className="analytics-compare-card">
                  <span className="analytics-compare-label">Orders — This Month</span>
                  <span className="analytics-compare-value">{analytics.thisMonth.orders}</span>
                  {analytics.ordersPct !== null && (
                    <span className={`analytics-compare-badge ${analytics.ordersPct >= 0 ? "up" : "down"}`}>
                      {analytics.ordersPct >= 0 ? "▲" : "▼"} {Math.abs(analytics.ordersPct)}% vs last month
                    </span>
                  )}
                  <span className="analytics-compare-sub">Last month: {analytics.lastMonth.orders} orders</span>
                </div>
              </div>

              {/* ── ROW 3: REVENUE CHART ── */}
              <div className="admin-table-wrapper analytics-chart-card">
                <h3 className="analytics-section-title">Revenue — Last 30 Days</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={analytics.revenueChart} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#aaa" }}
                      tickFormatter={(d) => {
                        const dt = new Date(d);
                        return `${dt.getDate()}/${dt.getMonth() + 1}`;
                      }}
                      interval={4}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#aaa" }} tickFormatter={(v) => `₹${v}`} width={60} />
                    <Tooltip
                      formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                      labelFormatter={(label) => new Date(label).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e8e4dc", fontSize: 13 }}
                    />
                    <Bar dataKey="revenue" fill="#17332d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ── ROW 4: TOP PRODUCTS + MOST WISHLISTED ── */}
              <div className="analytics-two-col">
                <div className="admin-table-wrapper">
                  <h3 className="analytics-section-title">Top Products by Revenue</h3>
                  {analytics.topProducts.length === 0 ? (
                    <p className="analytics-empty">No sales data yet.</p>
                  ) : (
                    <table className="admin-table">
                      <thead><tr><th>Product</th><th>Units</th><th>Revenue</th></tr></thead>
                      <tbody>
                        {analytics.topProducts.map((p) => (
                          <tr key={p.productId}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {p.image && <img src={p.image} alt={p.name} className="admin-product-image" style={{ width: 36, height: 36 }} />}
                                <span>{p.name}</span>
                              </div>
                            </td>
                            <td>{p.units}</td>
                            <td>₹{p.revenue.toLocaleString("en-IN")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="admin-table-wrapper">
                  <h3 className="analytics-section-title">Most Wishlisted</h3>
                  {analytics.mostWishlisted.length === 0 ? (
                    <p className="analytics-empty">No wishlist data yet.</p>
                  ) : (
                    <table className="admin-table">
                      <thead><tr><th>Product</th><th>Wishlists</th></tr></thead>
                      <tbody>
                        {analytics.mostWishlisted.map((p) => (
                          <tr key={p.productId}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {p.image && <img src={p.image} alt={p.name} className="admin-product-image" style={{ width: 36, height: 36 }} />}
                                <span>{p.name}</span>
                              </div>
                            </td>
                            <td>{p.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* ── ROW 5: LOW STOCK ALERTS ── */}
              <div className="admin-table-wrapper" style={{ marginTop: 24 }}>
                <h3 className="analytics-section-title">
                  Low Stock Alerts
                  {analytics.lowStock.length > 0 && (
                    <span className="low-stock-badge">{analytics.lowStock.length} item{analytics.lowStock.length > 1 ? "s" : ""}</span>
                  )}
                </h3>
                {analytics.lowStock.length === 0 ? (
                  <p className="analytics-empty" style={{ color: "#1a7a45" }}>✓ All products are well stocked.</p>
                ) : (
                  <table className="admin-table">
                    <thead><tr><th>Product</th><th>Stock Remaining</th></tr></thead>
                    <tbody>
                      {analytics.lowStock.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {p.image && <img src={p.image} alt={p.name} className="admin-product-image" style={{ width: 36, height: 36 }} />}
                              <span>{p.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`stock-level ${p.stock === 0 ? "out" : "low"}`}>
                              {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ── ROW 6: ORDER STATUS BREAKDOWN ── */}
              <div className="admin-table-wrapper" style={{ marginTop: 24 }}>
                <h3 className="analytics-section-title">Order Status Breakdown</h3>
                <div className="analytics-status-grid">
                  {Object.entries(analytics.byStatus).map(([status, count]) => (
                    <div key={status} className="analytics-status-card">
                      <span className="analytics-status-label">{status}</span>
                      <span className="analytics-status-count">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: "#aaa" }}>No data available.</p>
          )}
        </div>
      )}

      {
  toast.show && (
    <div className={`toast-message ${toast.type}`}>
      {toast.message}
    </div>
  )
}
    </div>
    
  );
}