import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import toIco from "to-ico";

const root = process.cwd();
const source = join(root, "public/branding/player-one-iq-logo.png");
const publicDir = join(root, "public");

async function writePng(size, filename) {
  const output = join(publicDir, filename);
  await sharp(source)
    .resize(size, size, { fit: "contain", background: "#000000" })
    .png()
    .toFile(output);
  return output;
}

async function main() {
  await mkdir(publicDir, { recursive: true });

  await writePng(16, "favicon-16x16.png");
  await writePng(32, "favicon-32x32.png");
  await writePng(180, "apple-touch-icon.png");
  await writePng(192, "android-chrome-192x192.png");
  await writePng(512, "android-chrome-512x512.png");

  const icoBuffers = await Promise.all(
    [16, 32].map((size) =>
      sharp(source)
        .resize(size, size, { fit: "contain", background: "#000000" })
        .png()
        .toBuffer()
    )
  );

  const ico = await toIco(icoBuffers);
  await writeFile(join(publicDir, "favicon.ico"), ico);

  const manifest = {
    name: "Player One IQ",
    short_name: "P1IQ",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: "#000000",
    background_color: "#000000",
    display: "standalone",
  };

  await writeFile(
    join(publicDir, "site.webmanifest"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  console.log("Generated favicon set in public/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
