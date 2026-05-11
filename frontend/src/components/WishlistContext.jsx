import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  useAuth,
  useUser,
} from "@clerk/clerk-react";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../lib/api";

const WishlistContext =
  createContext();

export function WishlistProvider({
  children,
}) {

  const [wishlist,
    setWishlist] =
    useState([]);

  const [loading,
    setLoading] =
    useState(true);

  const { user } =
    useUser();

  const { getToken } =
    useAuth();

  // FETCH WISHLIST
  useEffect(() => {

    async function fetchWishlist() {

      if (!user) {

        setWishlist([]);
        setLoading(false);

        return;
      }

      try {

        setLoading(true);

        const token =
          await getToken();

        const data =
          await getWishlist(
            token
          );

        setWishlist(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        console.log(
          "Wishlist fetch error:",
          err
        );

        setWishlist([]);

      } finally {

        setLoading(false);
      }
    }

    fetchWishlist();

  }, [user, getToken]);

  // CHECK IF PRODUCT EXISTS
  const isWishlisted =
    (productId) => {

      return wishlist.some(
        (item) =>
          item?.product?.id ===
          productId
      );
    };

  // TOGGLE WISHLIST
  async function toggleWishlist(
    productId
  ) {

    if (!user) {

      alert(
        "Please login first"
      );

      return;
    }

    try {

      const token =
        await getToken();

      // REMOVE
      if (
        isWishlisted(
          productId
        )
      ) {

        await removeFromWishlist(
          token,
          productId
        );

        setWishlist(
          (prev) =>
            prev.filter(
              (item) =>
                item?.product
                  ?.id !==
                productId
            )
        );

      } else {

        // ADD
        await addToWishlist(
          token,
          productId
        );

        // REFRESH
        const updated =
          await getWishlist(
            token
          );

        setWishlist(
          Array.isArray(updated)
            ? updated
            : []
        );
      }

    } catch (err) {

      console.log(
        "Wishlist toggle error:",
        err
      );
    }
  }

  return (

    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        isWishlisted,
        toggleWishlist,
      }}
    >

      {children}

    </WishlistContext.Provider>
  );
}

export function useWishlist() {

  return useContext(
    WishlistContext
  );
}