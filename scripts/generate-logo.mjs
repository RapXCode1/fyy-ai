import sharp from "sharp";
import path from "path";
import fs from "fs";

const dir = "C:/Users/RHAFI/.gemini/antigravity-ide/brain/ba5495fc-201b-4a5b-810d-b8c513e74a78/.user_uploaded";
const logoWhiteBg   = path.join(dir, "media_1787165162590.jpg"); // white background — for OG, favicon, manifest, PWA
const logoTransparent = path.join(dir, "media_1787165162608.jpg"); // transparent bg rendered on checkboard — for in-app

const PUBLIC = "D:/fyy-ai-main/public";
const ASSETS = "D:/fyy-ai-main/assets";

async function run() {
  // --- 1. PUBLIC/logo.png  (transparent-bg version, 512x512 PNG, used in-app) ---
  await sharp(logoTransparent)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC, "logo.png"));
  console.log("✅ public/logo.png");

  // --- 2. PUBLIC/logo-nobg.png (explicit alias for same transparent logo) ---
  await sharp(logoTransparent)
    .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC, "logo-nobg.png"));
  console.log("✅ public/logo-nobg.png");

  // --- 3. PUBLIC/icon-512.png (white-bg, for PWA manifest large icon) ---
  await sharp(logoWhiteBg)
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC, "icon-512.png"));
  console.log("✅ public/icon-512.png");

  // --- 4. PUBLIC/icon-192.png (white-bg, for PWA manifest small icon) ---
  await sharp(logoWhiteBg)
    .resize(192, 192)
    .png()
    .toFile(path.join(PUBLIC, "icon-192.png"));
  console.log("✅ public/icon-192.png");

  // --- 5. PUBLIC/apple-icon.png (white-bg, 180x180 for Apple Touch Icon) ---
  await sharp(logoWhiteBg)
    .resize(180, 180)
    .png()
    .toFile(path.join(PUBLIC, "apple-icon.png"));
  console.log("✅ public/apple-icon.png");

  // --- 6. PUBLIC/icon-bg.png (white-bg, 512x512 for OG / social preview) ---
  await sharp(logoWhiteBg)
    .resize(512, 512)
    .png()
    .toFile(path.join(PUBLIC, "icon-bg.png"));
  console.log("✅ public/icon-bg.png");

  // --- 7. PUBLIC/og-image.png (1200x630 OG image with red bg + centered logo) ---
  const centerLogo = await sharp(logoWhiteBg)
    .resize(400, 400)
    .png()
    .toBuffer();

  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { r: 8, g: 8, b: 10, alpha: 1 } }
  })
    .composite([{ input: centerLogo, gravity: "center" }])
    .png()
    .toFile(path.join(PUBLIC, "og-image.png"));
  console.log("✅ public/og-image.png");

  // --- 8. PUBLIC/icons/icon-192.png & icon-512.png ---
  const iconsDir = path.join(PUBLIC, "icons");
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  await sharp(logoWhiteBg).resize(192, 192).png().toFile(path.join(iconsDir, "icon-192.png"));
  await sharp(logoWhiteBg).resize(512, 512).png().toFile(path.join(iconsDir, "icon-512.png"));
  console.log("✅ public/icons/icon-192.png & icon-512.png");

  // --- 9. ASSETS/icon.png, splash.png, splash-dark.png ---
  await sharp(logoWhiteBg).resize(512, 512).png().toFile(path.join(ASSETS, "icon.png"));
  await sharp(logoWhiteBg).resize(512, 512).png().toFile(path.join(ASSETS, "splash.png"));
  await sharp(logoWhiteBg).resize(512, 512).png().toFile(path.join(ASSETS, "splash-dark.png"));
  console.log("✅ assets/icon.png, splash.png, splash-dark.png");

  // --- 10. Try Android mipmap dirs if they exist ---
  const androidDirs = [
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-hdpi",
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-mdpi",
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-xhdpi",
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-xxhdpi",
    "D:/fyy-ai-main/android/app/src/main/res/mipmap-xxxhdpi",
  ];
  const androidSizes = [72, 48, 96, 144, 192];
  for (let i = 0; i < androidDirs.length; i++) {
    if (fs.existsSync(androidDirs[i])) {
      await sharp(logoWhiteBg).resize(androidSizes[i], androidSizes[i]).png().toFile(path.join(androidDirs[i], "ic_launcher.png"));
      await sharp(logoTransparent).resize(androidSizes[i], androidSizes[i]).png().toFile(path.join(androidDirs[i], "ic_launcher_round.png"));
      console.log(`✅ Android ${path.basename(androidDirs[i])}`);
    }
  }

  console.log("\n🎉 ALL ICONS GENERATED SUCCESSFULLY!");
}

run().catch(e => { console.error("❌", e); process.exit(1); });
