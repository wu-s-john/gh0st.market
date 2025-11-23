"use client";

import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { LandingPage } from "@/components/LandingPage";
import { RoleSelection } from "@/components/RoleSelection";

export default function Home() {
  const { primaryWallet } = useDynamicContext();

  // Show role selection if authenticated, otherwise show landing page
  if (primaryWallet) {
    return <RoleSelection />;
  }

  return <LandingPage />;
}
