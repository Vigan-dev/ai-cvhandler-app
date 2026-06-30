import type { Metadata } from "next";
import { AppShell } from "./components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "CV-Handler - Local CV Analysis",
  description:
    "Browser-local CV analysis and candidate management without remote storage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=JSON.parse(localStorage.getItem('talentlens-theme'));if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
