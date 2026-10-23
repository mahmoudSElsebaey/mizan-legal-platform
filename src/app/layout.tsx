import type { Metadata } from "next";
import "./globals.css";

const siteName = "MIZAN | ميزان للمحاماة";

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: "%s | MIZAN",
  },
  description:
    "ميزان للمحاماة والاستشارات القانونية. وضوح في الرؤية، وثقة في كل خطوة. Legal guidance with clarity, care, and confidence.",
  applicationName: "MIZAN",
  icons: {
    icon: "/mizan-mark.svg",
    shortcut: "/mizan-mark.svg",
    apple: "/mizan-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
