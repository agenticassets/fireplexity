import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'sonner'
import { EB_Garamond, Nunito_Sans } from 'next/font/google'

// Configure Google Fonts
const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-eb-garamond',
})

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-nunito-sans',
})

export const metadata: Metadata = {
  title: "Orbis - Industry Intelligence",
  description: "Advanced search with AI-powered insights, built specificallyfor real estate professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} ${nunitoSans.variable} font-nunito antialiased`}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}