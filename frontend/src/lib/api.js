const API_URL = "/api";

export async function initiateOrder(token, { items, address }) {
  const res = await fetch(`${API_URL}/orders/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ items, address }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to initiate order");
  return data;
}

export async function verifyOrder(token, { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address }) {
  const res = await fetch(`${API_URL}/orders/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, items, address }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Payment verification failed");
  return data;
}

export async function getProducts() {
  const res = await fetch(`${API_URL}/products`);

  if (!res.ok) {
    throw new Error("Failed to fetch products");
  }

  const data = await res.json();

  return data.data;
}

export async function getSingleProduct(id) {
  const res = await fetch(
    `${API_URL}/products/${id}`
  );

  if (!res.ok) {
    throw new Error("Failed to fetch product");
  }

  const data = await res.json();

  return data.data;
}

export async function createOrder(
  token,
  items
) {
  const res = await fetch(
    `${API_URL}/orders`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        items,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      "Failed to create order"
    );
  }

  const data = await res.json();

  return data;
}

export async function getMyOrders(token) {
  const res = await fetch(
    `${API_URL}/orders/my-orders`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message || "Failed to fetch orders"
    );
  }

  return data.data;
}

export async function getAllOrders(
  token
) {
  const res = await fetch(
    `${API_URL}/orders/admin/all`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message ||
        "Failed to fetch orders"
    );
  }

  return data.data;
}


export async function updateOrderStatus(
  token,
  orderId,
  status
) {
  const res = await fetch(
    `${API_URL}/orders/admin/${orderId}/status`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        status,
      }),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message ||
        "Failed to update order"
    );
  }

  return data;
}


export async function createProduct(
  token,
  productData
) {
  const res = await fetch(
    `${API_URL}/products`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(
        productData
      ),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message ||
        "Failed to create product"
    );
  }

  return data;
}

export async function deleteProduct(
  token,
  productId
) {
  const res = await fetch(
    `${API_URL}/products/${productId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message ||
        "Failed to delete product"
    );
  }

  return data;
}


export async function updateProduct(
  token,
  productId,
  productData
) {
  const res = await fetch(
    `${API_URL}/products/${productId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",

        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(
        productData
      ),
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(
      data.message ||
        "Failed to update product"
    );
  }

  return data;
}

export async function getReviews(
  productId
) {

  const res = await fetch(
    `${API_URL}/reviews/${productId}`
  );

  const data =
    await res.json();

  if (!res.ok) {

    throw new Error(
      data.message ||
      "Failed to fetch reviews"
    );
  }

  return data.data;
}


export async function createReview(
  token,
  reviewData
) {

  const res = await fetch(
    `${API_URL}/reviews`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify(
        reviewData
      ),
    }
  );

  const data =
    await res.json();

  if (!res.ok) {

    throw new Error(
      data.message ||
      "Failed to create review"
    );
  }

  return data;
}

export async function
getWishlist(token) {

  const res = await fetch(
    `${API_URL}/wishlist`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data =
    await res.json();

  if (!res.ok) {

    throw new Error(
      data.message ||
      "Failed to fetch wishlist"
    );
  }

  return data.data;
}


export async function
addToWishlist(
  token,
  productId
) {

  const res = await fetch(
    `${API_URL}/wishlist/${productId}`,
    {
      method: "POST",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data =
    await res.json();

  if (!res.ok) {

    throw new Error(
      data.message ||
      "Failed to add wishlist"
    );
  }

  return data;
}


export async function
removeFromWishlist(
  token,
  productId
) {

  const res = await fetch(
    `${API_URL}/wishlist/${productId}`,
    {
      method: "DELETE",

      headers: {
        Authorization:
          `Bearer ${token}`,
      },
    }
  );

  const data =
    await res.json();

  if (!res.ok) {

    throw new Error(
      data.message ||
      "Failed to remove wishlist"
    );
  }

  return data;
}

export async function getAddresses(token) {
  const res = await fetch(`${API_URL}/addresses`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch addresses");
  return data.data;
}

export async function createAddress(token, addressData) {
  const res = await fetch(`${API_URL}/addresses`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(addressData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to save address");
  return data.data;
}

export async function updateAddress(token, id, addressData) {
  const res = await fetch(`${API_URL}/addresses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(addressData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update address");
  return data.data;
}

export async function deleteAddress(token, id) {
  const res = await fetch(`${API_URL}/addresses/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete address");
  return data;
}

export async function
getRelatedProducts(
  category,
  currentId
) {

  const res = await fetch(
    `${API_URL}/products`
  );

  const data =
    await res.json();

  if (!res.ok) {

    throw new Error(
      "Failed to fetch related products"
    );
  }

  return data.data.filter(
    (product) =>
      product.category ===
        category &&

      product.id !==
        currentId
  );
}