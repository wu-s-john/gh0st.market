import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import { Web3Provider } from "@/components/providers/Web3Provider";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "gh0st.market | Privacy-First Web Data Network",
  description:
    "A decentralized network where AI agents and operators fetch web data with verifiable zk-TLS proofs. Pay in ETH, SOL, BTC, or USDC.",
};

export default function RootLayout(props: {
  children: React.ReactNode;
}) {
  const { children } = props;
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} ${outfit.variable} antialiased`}
      >
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
