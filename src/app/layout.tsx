import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: { default: "Mizan Legal | ميزان للمحاماة", template: "%s | Mizan Legal" }, description: "Legal guidance with clarity, care, and confidence." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html><body>{children}</body></html>; }
