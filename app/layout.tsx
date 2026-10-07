import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import {
  OG_IMAGE,
  SITE_AUTHOR,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
} from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

/**
 * Site-wide metadata. Pages override `title`/`description` and inherit the rest
 * (openGraph base, icons, robots). Keep brand copy here, not in each page.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ELVAVEO | Software, SaaS & Digital Solutions",
    template: "%s | ELVAVEO",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "ELVAVEO",
    "elvaveo.com",
    "software development",
    "SaaS",
    "digital solutions",
    "web development",
    "UI UX design",
    "cloud and devops",
    "digital consulting",
    "Finlo",
    "FinloCRM",
  ],
  authors: [{ name: SITE_AUTHOR, url: SITE_URL }],
  creator: SITE_AUTHOR,
  publisher: SITE_AUTHOR,
  applicationName: SITE_NAME,
  category: "technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "ELVAVEO | Software, SaaS & Digital Solutions",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "ELVAVEO — software, SaaS and digital solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ELVAVEO | Software, SaaS & Digital Solutions",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
    creator: "@ELVAVEO",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    // Listed smallest-first: browsers fetch the first entry that fits, so
    // tabs pull the 2 KB icon instead of the 256 px one. Both are the official
    // brand mark - the wide wordmark is deliberately not a favicon shape.
    icon: [
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "256x256", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans">
        <a
          href="#main"
          className="sr-only z-[60] rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
