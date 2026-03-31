import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RiskDetector — 계약서 위험 탐지 서비스",
  description:
    "부동산 임대차 · 고용계약서를 OCR로 분석하여 법적 위험을 즉시 탐지합니다.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="app-wrapper">
          {children}
        </div>
      </body>
    </html>
  );
}
