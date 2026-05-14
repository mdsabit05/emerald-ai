import {
  Link,
} from "react-router-dom";

import {
  Heart,
  ShoppingBag,
} from "lucide-react";
import "./wishlist.css"
import {
  useWishlist,
} from "../components/WishlistContext";

import {
  useCart,
} from "../components/CartContext";

export default function
Wishlist() {

  const {
    wishlist,
    loading,
    toggleWishlist,
  } = useWishlist();

  const {
    addToCart,
  } = useCart();

  if (loading) {

    return (
      <div className="wishlist-page">

        <h2>
          Loading wishlist...
        </h2>

      </div>
    );
  }

  return (
    <div className="wishlist-page">

      <div className="wishlist-header">

        <h1>
          Your Wishlist
        </h1>

        <p>
          Saved products you
          love.
        </p>

      </div>

      {wishlist.length === 0 ? (

        <div className="wishlist-empty">

          <Heart size={70} />

          <h2>
            Your wishlist is empty
          </h2>

          <p>
            Save products to
            view them later.
          </p>

          <Link
            to="/collection"
            className="wishlist-shop-btn"
          >

            Explore Collection

          </Link>

        </div>

      ) : (

        <div className="wishlist-grid">

          {wishlist.map(
            (item) => {

              const product =
                item.product;

              return (

                <div
                  key={product.id}
                  className="wishlist-card"
                >

                  <button
                    className="wishlist-remove"
                    onClick={() =>
                      toggleWishlist(
                        product.id
                      )
                    }
                  >

                    <Heart
                      size={18}
                      fill="currentColor"
                    />

                  </button>

                  <Link
                    to={`/product/${product.id}`}
                  >

                    <div className="wishlist-image-wrap">

                      <img
                        src={product.imageUrl}
                        alt={product.name}
                      />

                    </div>

                  </Link>

                  <div className="wishlist-info">

                    <h3>
                      {product.name}
                    </h3>

                    <p>
                      ₹
                      {product.price.toFixed(
                        2
                      )}
                    </p>

                    <p className="stock-label">
                      {product.stock <= 0
                        ? "Out of Stock"
                        : `${product.stock} left`}
                    </p>

                    <button
                      className="wishlist-cart-btn"
                      disabled={product.stock <= 0}
                      onClick={() =>
                        addToCart({
                          ...product,
                          title:
                            product.name,
                          img:
                            product.imageUrl,
                        }, false)
                      }
                    >

                      <ShoppingBag
                        size={18}
                      />

                      Add To Cart

                    </button>

                  </div>

                </div>
              );
            }
          )}

        </div>
      )}

    </div>
  );
}