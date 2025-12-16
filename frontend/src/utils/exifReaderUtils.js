import * as ExifReaderNamespace from "exifreader";
import { FileType, getExtension } from "@/utils/fileTypes";

const ExifReader = ExifReaderNamespace?.default || ExifReaderNamespace;

const DEFAULT_IMAGE_EXTS = new Set([
  "jpg",
  "jpeg",
  "tif",
  "tiff",
  "heic",
  "heif",
  "avif",
  "webp",
  "png",
  "gif",
  "bmp",
  "ico",
]);

export const DEFAULT_EXIF_FIELDS = [
  {
    key: "dateTimeOriginal",
    label: "拍摄时间",
    tags: ["DateTimeOriginal", "DateTimeDigitized", "DateTime"],
  },
  {
    key: "camera",
    label: "相机",
    tags: ["Make", "Model"],
    combine: (values) => values.filter(Boolean).join(" ").trim(),
  },
  {
    key: "lensModel",
    label: "镜头",
    tags: ["LensModel"],
  },
  {
    key: "focalLength",
    label: "焦距",
    tags: ["FocalLength"],
    format: (v) => formatFocalLength(v),
  },
  {
    key: "aperture",
    label: "光圈",
    tags: ["FNumber"],
    format: (v) => formatAperture(v),
  },
  {
    key: "shutter",
    label: "快门",
    tags: ["ExposureTime"],
    format: (v) => formatExposure(v),
  },
  {
    key: "iso",
    label: "ISO",
    tags: ["ISOSpeedRatings", "PhotographicSensitivity", "ISO"],
    format: (v) => formatISO(v),
  },
];

export function isImageLikeForExif(item) {
  if (!item) return false;
  if (item?.isDirectory) return false;

  if (item?.type === FileType.IMAGE) return true;

  const mimetype = String(item?.mimetype || "").toLowerCase();
  if (mimetype.startsWith("image/")) {
    if (mimetype === "image/svg+xml") return false;
    return true;
  }

  const filename = item?.filename || item?.name || item?.path || "";
  const ext = getExtension(filename);
  if (!ext) return false;
  if (ext === "svg") return false;
  return DEFAULT_IMAGE_EXTS.has(ext);
}

export function loadExifTagsFromArrayBuffer(arrayBuffer) {
  if (!arrayBuffer) return {};
  if (typeof ExifReader?.load !== "function") return {};
  return ExifReader.load(arrayBuffer) || {};
}

export async function loadExifTagsFromArrayBufferAsync(arrayBuffer) {
  if (!arrayBuffer) return {};
  if (typeof ExifReader?.load !== "function") return {};

  try {
    const maybePromise = ExifReader.load(arrayBuffer, { async: true });
    const tags = typeof maybePromise?.then === "function" ? await maybePromise : maybePromise;
    return tags || {};
  } catch {
    // 若环境不支持异步解析，回退同步解析
    try {
      return ExifReader.load(arrayBuffer) || {};
    } catch {
      return {};
    }
  }
}

export function buildExifRows(tags, fields = DEFAULT_EXIF_FIELDS) {
  const rows = [];
  const safeFields = Array.isArray(fields) ? fields : [];

  for (const field of safeFields) {
    if (!field?.key || !field?.label) continue;

    const hasResolver = typeof field.resolve === "function";
    const tagNames = Array.isArray(field?.tags) ? field.tags : [];
    if (!hasResolver && tagNames.length === 0) continue;

    if (hasResolver) {
      const resolved = String(field.resolve(tags) || "").trim();
      if (resolved) {
        rows.push({ key: field.key, label: field.label, value: resolved });
      }
      continue;
    }

    const values = tagNames.map((name) => tagToText(tags?.[name])).filter(Boolean);
    if (values.length === 0) continue;

    let valueText = values[0];
    if (typeof field.combine === "function") {
      valueText = String(field.combine(values) || "").trim();
    }
    if (typeof field.format === "function") {
      valueText = String(field.format(valueText) || "").trim();
    }

    if (!valueText) continue;
    rows.push({ key: field.key, label: field.label, value: valueText });
  }

  return rows;
}

export async function loadExifRowsFromArrayBuffer(arrayBuffer, fields = DEFAULT_EXIF_FIELDS) {
  const tags = await loadExifTagsFromArrayBufferAsync(arrayBuffer);
  return buildExifRows(tags, fields);
}

function tagToText(tag) {
  if (!tag) return "";
  if (typeof tag === "string") return tag;
  if (typeof tag?.description === "string" && tag.description) return tag.description;

  const value = tag?.value;
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().replace("T", " ").replace(".000Z", "Z");
  if (Array.isArray(value)) return value.filter((v) => v != null && String(v).trim() !== "").join(", ");
  return String(value);
}

function formatAperture(raw) {
  const txt = String(raw || "").trim();
  if (!txt) return "";
  if (txt.startsWith("f/") || txt.startsWith("F/")) return `ƒ/${txt.slice(2)}`;
  if (txt.startsWith("ƒ/")) return txt;
  return `ƒ/${txt}`;
}

function formatExposure(raw) {
  const txt = String(raw || "").trim();
  if (!txt) return "";
  if (txt.includes("/")) return `${txt}s`;
  if (txt.endsWith("s")) return txt;

  const n = Number(txt);
  if (Number.isFinite(n)) {
    if (n >= 1) return `${n}s`;
    const denom = Math.round(1 / n);
    if (denom > 0) return `1/${denom}s`;
  }
  return txt;
}

function formatFocalLength(raw) {
  const txt = String(raw || "").trim();
  if (!txt) return "";
  if (txt.toLowerCase().includes("mm")) return txt;
  return `${txt}mm`;
}

function formatISO(raw) {
  const txt = String(raw || "").trim();
  if (!txt) return "";
  if (txt.toUpperCase().startsWith("ISO")) return txt;
  return `ISO ${txt}`;
}
