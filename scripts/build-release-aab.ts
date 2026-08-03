import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APP_JSON_PATH = path.join(__dirname, "../app.json");
const BUILD_GRADLE_PATH = path.join(__dirname, "../android/app/build.gradle");
const AAB_OUTPUT_PATH = path.join(
  __dirname,
  "../android/app/build/outputs/bundle/release/app-release.aab",
);

interface ExpoAppJson {
  expo: {
    android: {
      versionCode: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

function readCurrentVersionCode(): number {
  const raw = readFileSync(APP_JSON_PATH, "utf-8");
  const appJson: ExpoAppJson = JSON.parse(raw);
  return appJson.expo.android.versionCode;
}

function writeAppJsonVersionCode(nextVersionCode: number): void {
  const raw = readFileSync(APP_JSON_PATH, "utf-8");
  const appJson: ExpoAppJson = JSON.parse(raw);
  appJson.expo.android.versionCode = nextVersionCode;
  const updated = `${JSON.stringify(appJson, null, 2)}\n`;
  writeFileSync(APP_JSON_PATH, updated);
}

function writeBuildGradleVersionCode(nextVersionCode: number): void {
  const raw = readFileSync(BUILD_GRADLE_PATH, "utf-8");
  const updated = raw.replace(
    /versionCode \d+/,
    `versionCode ${nextVersionCode}`,
  );
  writeFileSync(BUILD_GRADLE_PATH, updated);
}

function incrementVersionCode(): number {
  const currentVersionCode = readCurrentVersionCode();
  const nextVersionCode = currentVersionCode + 1;
  writeAppJsonVersionCode(nextVersionCode);
  writeBuildGradleVersionCode(nextVersionCode);
  console.log(
    `Incremented versionCode from ${currentVersionCode} to ${nextVersionCode}.`,
  );
  return nextVersionCode;
}

function getGradlewCommand(): string {
  const isWindows = process.platform === "win32";
  const gradlewCommand = isWindows ? "gradlew.bat" : "./gradlew";
  return gradlewCommand;
}

// shell:true is required: Node throws EINVAL when spawning a .bat file without a shell (CVE-2024-27980 patch).
function runGradleBundleRelease(): Promise<number> {
  const promise = new Promise<number>((resolve) => {
    const spawnOptions = {
      stdio: "inherit" as const,
      shell: true,
      cwd: "android",
    };
    const gradlewCommand = getGradlewCommand();
    const child = spawn(gradlewCommand, ["bundleRelease"], spawnOptions);
    child.on("error", (error) => {
      console.error(error);
      resolve(1);
    });
    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
  return promise;
}

async function buildReleaseAab(): Promise<void> {
  const versionCode = incrementVersionCode();

  console.log("Building release AAB...");
  const exitCode = await runGradleBundleRelease();

  if (exitCode !== 0) {
    console.log(`Build failed (exit code ${exitCode}).`);
    process.exit(exitCode);
  }

  console.log(`Build succeeded. versionCode: ${versionCode}`);
  console.log(`AAB output: ${AAB_OUTPUT_PATH}`);
}

buildReleaseAab();
