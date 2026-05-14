import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const CartContext =
  createContext();

export function CartProvider({
  children,
}) {

  const [isCartOpen,
    setIsCartOpen] =
    useState(false);

  const [toast,
    setToast] =
    useState({
      isVisible: false,
      productName: "",
      img: "",
    });

  const [cartItems,
    setCartItems] =
    useState(() => {

      const savedCart =
        localStorage.getItem(
          "cartItems"
        );

      return savedCart
        ? JSON.parse(savedCart)
        : [];
    });

  /* =========================================
     SAVE TO LOCAL STORAGE
  ========================================= */

  useEffect(() => {

    localStorage.setItem(
      "cartItems",

      JSON.stringify(
        cartItems
      )
    );

  }, [cartItems]);

  /* =========================================
     ADD TO CART
  ========================================= */

  const addToCart =
    (
      product,
      openDrawer = true
    ) => {

      setCartItems((prev) => {

        const existing =
          prev.find(
            (item) =>
              item.id ===
              product.id
          );

        const addQty = product.quantity || 1;

        if (existing) {

          return prev.map(
            (item) =>

              item.id ===
              product.id

                ? {
                    ...item,
                    quantity:
                      item.quantity + addQty,
                  }

                : item
          );
        }

        return [
          ...prev,

          {
            ...product,
            quantity: addQty,
          },
        ];
      });

      // TOAST
      setToast({
        isVisible: true,

        productName:
          product.title ||
          product.name,

        img:
          product.img ||
          product.image,
      });

      setTimeout(() => {

        setToast({
          isVisible: false,
          productName: "",
          img: "",
        });

      }, 3000);

      // OPEN CART
      if (openDrawer) {
        setIsCartOpen(true);
      }
    };

  /* =========================================
     INCREASE QUANTITY
  ========================================= */

  function increaseQuantity(id) {

    setCartItems((prev) =>

      prev.map((item) =>

        item.id === id

          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }

          : item
      )
    );
  }

  /* =========================================
     DECREASE QUANTITY
  ========================================= */

  function decreaseQuantity(id) {

    setCartItems((prev) =>

      prev
        .map((item) =>

          item.id === id

            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }

            : item
        )

        .filter(
          (item) =>
            item.quantity > 0
        )
    );
  }

  /* =========================================
     REMOVE FROM CART
  ========================================= */

  function removeFromCart(id) {

    setCartItems((prev) =>

      prev.filter(
        (item) =>
          item.id !== id
      )
    );
  }

  function clearCart() {
    setCartItems([]);
  }

  /* =========================================
     TOTALS
  ========================================= */

  const cartTotal =
    cartItems.reduce(

      (total, item) =>

        total +
        item.price *
        item.quantity,

      0
    );

  const cartCount =
    cartItems.reduce(

      (count, item) =>

        count +
        item.quantity,

      0
    );

  return (

    <CartContext.Provider

      value={{

        cartItems,

        addToCart,

        removeFromCart,

        increaseQuantity,

        decreaseQuantity,

        clearCart,

        cartTotal,

        cartCount,

        isCartOpen,

        setIsCartOpen,

        toast,
      }}
    >

      {children}

    </CartContext.Provider>
  );
}

export const useCart =
  () =>
    useContext(
      CartContext
    );