import { spawn, execFileSync } from "node:child_process";
import http from "node:http";
import path from "node:path";

const AVD_NAME = "Pixel_10_Pro";
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

function runMaestroTests(): Promise<number> {
  const promise = new Promise<number>((resolve) => {
    const spawnOptions = { stdio: "inherit" as const, shell: true };
    const child = spawn("maestro", ["test", ".maestro"], spawnOptions);
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
    await ensureMetroRunning();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  console.log("Running Maestro tests...");
  const exitCode = await runMaestroTests();

  if (exitCode === 0) {
    console.log("E2E tests passed.");
  } else {
    console.log(`E2E tests failed (exit code ${exitCode}).`);
  }
  process.exit(exitCode);
}

runE2E();
