import { fetch } from "expo/fetch";
import { File } from "expo-file-system";
import { initLlama, LlamaContext } from "llama.rn";
import {
  AppPrivateDirectoryPaths,
  ensureDirectoryExists,
  getAppDirectory,
} from "@/services/filesystem";

// SmolVLM2-500M-Instruct: smallest/fastest model with confirmed working
// GGUF multimodal (vision) support in llama.cpp today.
const MODEL_FILENAME = "SmolVLM2-500M-Video-Instruct-Q8_0.gguf";
const MMPROJ_FILENAME = "mmproj-SmolVLM2-500M-Video-Instruct-Q8_0.gguf";
const MODEL_BASE_URL =
  "https://huggingface.co/ggml-org/SmolVLM2-500M-Video-Instruct-GGUF/resolve/main";

// Module-level singleton, same style as services/database.ts's `db`.
let llamaContext: LlamaContext | null = null;

// Set while a download's stream is being read, so pauseDownload() has
// something to abort. Only one file downloads at a time.
let activeDownloadAbort: AbortController | null = null;

export class DownloadPausedError extends Error {
  constructor() {
    super("Download paused");
    this.name = "DownloadPausedError";
  }
}

export const pauseDownload = (): void => {
  activeDownloadAbort?.abort();
};

const getModelsDir = async () => {
  const dir = getAppDirectory(AppPrivateDirectoryPaths.Models);
  await ensureDirectoryExists(dir);
  return dir;
};

