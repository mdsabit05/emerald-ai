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
          await getToken({ template: "default" });

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
        await getToken({ template: "default" });

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

        // ADD — optimistic update first so heart turns red instantly
        setWishlist((prev) => [
          ...prev,
          { wishlistId: -1, product: { id: productId } },
        ]);

        try {
          await addToWishlist(token, productId);
          // Refresh in background to get real data
          const updated = await getWishlist(token);
          setWishlist(Array.isArray(updated) ? updated : []);
        } catch (err) {
          // Revert on failure
          setWishlist((prev) =>
            prev.filter((item) => item?.product?.id !== productId)
          );
          throw err;
        }
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