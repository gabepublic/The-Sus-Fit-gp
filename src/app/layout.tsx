import type { Metadata } from "next";
import {Montserrat_Alternates, Nabla, Fascinate, Modak} from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ToastProvider";
import { ReactQueryProvider, FeatureFlagProvider, ErrorBoundary } from "@/business-layer";

const montserratAlternatesSans= Montserrat_Alternates({
  variable: "--font-Montserrat-Alternates-sans",
  weight: "400",
  subsets: ["latin"],
});

const nablaSans= Nabla({
  variable: "--font-Nabla-sans",
  subsets: ["latin"],
});

const fascinateSans= Fascinate({
  variable: "--font-Fascinate-sans",
  weight: "400",
  subsets: ["latin"],
});

const modakFont = Modak({
  variable: "--font-modak",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Sus Fit",
  description: "we be doin' the most - a Those People production",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserratAlternatesSans.variable} ${nablaSans.variable} ${fascinateSans.variable} ${modakFont.variable} antialiased`}
      >
        <ErrorBoundary>
          <ReactQueryProvider>
            <ErrorBoundary>
              <FeatureFlagProvider>
                <ErrorBoundary>
                  <ToastProvider>
                    {children}
                  </ToastProvider>
                </ErrorBoundary>
              </FeatureFlagProvider>
            </ErrorBoundary>
          </ReactQueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

