import type { Metadata, Viewport } from "next";
import { AppBar } from "@/app/components/AppBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tracker",
  description: "Haftalık alışkanlık ve gelişim takibi",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Klavye açıldığında sayfayı üstüne bindirmek yerine görünür alanı küçültür —
  // sabit konumlu (fixed) modallerin klavyenin arkasında beyaz boşluk bırakmasını önler.
  interactiveWidget: "resizes-content",
};

// Açık tema kaldırıldı — uygulama artık her zaman koyu (Buzlu Cam) temada açılır.
const THEME_INIT_SCRIPT = `(function(){document.documentElement.setAttribute("data-theme","dark");})();`;

const ACCENT_PRESETS_JSON = JSON.stringify({
  blue: { accent: "#0a84ff", soft: "#f0f8ff" },
  indigo: { accent: "#5e5ce6", soft: "#f2f1fd" },
  teal: { accent: "#22b8cf", soft: "#eafbfd" },
  pink: { accent: "#ff375f", soft: "#fff0f3" },
  mint: { accent: "#30d158", soft: "#eefdf1" },
});

const ACCENT_INIT_SCRIPT = `(function(){try{var presets=${ACCENT_PRESETS_JSON};var k=localStorage.getItem("tracker_accent");var p=presets[k];if(p){document.documentElement.style.setProperty("--compass",p.accent);document.documentElement.style.setProperty("--compass-soft",p.soft);}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className="min-h-dvh antialiased" suppressHydrationWarning>
      <body className="min-h-dvh">
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: ACCENT_INIT_SCRIPT }} />
        <AppBar />
        {children}
      </body>
    </html>
  );
}
