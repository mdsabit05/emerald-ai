      import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AddressContext =
  createContext();

export function AddressProvider({
  children,
}) {

  const [addresses,
    setAddresses] =
    useState([]);

  // LOAD
  useEffect(() => {

    const saved =
      JSON.parse(
        localStorage.getItem(
          "savedAddresses"
        )
      ) || [];
      
      setAddresses(saved);

  }, []);

  // SAVE
  useEffect(() => {

    localStorage.setItem(
      "savedAddresses",

      JSON.stringify(addresses)
    );

  }, [addresses]);

  function addAddress(
    newAddress
  ) {

    setAddresses((prev) => [
     ...prev,
      {
        id: Date.now(),
        ...newAddress,
      },
    ]);
  }

  return (

    <AddressContext.Provider
      value={{
        addresses,
        addAddress,
      }}
    >

      {children}

    </AddressContext.Provider>
  );
}

export function useAddress() {

  return useContext(
    AddressContext
  );
}