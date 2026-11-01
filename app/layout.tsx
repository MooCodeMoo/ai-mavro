import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Mavro AI — svetovalec za površine",
  description:
    "Fotografiraj površino, preveri Mavrov predlog čiščenja in pripravi povpraševanje.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sl">
      <body>{children}</body>
    </html>
  );
}