// Streams the download so we can report progress and avoid holding the
// whole (~440MB) file in memory at once. Writes to a ".part" temp file and
// only moves it to the final path once the stream completes and its size
// matches the expected total — otherwise an interrupted download (dropped
// connection, backgrounded app, user-requested pause) leaves a truncated
// file at the final path that `isModelDownloaded` would mistake for a
// complete one forever.
//
// Resumable: if a ".part" file from a previous attempt already exists, this
// requests only the remaining bytes via a `Range` header and seeks the
// FileHandle to the end before appending, instead of re-downloading
// everything. If the server doesn't honor the range, it falls back to
// restarting that file from scratch.
//
// Reports raw byte counts (not a pre-divided fraction) so a caller
// downloading multiple files can combine them into one overall fraction
// instead of each file's progress being reported in isolation.
const downloadFileWithProgress = async (
  url: string,
  targetFile: File,
  onProgress?: (bytesReceived: number, totalBytes: number) => void,
): Promise<void> => {
  const tempFile = new File(`${targetFile.uri}.part`);
  const resumeOffset = tempFile.exists ? tempFile.size : 0;

  const abortController = new AbortController();
  activeDownloadAbort = abortController;

  try {
    const response = await fetch(url, {
      signal: abortController.signal,
      headers: resumeOffset > 0 ? { Range: `bytes=${resumeOffset}-` } : {},
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to download ${url}: ${response.status}`);
    }

    const isResuming = resumeOffset > 0 && response.status === 206;
    if (resumeOffset > 0 && !isResuming) {
      // Server ignored the Range request and sent the whole file from byte
      // 0 — the existing partial data no longer lines up, start over.
      tempFile.delete();
    }
    if (!tempFile.exists) {
      tempFile.create();
    }

    const remainingBytes = Number(response.headers.get("content-length")) || 0;
    const totalBytes = isResuming
      ? resumeOffset + remainingBytes
      : remainingBytes;
    let bytesReceived = isResuming ? resumeOffset : 0;

    const handle = tempFile.open();
    try {
      handle.offset = bytesReceived;
      const reader = response.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        handle.writeBytes(value);
        bytesReceived += value.byteLength;
        onProgress?.(bytesReceived, totalBytes);
      }
    } finally {
      handle.close();
    }

    if (totalBytes > 0 && bytesReceived !== totalBytes) {
      throw new Error(
        `Download incomplete: received ${bytesReceived} of ${totalBytes} bytes`,
      );
    }

    if (targetFile.exists) {
      targetFile.delete();
    }
    tempFile.move(targetFile);
  } catch (e) {
    if (abortController.signal.aborted) {
      throw new DownloadPausedError();
    }
    throw e;
  } finally {
    activeDownloadAbort = null;
  }
};

export const isModelDownloaded = async (): Promise<boolean> => {
  const dir = await getModelsDir();
  return (
    new File(dir, MODEL_FILENAME).exists &&
    new File(dir, MMPROJ_FILENAME).exists
  );
};

export const isDownloadInProgress = (): boolean => activeDownloadAbort !== null;

// Downloads whichever of the two files isn't already cached. Safe to call
// again after a pause/error — resumes each file from its ".part" leftovers.
//
// Reports combined progress across every file that still needs
// downloading, not just whichever one happens to be transferring at a
// given moment — otherwise the fraction would hit 1 as soon as the larger
// model file finished while the mmproj file still had data left to fetch.
export const downloadModel = async (
  onProgress?: (fraction: number) => void,
): Promise<void> => {
  if (isDownloadInProgress()) {
    throw new Error("A download is already in progress");
  }

  const dir = await getModelsDir();
  const candidates = [
    { filename: MODEL_FILENAME, file: new File(dir, MODEL_FILENAME) },
    { filename: MMPROJ_FILENAME, file: new File(dir, MMPROJ_FILENAME) },
  ];
  const needed = candidates.filter(({ file }) => !file.exists);

  const fileTotals = new Map<string, { received: number; total: number }>();
  if (onProgress) {
    await Promise.all(
      needed.map(async ({ filename }) => {
        const size = await getExpectedFileSize(`${MODEL_BASE_URL}/${filename}`);
        if (size) fileTotals.set(filename, { received: 0, total: size });
      }),
    );
  }

  const reportCombined = (
    filename: string,
    received: number,
    total: number,
  ) => {
    fileTotals.set(filename, { received, total });
    let receivedSum = 0;
    let totalSum = 0;
    for (const t of fileTotals.values()) {
      receivedSum += t.received;
      totalSum += t.total;
    }
    if (totalSum > 0) onProgress?.(receivedSum / totalSum);
  };

  for (const { filename, file } of needed) {
    await downloadFileWithProgress(
      `${MODEL_BASE_URL}/${filename}`,
      file,
      onProgress &&
        ((received, total) => reportCombined(filename, received, total)),
    );
  }
};

// Deletes cached model files (and any ".part" leftovers), releasing the
// active context first so it isn't left pointing at deleted files.
export const deleteModelFiles = async (): Promise<void> => {
  if (isDownloadInProgress()) {
    throw new Error("Cannot delete while a download is in progress");
  }

  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }

  const dir = await getModelsDir();
  for (const filename of [MODEL_FILENAME, MMPROJ_FILENAME]) {
    const file = new File(dir, filename);
    const partFile = new File(`${file.uri}.part`);
    if (file.exists) file.delete();
    if (partFile.exists) partFile.delete();
  }
};

export type DownloadState =
  "not_started" | "downloading" | "paused" | "downloaded";

// Derives the download state — "downloading" is a live fact (is a fetch
// actively running right now), the rest are derived purely from what's on
// disk, so the screen can reflect reality on mount or after any download
// attempt ends, rather than tracking transitions by hand.
export const getDownloadState = async (): Promise<DownloadState> => {
  if (isDownloadInProgress()) return "downloading";
  if (await isModelDownloaded()) return "downloaded";

  const dir = await getModelsDir();
  const hasPartFile = [MODEL_FILENAME, MMPROJ_FILENAME].some(
    (filename) => new File(`${new File(dir, filename).uri}.part`).exists,
  );
  return hasPartFile ? "paused" : "not_started";
};

// A 0-1 fraction for the progress indicator when nothing is actively
// downloading (e.g. right after the screen mounts) — sums actual on-disk
// bytes across both files (full size if present, ".part" size if not)
// against their combined expected size (one HEAD request per file still
// needed), so it's consistent with downloadModel()'s live combined
// progress and never claims 100% just because the larger model file landed
// while mmproj hasn't.
export const getDownloadProgress = async (): Promise<number> => {
  const dir = await getModelsDir();
  let receivedSum = 0;
  let totalSum = 0;

  for (const filename of [MODEL_FILENAME, MMPROJ_FILENAME]) {
    const file = new File(dir, filename);
    if (file.exists) {
      receivedSum += file.size;
      totalSum += file.size;
      continue;
    }

    const partFile = new File(`${file.uri}.part`);
    const expectedSize = await getExpectedFileSize(
      `${MODEL_BASE_URL}/${filename}`,
    );
    if (!expectedSize) continue;

    receivedSum += partFile.exists ? partFile.size : 0;
    totalSum += expectedSize;
  }

  return totalSum > 0 ? receivedSum / totalSum : 0;
};

export type ModelFileCheck = {
  filename: string;
  exists: boolean;
  localSize: number;
  expectedSize: number | null;
  isComplete: boolean;
};

const getExpectedFileSize = async (url: string): Promise<number | null> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    const size = Number(response.headers.get("content-length"));
    return response.ok && size > 0 ? size : null;
  } catch {
    return null;
  }
};

const checkFile = async (
  file: File,
  url: string,
  filename: string,
): Promise<ModelFileCheck> => {
  const expectedSize = await getExpectedFileSize(url);
  const localSize = file.exists ? file.size : 0;
  return {
    filename,
    exists: file.exists,
    localSize,
    expectedSize,
    isComplete:
      file.exists && expectedSize !== null && localSize === expectedSize,
  };
};

// Manual integrity check (a network round-trip via HEAD requests) —
// compares each cached file's size against the real size reported by the
// server, to catch a truncated/corrupt file that `isModelDownloaded`'s
// plain existence check wouldn't.
export const verifyModelFiles = async (): Promise<{
  model: ModelFileCheck;
  mmproj: ModelFileCheck;
}> => {
  const dir = await getModelsDir();
  const [model, mmproj] = await Promise.all([
    checkFile(
      new File(dir, MODEL_FILENAME),
      `${MODEL_BASE_URL}/${MODEL_FILENAME}`,
      MODEL_FILENAME,
    ),
    checkFile(
      new File(dir, MMPROJ_FILENAME),
      `${MODEL_BASE_URL}/${MMPROJ_FILENAME}`,
      MMPROJ_FILENAME,
    ),
  ]);

  return { model, mmproj };
};

export const isModelActive = (): boolean => llamaContext !== null;

export const activateModel = async (): Promise<void> => {
  if (llamaContext) return;

  if (!(await isModelDownloaded())) {
    throw new Error("Model files are not downloaded yet");
  }

  const dir = await getModelsDir();
  const modelFile = new File(dir, MODEL_FILENAME);
  const mmprojFile = new File(dir, MMPROJ_FILENAME);

  const context = await initLlama({
    model: modelFile.uri,
    n_ctx: 512,
    n_gpu_layers: 0, // Q8_0 is not supported by Android's OpenCL backend (only Q4_0/Q6_K)
    ctx_shift: false, // required for multimodal models
  });

  await context.initMultimodal({
    path: mmprojFile.uri,
    use_gpu: true,
  });

  llamaContext = context;
};

export const deactivateModel = async (): Promise<void> => {
  if (llamaContext) {
    await llamaContext.release();
    llamaContext = null;
  }
};

export const askQuestion = async (question: string): Promise<string> => {
  if (!llamaContext) {
    throw new Error("Model is not activated yet");
  }

  const result = await llamaContext.completion({
    messages: [{ role: "user", content: question }],
    n_predict: 256,
  });

  return result.text;
};

export const describeImage = async (imageUri: string): Promise<string> => {
  if (!llamaContext) {
    throw new Error("Model is not activated yet");
  }

  const result = await llamaContext.completion({
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Describe this image in detail." },
          { type: "image_url", image_url: { url: imageUri } },
        ],
      },
    ],
    n_predict: 256,
  });

  return result.text;
};
