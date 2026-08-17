import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// AppBar.tsx'teki logo işaretiyle birebir aynı — Buzlu Cam (Füme) kimliğinin
// zaten canlıda onaylı 2x2 renk gridi.
const BG = "#1a1a1d";
const VIOLET = "#8b5cf6";
const AMBER = "#fbbf24";
const ROSE = "#f43f5e";
const EMERALD = "#10b981";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 100, height: 100 }}>
          <div style={{ display: "flex", gap: 12, flex: 1 }}>
            <div style={{ background: VIOLET, borderRadius: 18, flex: 1 }} />
            <div style={{ background: AMBER, borderRadius: 18, flex: 1 }} />
          </div>
          <div style={{ display: "flex", gap: 12, flex: 1 }}>
            <div style={{ background: ROSE, borderRadius: 18, flex: 1 }} />
            <div style={{ background: EMERALD, borderRadius: 18, flex: 1 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
