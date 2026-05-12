import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../lib/api";

const AddressContext = createContext();

export function AddressProvider({ children }) {
  const { getToken, isSignedIn } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setLoading(true);
      const token = await getToken();
      const data = await getAddresses(token);
      setAddresses(data);
    } catch (err) {
      console.error("Failed to load addresses", err);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  async function addAddress(newAddress) {
    try {
      const token = await getToken();
      const saved = await createAddress(token, newAddress);
      setAddresses((prev) => [...prev, saved]);
      return saved;
    } catch (err) {
      console.error("Failed to add address", err);
      throw err;
    }
  }

  async function removeAddress(id) {
    try {
      const token = await getToken();
      await deleteAddress(token, id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Failed to delete address", err);
      throw err;
    }
  }

  async function updateAddressById(id, updated) {
    try {
      const token = await getToken();
      const result = await updateAddress(token, id, updated);
      setAddresses((prev) => prev.map((a) => (a.id === id ? result : a)));
      return result;
    } catch (err) {
      console.error("Failed to update address", err);
      throw err;
    }
  }

  return (
    <AddressContext.Provider
      value={{
        addresses,
        loading,
        addAddress,
        removeAddress,
        updateAddress: updateAddressById,
      }}
    >
      {children}
    </AddressContext.Provider>
  );
}

export function useAddress() {
  return useContext(AddressContext);
}
