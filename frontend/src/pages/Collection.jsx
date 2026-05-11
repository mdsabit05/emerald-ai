import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Heart } from "lucide-react";

import { useCart } from "../components/CartContext";
import { useWishlist } from "../components/WishlistContext";
import toast
from "react-hot-toast";
import { getProducts } from "../lib/api";

import "./collection.css";

export default function Collection() {

  const navigate =
    useNavigate();

  const { addToCart } =
    useCart();

  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  const [activeFilter,
    setActiveFilter] =
    useState("All");

  const [products,
    setProducts] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  const [error,
    setError] =
    useState(null);

  const [search,
    setSearch] =
    useState("");

  const [sortBy,
    setSortBy] =
    useState("default");

  const [visibleCount,
    setVisibleCount] =
    useState(6);

  // FETCH PRODUCTS
  useEffect(() => {

    async function fetchProducts() {

      try {

        const data =
          await getProducts();

        setProducts(data);

      } catch (err) {

        setError(
          err.message
        );

      } finally {

        setLoading(false);
      }
    }

    fetchProducts();

  }, []);

  // SCROLL TOP
  useEffect(() => {

    window.scrollTo(0, 0);

  }, []);

  // RESET LOAD MORE
  useEffect(() => {

    setVisibleCount(6);

  }, [
    activeFilter,
    search,
    sortBy,
  ]);

  // LOADING
  if (loading) {

  return (

    <div className="collection-grid">

      {[...Array(6)].map(
        (_, index) => (

          <div
            key={index}
            className="skeleton-card"
          >

            <div className="skeleton-image" />

            <div className="skeleton-info">

              <div className="skeleton-line short" />

              <div className="skeleton-line tiny" />

              <div className="skeleton-line medium" />

            </div>

          </div>
        )
      )}

    </div>
  );
}

  // ERROR
  if (error) {

    return (
      <h2>
        {error}
      </h2>
    );
  }

  // CATEGORIES
  const categories = [
    "All",
    ...new Set(
      products.map(
        (p) => p.category
      )
    ),
  ];

  // FILTER
  let filteredProducts =
    activeFilter === "All"
      ? products
      : products.filter(
          (p) =>
            p.category ===
            activeFilter
        );

  // SEARCH
  filteredProducts =
    filteredProducts.filter(
      (product) =>
        product.name
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  // SORT
  if (
    sortBy === "low-high"
  ) {

    filteredProducts.sort(
      (a, b) =>
        a.price - b.price
    );

  } else if (
    sortBy === "high-low"
  ) {

    filteredProducts.sort(
      (a, b) =>
        b.price - a.price
    );

  } else if (
    sortBy === "a-z"
  ) {

    filteredProducts.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );
  }

  // QUICK ADD
  const handleQuickAdd =
    (e, product) => {

      e.preventDefault();

      e.stopPropagation();

      const normalizedProduct =
        {
          ...product,
          title:
            product.name,
          img:
            product.imageUrl,
        };

      addToCart(
        normalizedProduct,
        false
      );
      toast.success(
  "Added to cart"
);
    };

  return (

    <div className="collection-page">

      {/* HEADER */}
      <div className="collection-header">

        <h1>
          The Collection
        </h1>

        <p>
          Uncompromising purity.
          Expertly crafted for
          the modern lifestyle.
        </p>

      </div>

      {/* SEARCH + SORT */}
      <div className="collection-tools">

        <input
          type="text"
          placeholder="Search products..."
          className="collection-search"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <select
          className="collection-sort"
          value={sortBy}
          onChange={(e) =>
            setSortBy(
              e.target.value
            )
          }
        >

          <option value="default">
            Sort By
          </option>

          <option value="low-high">
            Price: Low to High
          </option>

          <option value="high-low">
            Price: High to Low
          </option>

          <option value="a-z">
            A → Z
          </option>

        </select>

      </div>

      {/* FILTERS */}
      <div className="collection-filters">

        {categories.map(
          (category) => (

            <button
              key={category}
              className={`filter-btn ${
                activeFilter ===
                category
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                setActiveFilter(
                  category
                )
              }
            >

              {category}

            </button>
          )
        )}

      </div>

      {/* PRODUCT GRID */}
      <div className="collection-grid">

        {filteredProducts
          .slice(
            0,
            visibleCount
          )
          .map((product) => {

            const normalizedProduct =
              {
                ...product,
                title:
                  product.name,
                img:
                  product.imageUrl,
              };

            return (

             <div
  key={product.id}
  className="catalog-card"
>

  {/* IMAGE */}
  <div className="catalog-img-wrapper">

    {/* WISHLIST */}
    <button
      className={`wishlist-btn ${
        isWishlisted(product.id)
          ? "active"
          : ""
      }`}
      onClick={(e) => {

        e.preventDefault();

        e.stopPropagation();

        toggleWishlist(
          product.id
        );
        toast.success(
  isWishlisted(product.id)
    ? "Removed from wishlist"
    : "Added to wishlist"
);
      }}
    >

      <Heart
        size={18}
        fill={
          isWishlisted(
            product.id
          )
            ? "currentColor"
            : "none"
        }
      />

    </button>

    {/* BADGE */}
    {product.tag && (

      <span className="product-badge">

        {product.tag}

      </span>
    )}

    {/* CLICKABLE IMAGE */}
    <div
      onClick={() =>
        navigate(
          `/product/${product.id}`
        )
      }
    >

      <img
        src={
          normalizedProduct.img
        }
        alt={
          normalizedProduct.title
        }
        loading="lazy"
      />

    </div>

    {/* QUICK ADD */}
    <div className="quick-add-overlay">

      <button
        className="btn-quick-add"
        onClick={(e) =>
          handleQuickAdd(
            e,
            normalizedProduct
          )
        }
      >

        + Quick Add

      </button>

    </div>

  </div>

  {/* INFO */}
  <div
    className="catalog-info"
    onClick={() =>
      navigate(
        `/product/${product.id}`
      )
    }
  >

    <h3>
      {normalizedProduct.title}
    </h3>

    <div className="product-rating">

      <span>
        ⭐ {product.avgRating || 0}
      </span>

      <small>
        ({product.reviewCount || 0})
      </small>

    </div>

    <p>
      ₹
      {normalizedProduct.price.toFixed(
        2
      )}
    </p>

  </div>

</div>
            );
          })}

      </div>

      {/* LOAD MORE */}
      {visibleCount <
        filteredProducts.length && (

        <div className="load-more-wrapper">

          <button
            className="btn load-more-btn"
            onClick={() =>
              setVisibleCount(
                (prev) =>
                  prev + 6
              )
            }
          >

            Load More

          </button>

        </div>
      )}

    </div>
  );
}