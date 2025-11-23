"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import {
  ChainSettings,
  getChainSettings,
  saveChainSettings,
  resetChainSettings,
  getDefaultChainSettings,
  hasCustomSettings,
} from "@/lib/settings";

/**
 * React hook for managing chain-specific settings with reactive updates
 */
export function useChainSettings(chainId?: number) {
  const { chain } = useAccount();
  const activeChainId = chainId ?? chain?.id ?? 11155111;

  const [settings, setSettings] = useState<ChainSettings>(() =>
    getDefaultChainSettings(activeChainId)
  );
  const [isCustom, setIsCustom] = useState(false);

  // Load settings on mount and when chain changes
  useEffect(() => {
    setSettings(getChainSettings(activeChainId));
    setIsCustom(hasCustomSettings(activeChainId));
  }, [activeChainId]);

  // Listen for settings changes
  useEffect(() => {
    const handleChange = (e: CustomEvent<{ chainId: number; settings: ChainSettings }>) => {
      if (e.detail.chainId === activeChainId) {
        setSettings(e.detail.settings);
        setIsCustom(hasCustomSettings(activeChainId));
      }
    };

    window.addEventListener("chain-settings-changed", handleChange as EventListener);
    return () => {
      window.removeEventListener("chain-settings-changed", handleChange as EventListener);
    };
  }, [activeChainId]);

  const updateSettings = useCallback(
    (updates: Partial<ChainSettings>) => {
      saveChainSettings(activeChainId, updates);
    },
    [activeChainId]
  );

  const reset = useCallback(() => {
    resetChainSettings(activeChainId);
  }, [activeChainId]);

  return {
    settings,
    chainId: activeChainId,
    isCustom,
    updateSettings,
    resetSettings: reset,
    defaultSettings: getDefaultChainSettings(activeChainId),
  };
}
