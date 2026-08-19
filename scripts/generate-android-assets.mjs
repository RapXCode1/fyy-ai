import sharp from "sharp";
import path from "path";
import fs from "fs";

// Logo assets
const logoTransparent = "C:/Users/RHAFI/.gemini/antigravity-ide/brain/ba5495fc-201b-4a5b-810d-b8c513e74a78/.user_uploaded/media_1787167645855.png";
const logoWhiteBg    = "C:/Users/RHAFI/.gemini/antigravity-ide/brain/ba5495fc-201b-4a5b-810d-b8c513e74a78/.user_uploaded/media_1787165162590.jpg";

const resDir = "D:/fyy-ai-main/android/app/src/main/res";

// 1. Adaptive Icon Foregrounds (Standard Android adaptive icon sizes: 108dp base)
// mdpi: 108x108, hdpi: 162x162, xhdpi: 216x216, xxhdpi: 324x324, xxxhdpi: 432x432
const mipmaps = [
  { name: "mipmap-mdpi", fgSize: 108, logoSize: 72, iconSize: 48 },
  { name: "mipmap-hdpi", fgSize: 162, logoSize: 108, iconSize: 72 },
  { name: "mipmap-xhdpi", fgSize: 216, logoSize: 144, iconSize: 96 },
  { name: "mipmap-xxhdpi", fgSize: 324, logoSize: 216, iconSize: 144 },
  { name: "mipmap-xxxhdpi", fgSize: 432, logoSize: 288, iconSize: 192 },
];

// 2. Splash Screen Dimensions (Portrait & Landscape)
const splashPort = [
  { folder: "drawable", w: 480, h: 800, logo: 180 },
  { folder: "drawable-port-mdpi", w: 320, h: 480, logo: 140 },
  { folder: "drawable-port-hdpi", w: 480, h: 800, logo: 200 },
  { folder: "drawable-port-xhdpi", w: 720, h: 1280, logo: 280 },
  { folder: "drawable-port-xxhdpi", w: 960, h: 1600, logo: 380 },
  { folder: "drawable-port-xxxhdpi", w: 1280, h: 1920, logo: 480 },
];

const splashLand = [
  { folder: "drawable-land-mdpi", w: 480, h: 320, logo: 140 },
  { folder: "drawable-land-hdpi", w: 800, h: 480, logo: 200 },
  { folder: "drawable-land-xhdpi", w: 1280, h: 720, logo: 260 },
  { folder: "drawable-land-xxhdpi", w: 1600, h: 960, logo: 340 },
  { folder: "drawable-land-xxxhdpi", w: 1920, h: 1280, logo: 420 },
];

async function run() {
  console.log("🚀 Generating Android APK Adaptive Icons & Splash Screens...");

  // --- A. Generate Mipmap Icons & Adaptive Foregrounds ---
  for (const m of mipmaps) {
    const dir = path.join(resDir, m.name);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // 1. Classic launcher (white bg square)
    await sharp(logoWhiteBg)
      .resize(m.iconSize, m.iconSize)
      .png()
      .toFile(path.join(dir, "ic_launcher.png"));

    // 2. Round launcher
    await sharp(logoWhiteBg)
      .resize(m.iconSize, m.iconSize)
      .png()
      .toFile(path.join(dir, "ic_launcher_round.png"));

    // 3. Adaptive Foreground (transparent 108dp canvas with centered logo)
    const logoBuffer = await sharp(logoTransparent)
      .resize(m.logoSize, m.logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: { width: m.fgSize, height: m.fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
    })
      .composite([{ input: logoBuffer, gravity: "center" }])
      .png()
      .toFile(path.join(dir, "ic_launcher_foreground.png"));

    console.log(`✅ ${m.name}: ic_launcher, ic_launcher_round, ic_launcher_foreground`);
  }

  // --- B. Generate Portrait Splash Screens ---
  for (const s of splashPort) {
    const dir = path.join(resDir, s.folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const logoBuf = await sharp(logoTransparent)
      .resize(s.logo, s.logo, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: { width: s.w, height: s.h, channels: 4, background: { r: 8, g: 8, b: 10, alpha: 255 } } // #08080A
    })
      .composite([{ input: logoBuf, gravity: "center" }])
      .png()
      .toFile(path.join(dir, "splash.png"));

    console.log(`✅ Portrait Splash: ${s.folder} (${s.w}x${s.h})`);
  }

  // --- C. Generate Landscape Splash Screens ---
  for (const s of splashLand) {
    const dir = path.join(resDir, s.folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const logoBuf = await sharp(logoTransparent)
      .resize(s.logo, s.logo, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await sharp({
      create: { width: s.w, height: s.h, channels: 4, background: { r: 8, g: 8, b: 10, alpha: 255 } } // #08080A
    })
      .composite([{ input: logoBuf, gravity: "center" }])
      .png()
      .toFile(path.join(dir, "splash.png"));

    console.log(`✅ Landscape Splash: ${s.folder} (${s.w}x${s.h})`);
  }

  console.log("\n🎉 ALL ANDROID APK ASSETS PERFECTLY GENERATED & ALIGNED!");
}

run().catch(e => { console.error("❌ Error generating Android APK assets:", e); process.exit(1); });
