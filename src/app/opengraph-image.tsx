import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { BRAND_LOGO_PATH } from "@/lib/branding";

export const alt = "Player One IQ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logoBuffer = await readFile(
    join(process.cwd(), "public", BRAND_LOGO_PATH.replace(/^\//, ""))
  );
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <img
          src={logoSrc}
          alt="Player One IQ"
          width={560}
          height={200}
          style={{ objectFit: "contain" }}
        />
        <div
          style={{
            marginTop: 40,
            fontSize: 28,
            color: "#a1a1aa",
            maxWidth: 720,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Creator and sponsor management for gaming agencies
        </div>
      </div>
    ),
    { ...size }
  );
}
