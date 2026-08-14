import sharp from "sharp";
import { join } from "node:path";

const root = process.cwd();
const source =
  process.argv[2] ??
  join(
    root,
    "public/branding/p1iq-wordmark-transparent.png"
  );
const out = join(root, "public/branding/p1iq-wordmark-transparent.png");
const faviconSrc = join(root, "public/branding/favicon-wordmark.png");

const trimmed = await sharp(source)
  .trim({ threshold: 12 })
  .png()
  .toBuffer({ resolveWithObject: true });

await sharp(trimmed.data).png().toFile(out);
await sharp(trimmed.data).png().toFile(faviconSrc);

console.log(
  JSON.stringify({
    width: trimmed.info.width,
    height: trimmed.info.height,
    hasAlpha: trimmed.info.channels === 4,
  })
);
