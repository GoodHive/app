import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { AddressContext } from "../context";
import { useAccount } from "wagmi";
import { AuthenticationStatus } from "@rainbow-me/rainbowkit";

const AddressContextWrapper = ({
  children,
  setAuthStatus,
}: {
  children: React.ReactNode;
  setAuthStatus: Dispatch<SetStateAction<AuthenticationStatus>>;
}) => {
  const { address } = useAccount();
  const [walletAddress, setWalletAddress] = useState<string>("");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const checkAuthResponse = await fetch(
          `/api/auth/me?walletAddress=${address}`
        );

        const authResponse = await checkAuthResponse.json();

        const authenticated = Boolean(authResponse?.ok === true);

        if (authenticated) {
          setAuthStatus("authenticated");
          setWalletAddress(authResponse?.address);
        } else {
          setAuthStatus("unauthenticated");
        }
      } catch (error) {
        setAuthStatus("unauthenticated");
      } finally {
      }
    };

    if (address) fetchStatus();

    window.addEventListener("focus", fetchStatus);

    return () => window.removeEventListener("focus", fetchStatus);
  }, [address]);

  return (
    <div className="address__context__wrapper">
      <AddressContext.Provider value={walletAddress}>
        {children}
      </AddressContext.Provider>
    </div>
  );
};

export default AddressContextWrapper;
