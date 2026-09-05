import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ARWEEN — ระบบบริหารงานและประเมินทีม",
  description: "รวบรวมหลักฐาน แจ้งเตือน อำนวยความสะดวก ประเมินแบบเป็นกลาง",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
