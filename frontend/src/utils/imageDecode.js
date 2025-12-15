/**
 * 图片预览解码工具（前端）
 *
 */

import { getExtension } from "@/utils/fileTypes.js";

/** @type {Promise<any>|null} */
let libheifModulePromise = null;

async function loadLibheif() {
  if (!libheifModulePromise) {
    libheifModulePromise = import("libheif-js/wasm-bundle");
  }
  const mod = await libheifModulePromise;
  return mod?.default ?? mod;
}

/**
 * 判断是否为 HEIC/HEIF 图片
 * @param {{ filename?: string; mimetype?: string }} input
 */
export function isHeifImage({ filename = "", mimetype = "" } = {}) {
  const ext = getExtension(filename);
  if (ext === "heic" || ext === "heif") return true;
  if (typeof mimetype === "string" && mimetype.toLowerCase().includes("heic")) return true;
  if (typeof mimetype === "string" && mimetype.toLowerCase().includes("heif")) return true;
  return false;
}

/**
 * 判断是否为 AVIF 图片
 * @param {{ filename?: string; mimetype?: string }} input
 */
export function isAvifImage({ filename = "", mimetype = "" } = {}) {
  const ext = getExtension(filename);
  if (ext === "avif") return true;
  if (typeof mimetype === "string" && mimetype.toLowerCase().includes("avif")) return true;
  return false;
}

/**
 * 是否应该尝试做“图片预览解码”
 * @param {{ filename?: string; mimetype?: string }} input
 */
export function shouldAttemptDecodeImagePreview({ filename = "", mimetype = "" } = {}) {
  // 仅对 HEIC/HEIF 做前端 wasm 解码：
  return isHeifImage({ filename, mimetype });
}

/**
 * @typedef {Object} DecodedPreview
 * @property {string} objectUrl
 * @property {number} width
 * @property {number} height
 */

/**
 * 将 HEIC/HEIF/AVIF 的预览 URL 解码为 PNG
 *
 * @param {{ url: string; filename?: string; mimetype?: string; signal?: AbortSignal }} input
 * @returns {Promise<DecodedPreview>}
 */
export async function decodeImagePreviewUrlToPngObjectUrl({ url, filename = "", mimetype = "", signal } = {}) {
  if (!url) {
    throw new Error("缺少图片预览 URL，无法解码");
  }

  if (isHeifImage({ filename, mimetype })) {
    return decodeHeifToPngObjectUrl({ url, signal });
  }

  if (isAvifImage({ filename, mimetype })) {
    throw new Error("当前前端解码器不支持 AVIF（请走浏览器原生渲染路径）");
  }

  throw new Error(`不支持的解码格式: ${filename || mimetype || "unknown"}`);
}

/**
 * 解码 HEIC/HEIF 为 PNG objectURL
 * - 使用 libheif-js/wasm-bundle
 *
 * @param {{ url: string; signal?: AbortSignal }} input
 * @returns {Promise<DecodedPreview>}
 */
export async function decodeHeifToPngObjectUrl({ url, signal } = {}) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`获取 HEIC/HEIF 数据失败: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();

  // 同时兼容 CJS/ESM 的 default interop
  const libheif = await loadLibheif();

  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(new Uint8Array(arrayBuffer));
  const image = Array.isArray(images) && images.length > 0 ? images[0] : null;
  if (!image) {
    throw new Error("HEIC/HEIF 解码失败：未获取到图像帧");
  }

  const width = image.get_width();
  const height = image.get_height();

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D 上下文不可用");
  }

  const imageData = ctx.createImageData(width, height);
  await new Promise((resolve, reject) => {
    image.display(imageData, (displayData) => {
      if (!displayData) {
        reject(new Error("HEIC/HEIF 处理失败（display 返回空）"));
        return;
      }
      resolve();
    });
  });

  ctx.putImageData(imageData, 0, 0);

  // 尽量释放底层资源（若 API 存在）
  try {
    if (typeof image.free === "function") image.free();
    if (typeof decoder.free === "function") decoder.free();
  } catch {
    // 忽略释放失败（不影响结果）
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) {
          reject(new Error("Canvas 转换 PNG 失败（toBlob 返回空）"));
          return;
        }
        resolve(b);
      },
      "image/png",
      1,
    );
  });

  const objectUrl = URL.createObjectURL(blob);
  return { objectUrl, width, height };
}

/**
 * 释放 objectURL（工具函数）
 * @param {string|null|undefined} objectUrl
 */
export function revokeObjectUrl(objectUrl) {
  if (!objectUrl) return;
  if (typeof objectUrl !== "string") return;
  if (!objectUrl.startsWith("blob:")) return;
  URL.revokeObjectURL(objectUrl);
}
