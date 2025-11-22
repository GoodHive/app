import type { ReactNode } from "react";

import Script from "next/script";

import "@/utils/bigint-polyfill";
import "./globals.css";

import { ClientLayout } from "./client-layout";
import { GAListener } from "./ga-listener";

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID;
const isProduction = process.env.NODE_ENV === 'production';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Only load ContentSquare in production, not in development */}
        {isProduction && (
          <Script
            id="contentsquare"
            strategy="afterInteractive"
            src="https://t.contentsquare.net/uxa/68a7572467a44.js"
          />
        )}
      </head>
      <body className="min-h-screen">
        {!!GA_TRACKING_ID && (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_TRACKING_ID}', { send_page_view: false });`}
            </Script>
            <GAListener />
          </>
        )}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
