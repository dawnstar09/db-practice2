import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/components/AuthProvider';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "실시간 게시판",
    template: "%s | 실시간 게시판"
  },
  description: "Firebase 기반의 실시간 게시판입니다. 자유롭게 글을 작성하고 실시간 채팅을 즐겨보세요.",
  keywords: ["게시판", "실시간 채팅", "Firebase", "Next.js", "커뮤니티"],
  authors: [{ name: "DB Practice Team" }],
  creator: "DB Practice Team",
  publisher: "DB Practice Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    title: "실시간 게시판",
    description: "Firebase 기반의 실시간 게시판입니다. 자유롭게 글을 작성하고 실시간 채팅을 즐겨보세요.",
    siteName: "실시간 게시판",
    images: [
      {
        url: "/og-banner.svg",
        width: 1200,
        height: 630,
        alt: "실시간 게시판 - Firebase 기반의 커뮤니티",
      },
    ],
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  },
  twitter: {
    card: "summary_large_image",
    title: "실시간 게시판",
    description: "Firebase 기반의 실시간 게시판입니다. 자유롭게 글을 작성하고 실시간 채팅을 즐겨보세요.",
    images: ["/og-banner.svg"],
    creator: "@db_practice",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 카카오톡 공유 최적화 */}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:rich_attachment" content="true" />
        
        {/* 추가 소셜 미디어 최적화 */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        
        {/* 파비콘 */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        <AuthProvider>
          <Navbar />
          <main className="pt-16">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
