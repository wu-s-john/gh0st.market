"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { jobRegistryAbi } from "@/generated";
import { useChainSettings } from "./useSettings";

/**
 * Hook that returns contract config for the current chain with reactive updates
 */
export function useJobRegistryConfig() {
  const { chain } = useAccount();
  const { settings } = useChainSettings(chain?.id);

  return useMemo(
    () => ({
      address: settings.jobRegistryAddress,
      abi: jobRegistryAbi,
    }),
    [settings.jobRegistryAddress]
  );
}

/**
 * Hook that returns the job registry address for the current chain
 */
export function useJobRegistryAddress() {
  const { chain } = useAccount();
  const { settings } = useChainSettings(chain?.id);
  return settings.jobRegistryAddress;
}

/**
 * Hook that returns deployment block for the current chain
 */
export function useDeploymentBlock() {
  const { chain } = useAccount();
  const { settings } = useChainSettings(chain?.id);
  return settings.deploymentBlock;
}

/**
 * Hook that returns current chain ID
 */
export function useCurrentChainId() {
  const { chain } = useAccount();
  return chain?.id ?? 11155111;
}
