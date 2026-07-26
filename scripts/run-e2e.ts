import { spawn, execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import http from "node:http";
import path from "node:path";

const AVD_NAME = "Pixel_7_Pro";
const APP_ID = "com.relentless.memory_journal";
const MAESTRO_OUTPUT_DIR = "e2e-results";
const REGISTER_FLOW_NAME = "execute_register_flow";
const REGISTER_FLOW_SCREENSHOT_NAMES = [
  "01-upload-picture",
  "02-enter-username",
  "03-enter-password",
  "04-enter-confirm-password",
  "05-submit-register-form",
];
const VAULT_ATTACHMENTS_DIR = path.join("docs", "attachments", "register-flow");
const METRO_STATUS_URL = "http://localhost:8081/status";
const METRO_READY_BODY = "packager-status:running";
const METRO_REQUEST_TIMEOUT_MS = 2000;
const BOOT_POLL_INTERVAL_MS = 2000;
const BOOT_TIMEOUT_MS = 120000;
const METRO_POLL_INTERVAL_MS = 1000;
const METRO_TIMEOUT_MS = 60000;

function sleep(ms: number): Promise<void> {
  const promise = new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
  return promise;
}

function getEmulatorPath(): string {
  const androidHome = process.env.ANDROID_HOME;
  if (!androidHome) {
    throw new Error("ANDROID_HOME is not set.");
  }
  const emulatorPath = path.join(androidHome, "emulator", "emulator.exe");
  return emulatorPath;
}

function isEmulatorRunning(): boolean {
  const execOptions = { encoding: "utf-8" as const };
  const output = execFileSync("adb", ["devices"], execOptions);
  const isRunning = /emulator-\d+\s+device/.test(output);
  return isRunning;
}

function isBootCompleted(): boolean {
  try {
    const execOptions = { encoding: "utf-8" as const };
    const output = execFileSync(
      "adb",
      ["shell", "getprop", "sys.boot_completed"],
      execOptions,
    );
    const isCompleted = output.trim() === "1";
    return isCompleted;
  } catch (_error) {
    return false;
  }
}

async function waitForBootCompleted(): Promise<void> {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (isBootCompleted()) {
      return;
    }
    await sleep(BOOT_POLL_INTERVAL_MS);
  }
  throw new Error("Timed out waiting for the emulator to finish booting.");
}

async function startEmulator(): Promise<void> {
  const emulatorPath = getEmulatorPath();
  const spawnOptions = {
    detached: true,
    stdio: "ignore" as const,
    cwd: path.dirname(emulatorPath),
  };
  const child = spawn(emulatorPath, ["-avd", AVD_NAME], spawnOptions);
  child.unref();
  await waitForBootCompleted();
}

async function ensureEmulatorRunning(): Promise<void> {
  if (isEmulatorRunning()) {
    console.log("Emulator already running.");
    return;
  }
  console.log("Starting emulator...");
  await startEmulator();
  console.log("Emulator booted.");
}

function isAppInstalled(): boolean {
  try {
    const execOptions = { encoding: "utf-8" as const };
    const output = execFileSync(
      "adb",
      ["shell", "pm", "path", APP_ID],
      execOptions,
    );
    return output.trim().startsWith("package:");
  } catch (_error) {
    return false;
  }
}

function runAppInstall(): Promise<number> {
  const promise = new Promise<number>((resolve) => {
    const spawnOptions = { stdio: "inherit" as const, shell: true };
    const child = spawn("npm", ["run", "android"], spawnOptions);
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

async function ensureAppInstalled(): Promise<void> {
  if (isAppInstalled()) {
    console.log("App already installed.");
    return;
  }
  console.log("App not installed on this device — building and installing...");
  const exitCode = await runAppInstall();
  if (exitCode !== 0) {
    throw new Error(`npm run android failed with exit code ${exitCode}.`);
  }
}

function isMetroReady(): Promise<boolean> {
  const promise = new Promise<boolean>((resolve) => {
    const request = http.get(METRO_STATUS_URL, (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        const isReady = body.trim() === METRO_READY_BODY;
        resolve(isReady);
      });
    });
    request.on("error", () => {
      resolve(false);
    });
    request.setTimeout(METRO_REQUEST_TIMEOUT_MS, () => {
      request.destroy();
      resolve(false);
    });
  });
  return promise;
}

async function waitForMetroReady(): Promise<void> {
  const deadline = Date.now() + METRO_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const isReady = await isMetroReady();
    if (isReady) {
      return;
    }
    await sleep(METRO_POLL_INTERVAL_MS);
  }
  throw new Error("Timed out waiting for Metro to become ready.");
}

async function startMetro(): Promise<void> {
  const spawnOptions = {
    detached: true,
    stdio: "ignore" as const,
    shell: true,
  };
  const child = spawn("npm", ["run", "start"], spawnOptions);
  child.unref();
  await waitForMetroReady();
}

async function ensureMetroRunning(): Promise<void> {
  const isReady = await isMetroReady();
  if (isReady) {
    console.log("Metro already running.");
    return;
  }
  console.log("Starting Metro...");
  await startMetro();
  console.log("Metro ready.");
}

function getLatestRunDir(resultsDir: string): string | null {
  if (!existsSync(resultsDir)) {
    return null;
  }
  const runNames = readdirSync(resultsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const latestName = runNames.at(-1);
  if (!latestName) {
    return null;
  }
  const latestRunDir = path.join(resultsDir, latestName);
  return latestRunDir;
}

function copyRegisterFlowScreenshots(resultsDir: string): void {
  const latestRunDir = getLatestRunDir(resultsDir);
  if (!latestRunDir) {
    console.log("No e2e-results run found — skipping screenshot sync.");
    return;
  }

  const screenshotSourceDir = path.join(
    latestRunDir,
    REGISTER_FLOW_NAME,
    "takeScreenshot",
  );
  if (!existsSync(screenshotSourceDir)) {
    console.log(
      `No screenshots found at ${screenshotSourceDir} — skipping screenshot sync.`,
    );
    return;
  }

  mkdirSync(VAULT_ATTACHMENTS_DIR, { recursive: true });

  for (const name of REGISTER_FLOW_SCREENSHOT_NAMES) {
    const sourcePath = path.join(screenshotSourceDir, `${name}.png`);
    if (!existsSync(sourcePath)) {
      console.log(`Missing screenshot: ${sourcePath}`);
      continue;
    }
    const destPath = path.join(VAULT_ATTACHMENTS_DIR, `${name}.png`);
    copyFileSync(sourcePath, destPath);
    console.log(`Updated ${destPath}`);
  }
}

function runMaestroTests(): Promise<number> {
  const promise = new Promise<number>((resolve) => {
    const spawnOptions = { stdio: "inherit" as const, shell: true };
    const child = spawn(
      "maestro",
      ["test", ".maestro", "--test-output-dir", MAESTRO_OUTPUT_DIR],
      spawnOptions,
    );
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

async function runE2E(): Promise<void> {
  try {
    await ensureEmulatorRunning();
    await ensureAppInstalled();
    await ensureMetroRunning();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("Running Maestro tests...");
  const exitCode = await runMaestroTests();

  if (exitCode === 0) {
    console.log("E2E tests passed.");
    copyRegisterFlowScreenshots(MAESTRO_OUTPUT_DIR);
  } else {
    console.log(`E2E tests failed (exit code ${exitCode}).`);
  }
  process.exit(exitCode);
}

runE2E();
