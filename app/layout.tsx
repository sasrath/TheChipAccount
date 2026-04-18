import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EtchedTopography } from "@/components/background/etched-topography";
import { MaskLayerStack } from "@/components/background/mask-layer-stack";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TheChipAccount — The Hidden Environmental Cost of Your Chip",
  description:
    "See the water, energy, and emissions it takes to manufacture a single semiconductor chip. Every number cited from primary sources. Powered by Google Gemini.",
  openGraph: {
    title: "TheChipAccount",
    description:
      "The hidden environmental cost of manufacturing a semiconductor chip.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <EtchedTopography />
        <MaskLayerStack />
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
