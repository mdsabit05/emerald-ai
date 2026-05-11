import { useCart } from "../components/CartContext";

import { useState, useEffect } from "react";
import {
  Link,
} from "react-router-dom";

import { Heart }
from "lucide-react";
import {
  useWishlist,
} from "../components/WishlistContext";

import {
  getReviews,
  createReview,
  getSingleProduct,
  getRelatedProducts,
} from "../lib/api";

import "./productpage.css"

import {
  useUser,
  useAuth,
} from "@clerk/clerk-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

export default function ProductPage() {

  const { addToCart } =
    useCart();

    const {
  toggleWishlist,
  isWishlisted,
} = useWishlist();

  const navigate =
    useNavigate();

  const { id } =
    useParams();

  const { user } =
    useUser();

  const { getToken } =
    useAuth();

  // PRODUCT
  const [product,
    setProduct] =
    useState(null);

  const [loading,
    setLoading] =
    useState(true);

  const [error,
    setError] =
    useState(null);

  // UI
  const [quantity,
    setQuantity] =
    useState(1);

  const [activeTab,
    setActiveTab] =
    useState(
      "ingredients"
    );

  const [mainImage,
    setMainImage] =
    useState("");

  const [fadeStatus,
    setFadeStatus] =
    useState("fade-in");

  // REVIEWS
  const [reviews,
    setReviews] =
    useState([]);

  const [rating,
    setRating] =
    useState(5);

  const [comment,
    setComment] =
    useState("");

  const [reviewLoading,
    setReviewLoading] =
    useState(false);

     // related product
  const [
  relatedProducts,
  setRelatedProducts,
] = useState([]);



  // FETCH PRODUCT + REVIEWS
  useEffect(() => {

  async function fetchData() {

    try {

      const productData =
        await getSingleProduct(id);

      setProduct(
        productData
      );

      setMainImage(
        productData.imageUrl
      );

      // REVIEWS
      const reviewData =
        await getReviews(id);

      setReviews(
        reviewData
      );

      // RELATED PRODUCTS
      const related =
        await getRelatedProducts(
          productData.category,
          productData.id
        );

      setRelatedProducts(
        related
      );
      


    } catch (err) {

      setError(
        err.message
      );

    } finally {

      setLoading(false);
    }
  }

  fetchData();

}, [id]);



  // LOADING
  if (loading) {
    return (
      <h2>
        Loading product...
      </h2>
    );
  }

 

  // ERROR
  if (error) {
    return <h2>{error}</h2>;
  }

  // NOT FOUND
  if (!product) {
    return (
      <h2>
        Product not found
      </h2>
    );
  }

  const normalizedProduct = {
    ...product,
    title: product.name,
    img: product.imageUrl,
  };

  const galleryImages = [
    normalizedProduct.img,
  ];

  // AVG RATING
  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce(
            (
              acc,
              review
            ) =>
              acc +
              review.rating,
            0
          ) /
          reviews.length
        ).toFixed(1)
      : 0;

  // REVIEW SUBMIT
  async function
  handleReviewSubmit(e) {

    e.preventDefault();

    try {

      setReviewLoading(
        true
      );

      const token =
        await getToken();

      await createReview(
        token,
        {
          productId:
            product.id,

          rating,

          comment,
        }
      );

      const updatedReviews =
        await getReviews(
          product.id
        );

      setReviews(
        updatedReviews
      );

      setComment("");
      setRating(5);

    } catch (err) {

      console.log(err);

    } finally {

      setReviewLoading(
        false
      );
    }
  }

  // QUANTITY
  const handleQuantity =
    (type) => {

      if (
        type === "dec" &&
        quantity > 1
      ) {
        setQuantity(
          quantity - 1
        );
      }

      if (
        type === "inc"
      ) {
        setQuantity(
          quantity + 1
        );
      }
    };

  // IMAGE SWITCH
  const changeImage =
    (newImg) => {

      if (
        newImg === mainImage
      )
        return;

      setFadeStatus(
        "fade-out"
      );

      setTimeout(() => {

        setMainImage(
          newImg
        );

        setFadeStatus(
          "fade-in"
        );

      }, 200);
    };

  // BUY NOW
  const handleBuyNow =
    () => {

      addToCart({
        ...normalizedProduct,
        quantity,
      });

      navigate(
        "/checkout"
      );
    };

  // ADD TO CART
  const handleAddToCart =
    () => {

      addToCart({
        ...normalizedProduct,
        quantity,
      });
    };

  return (
    <div className="product-page-wrapper">

      <div className="product-main-split">

        {/* LEFT */}
        <div className="product-gallery-section">

          <div className="thumbnail-list">

            {galleryImages.map(
              (
                img,
                index
              ) => (

                <div
                  key={index}
                  className={`thumbnail ${
                    mainImage ===
                    img
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    changeImage(
                      img
                    )
                  }
                >

                  <img
                    src={img}
                    alt={`View ${
                      index + 1
                    }`}
                  />

                </div>
              )
            )}

          </div>

          <div className="main-image-display">

            <img
              src={mainImage}
              alt={
                normalizedProduct.title
              }
              className={`animated-image ${fadeStatus}`}
            />

          </div>

        </div>

        {/* RIGHT */}
        <div className="product-action-section">

          <div className="breadcrumbs">

            Home / Collection /
            <span>
              {" "}
              {
                product.category
              }
            </span>

          </div>

          <h1 className="product-title">

            {
              normalizedProduct.title
            }

          </h1>

          <div className="product-reviews-summary">

            <span className="stars">
              ⭐ {averageRating}
            </span>

            <span className="review-count">

              (
              {
                reviews.length
              }
              {" "}
              Reviews)

            </span>

          </div>

          <p className="product-price">

            ₹
            {product.price.toFixed(
              2
            )}

          </p>

          <p className="product-short-desc">

            {
              product.description
            }

          </p>

          {product.stock <=
            0 && (

            <p className="out-of-stock">

              Out of Stock

            </p>
          )}

          {/* PURCHASE */}
          <div className="purchase-controls">

            <div className="quantity-selector">

              <button
                onClick={() =>
                  handleQuantity(
                    "dec"
                  )
                }
              >
                -
              </button>

              <input
                type="text"
                value={
                  quantity
                }
                readOnly
              />

              <button
                onClick={() =>
                  handleQuantity(
                    "inc"
                  )
                }
              >
                +
              </button>

            </div>

            <button
              className="btn btn-add-cart"
              onClick={
                handleAddToCart
              }
              disabled={
                product.stock <=
                0
              }
            >

              Add To Cart

            </button>

            <button
              className="btn btn-buy-now"
              onClick={
                handleBuyNow
              }
              disabled={
                product.stock <=
                0
              }
            >

              Buy Now

            </button>

          </div>

          {/* ACCORDION */}
          <div className="product-accordions">

            <div
              className={`accordion-header ${
                activeTab ===
                "ingredients"
                  ? "open"
                  : ""
              }`}
              onClick={() =>
                setActiveTab(
                  "ingredients"
                )
              }
            >

              <h4>
                Product Details
              </h4>

            </div>

            <div
              className={`accordion-content-wrapper ${
                activeTab ===
                "ingredients"
                  ? "expanded"
                  : ""
              }`}
            >

              <div className="accordion-content">

                <p>
                  {
                    product.description
                  }
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* REVIEWS */}
      <div className="reviews-section">

  <div className="reviews-heading">

    <h2>
      Customer Reviews
    </h2>

    <div className="review-summary-card">

      <div className="review-rating-big">

        <span>⭐</span>

        <h3>
          {averageRating}
        </h3>

      </div>

      <p>
        Based on {reviews.length} reviews
      </p>

    </div>

  </div>

  {user && (

    <form
      className="review-form"
      onSubmit={handleReviewSubmit}
    >

      <div className="review-form-top">

        <h4>
          Write a Review
        </h4>

        <select
          value={rating}
          onChange={(e) =>
            setRating(
              Number(
                e.target.value
              )
            )
          }
        >

          <option value={5}>
            ⭐⭐⭐⭐⭐
          </option>

          <option value={4}>
            ⭐⭐⭐⭐
          </option>

          <option value={3}>
            ⭐⭐⭐
          </option>

          <option value={2}>
            ⭐⭐
          </option>

          <option value={1}>
            ⭐
          </option>

        </select>

      </div>

      <textarea
        placeholder="Share your experience with this product..."
        value={comment}
        onChange={(e) =>
          setComment(
            e.target.value
          )
        }
        required
      />

      <button
        type="submit"
        className="review-submit-btn"
        disabled={reviewLoading}
      >

        {reviewLoading
          ? "Submitting..."
          : "Submit Review"}

      </button>

    </form>
  )}

  {reviews.length === 0 ? (

    <div className="no-reviews">

      <h3>
        No Reviews Yet
      </h3>

      <p>
        Be the first to review this product.
      </p>

    </div>

  ) : (

    <div className="reviews-list">

      {reviews.map((review) => (

        <div
          key={review.id}
          className="review-card"
        >

          <div className="review-card-top">

  <div className="review-user">

    <img
  src={
    review.userImage &&
    review.userImage !== ""
      ? review.userImage
      : "https://ui-avatars.com/api/?name=User"
  }
      alt={review.userName}
      className="review-avatar"
    />

    <div>

      <h4 className="review-user-name">

        {review.userName ||
          "Anonymous"}

      </h4>

      <div className="review-stars">

        {"⭐".repeat(
          review.rating
        )}

      </div>

    </div>

  </div>

  <div className="review-date">

    {new Date(
      review.createdAt
    ).toLocaleDateString()}

  </div>

</div>

          <p className="review-comment">

            {review.comment}

          </p>

        </div>
      ))}

    </div>
  )}

</div>

{relatedProducts.length >
  0 && (

  <div className="related-products-section">

    <div className="related-header">

      <h2>
        You May Also Like
      </h2>

      <p>
        More products curated
        for your lifestyle.
      </p>

    </div>

    <div className="related-grid">

      {relatedProducts
        .slice(0, 4)
        .map((item) => (

          <Link
            key={item.id}
            to={`/product/${item.id}`}
            className="related-card"
          >

           <div className="related-image-wrap">

  <button
  className={`wishlist-btn ${
    isWishlisted(item.id)
      ? "active"
      : ""
  }`}
  onClick={(e) => {

    e.preventDefault();

    e.stopPropagation();

    toggleWishlist(
      item.id
    );
  }}
>

  <Heart
    size={18}
    fill={
      isWishlisted(item.id)
        ? "currentColor"
        : "none"
    }
  />

</button>

  <img
    src={item.imageUrl}
    alt={item.name}
  />

  <div className="quick-add-overlay">

    <button
      className="btn-quick-add"
    onClick={(e) => {

  e.preventDefault();

  e.stopPropagation();

  addToCart(
    {
      ...item,
      title: item.name,
      img: item.imageUrl,
    },
    false
  );
}}
    >

      + Quick Add

    </button>

  </div>

</div>

            <div className="related-info">

              <h3>
                {item.name}
              </h3>

              <div className="related-rating">

                <span>

                  ⭐
                  {" "}
                  {item.avgRating || 0}

                </span>

                <small>

                  (
                  {item.reviewCount || 0}
                  )

                </small>

              </div>

              <p>

                ₹
                {item.price.toFixed(
                  2
                )}

              </p>

            </div>

          </Link>
        ))}

    </div>

  </div>
)}

    </div>
  );
}