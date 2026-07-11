import { ImageResponse } from "next/og";
import { site } from "@/lib/site";

/**
 * Default social card for every page. Insights and case studies fall
 * back to this until they ship their own. Colors mirror the theme
 * tokens in styles/globals.css (base, ink, muted, accent).
 */

export const alt = `${site.name} · ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Fixed star positions keep the image identical across builds.
const stars: { x: number; y: number; r: number; o: number }[] = [
  { x: 90, y: 80, r: 2, o: 0.7 },
  { x: 240, y: 180, r: 1.5, o: 0.4 },
  { x: 420, y: 60, r: 2.5, o: 0.8 },
  { x: 640, y: 140, r: 1.5, o: 0.5 },
  { x: 830, y: 90, r: 2, o: 0.6 },
  { x: 1050, y: 170, r: 1.5, o: 0.4 },
  { x: 1130, y: 60, r: 2.5, o: 0.7 },
  { x: 160, y: 420, r: 1.5, o: 0.4 },
  { x: 980, y: 460, r: 2, o: 0.5 },
  { x: 1100, y: 540, r: 1.5, o: 0.6 },
  { x: 320, y: 560, r: 2, o: 0.5 },
  { x: 720, y: 520, r: 1.5, o: 0.35 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px",
        backgroundColor: "#080a10",
        backgroundImage:
          "radial-gradient(circle at 85% 20%, rgba(173, 128, 235, 0.16), transparent 55%), radial-gradient(circle at 12% 85%, rgba(96, 205, 216, 0.12), transparent 50%)",
        color: "#ebedf3",
      }}
    >
      {stars.map((star, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: star.x,
            top: star.y,
            width: star.r * 2,
            height: star.r * 2,
            borderRadius: 9999,
            backgroundColor: `rgba(235, 237, 243, ${star.o})`,
          }}
        />
      ))}
      <div
        style={{
          display: "flex",
          width: 72,
          height: 6,
          backgroundColor: "#deba6c",
          borderRadius: 3,
          marginBottom: 40,
        }}
      />
      <div
        style={{
          display: "flex",
          fontSize: 88,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        {site.name}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 38,
          color: "#969dad",
          marginTop: 24,
        }}
      >
        I design the systems enterprises run on.
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: 80,
          bottom: 60,
          fontSize: 28,
          color: "#deba6c",
        }}
      >
        {site.domain}
      </div>
    </div>,
    { ...size },
  );
}
