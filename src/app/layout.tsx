import type { Metadata } from "next";
import {Montserrat_Alternates, Nabla, Fascinate} from "next/font/google";
import localFont from "next/font/local";
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

const modakFont = localFont({
  src: [
    {
      path: "../../public/fonts/Modak-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Modak-Regular.woff",
      weight: "400",
      style: "normal",
    }
  ],
  variable: "--font-modak",
  display: "swap",
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

