import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import { useAuth } from "@clerk/clerk-react";

import {
  getAllOrders,
  updateOrderStatus,
  getProducts,
  deleteProduct,
  createProduct,
  updateProduct,
  getSlides,
  updateSlide,
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

  const [productForm, setProductForm] =
    useState({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      stock: "",
      category: "",
    });

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

        const slidesData = await getSlides();
        setSliderSlides(slidesData);

      } catch (err) {
        console.error(err);

        setError(err.message);

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
      <div className="admin-page">
        <h2>Loading dashboard...</h2>
      </div>
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
                  <th>User</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>

                {orders.map((order) => (

                  <tr key={order.id}>

                    <td>#{order.id}</td>

                    <td>
                      {order.clerkUserId}
                    </td>

                    <td>
                      ₹{order.totalAmount}
                    </td>

                    <td>

                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(e) =>
                          handleStatusChange(
                            order.id,
                            e.target.value
                          )
                        }
                      >
                        <option value="pending">
                          Pending
                        </option>

                        <option value="processing">
                          Processing
                        </option>

                        <option value="shipped">
                          Shipped
                        </option>

                        <option value="delivered">
                          Delivered
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>

                      </select>

                    </td>

                    <td>
                      {new Date(
                        order.createdAt
                      ).toLocaleString()}
                    </td>

                  </tr>

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
                  src={
                    productForm.imageUrl
                  }
                  alt="Preview"
                  className="image-preview"
                />
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

                  {slide.imageUrl && (
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleSlideRemoveImage(slide)}
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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