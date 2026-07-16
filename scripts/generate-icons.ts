import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, "../assets/images");
const SVG_SOURCE = path.join(ASSETS_DIR, "icon.svg");

interface IconSpec {
  size: number;
  description: string;
  // Defaults to icon.svg; set when an output has its own source SVG.
  source?: string;
}

// Icon specifications
const iconSpecs: Record<string, IconSpec> = {
  "icon.png": { size: 1024, description: "Main app icon" },
  "android-icon-foreground.png": {
    size: 1024,
    description: "Android foreground",
  },
  "android-icon-background.png": {
    size: 1024,
    description: "Android background (solid color)",
  },
  "android-icon-monochrome.png": {
    size: 1024,
    description: "Android monochrome",
  },
  "favicon.png": { size: 256, description: "Web favicon" },
  "splash-icon.png": { size: 200, description: "Splash screen icon" },
  // White "SB" silhouette for the Android notification small icon. Has its
  // own source (not the full-color app icon) and is already white/transparent,
  // so it just needs a resize. 96x96 per Google's notification-icon guideline.
  "notification-icon.png": {
    size: 96,
    description: "Android notification small icon",
    source: "notification-icon.svg",
  },
};

async function generateIcons(): Promise<void> {
  try {
    if (!fs.existsSync(SVG_SOURCE)) {
      throw new Error(`SVG source not found: ${SVG_SOURCE}`);
    }

    console.log("📦 Reading SVG source...\n");
    const svgBuffer = fs.readFileSync(SVG_SOURCE);

    // Generate regular icon variants
    for (const [filename, spec] of Object.entries(iconSpecs)) {
      if (filename === "android-icon-background.png") {
        // Generate solid color background
        console.log(`🎨 Generating ${filename} (${spec.description})...`);
        await sharp({
          create: {
            width: spec.size,
            height: spec.size,
            channels: 3,
            background: { r: 230, g: 244, b: 254 }, // #E6F4FE from app.json
          },
        })
          .png()
          .toFile(path.join(ASSETS_DIR, filename));
        console.log(`✅ ${filename}\n`);
      } else if (filename === "android-icon-monochrome.png") {
        // Generate monochrome version (desaturated)
        console.log(`🎨 Generating ${filename} (${spec.description})...`);
        await sharp(svgBuffer)
          .resize(spec.size, spec.size, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .grayscale()
          .png()
          .toFile(path.join(ASSETS_DIR, filename));
        console.log(`✅ ${filename}\n`);
      } else {
        // Generate regular icons. Most use the shared app icon (icon.svg);
        // a spec may point at its own source (e.g. the notification icon).
        console.log(`🎨 Generating ${filename} (${spec.description})...`);
        let sourceBuffer = svgBuffer;
        if (spec.source) {
          const sourcePath = path.join(ASSETS_DIR, spec.source);
          if (!fs.existsSync(sourcePath)) {
            throw new Error(`SVG source not found: ${sourcePath}`);
          }
          sourceBuffer = fs.readFileSync(sourcePath);
        }
        await sharp(sourceBuffer)
          .resize(spec.size, spec.size, {
            fit: "contain",
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toFile(path.join(ASSETS_DIR, filename));
        console.log(`✅ ${filename}\n`);
      }
    }

    console.log("🎉 All icons generated successfully!");
    console.log(`📁 Icons saved to: ${ASSETS_DIR}`);
  } catch (error) {
    console.error(
      "❌ Error generating icons:",
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

generateIcons();
