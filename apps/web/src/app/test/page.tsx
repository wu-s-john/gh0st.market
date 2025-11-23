"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { useEffect, useState } from "react";
import { createPublicClient, http, formatEther } from "viem";
import { sepolia } from "viem/chains";

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com"),
});

export default function TestPage() {
  const { primaryWallet, user } = useDynamicContext();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBalance() {
      if (!primaryWallet?.address) {
        setBalance(null);
        return;
      }

      setLoading(true);
      try {
        const balanceWei = await publicClient.getBalance({
          address: primaryWallet.address as `0x${string}`,
        });
        setBalance(formatEther(balanceWei));
      } catch (error) {
        console.error("Failed to fetch balance:", error);
        setBalance("Error");
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, [primaryWallet?.address]);

  return (
    <div style={{ padding: "40px", fontFamily: "monospace" }}>
      <h1>Wallet Test Page</h1>
      <hr />

      <h2>Connect Wallet</h2>
      <DynamicWidget />

      <hr />

      <h2>Connection Status</h2>
      <p>
        <strong>Connected:</strong> {primaryWallet ? "Yes" : "No"}
      </p>

      {primaryWallet && (
        <>
          <h2>Wallet Info</h2>
          <p>
            <strong>Address:</strong> {primaryWallet.address}
          </p>
          <p>
            <strong>Connector:</strong> {primaryWallet.connector?.name ?? "Unknown"}
          </p>

          <h2>ETH Balance (Sepolia)</h2>
          <p>
            <strong>Balance:</strong>{" "}
            {loading ? "Loading..." : balance !== null ? `${balance} ETH` : "N/A"}
          </p>
        </>
      )}

      {user && (
        <>
          <h2>User Info</h2>
          <p>
            <strong>Email:</strong> {user.email ?? "N/A"}
          </p>
          <p>
            <strong>User ID:</strong> {user.userId}
          </p>
        </>
      )}
    </div>
  );
}
