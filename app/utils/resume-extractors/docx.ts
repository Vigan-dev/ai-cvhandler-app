import { decompress, normalizeText } from "./shared.ts";

export async function extractDocxText(bytes: Uint8Array) {
  const entries = findZipEntries(bytes, (name) =>
    /^word\/(?:document|header\d+|footer\d+|footnotes|endnotes)\.xml$/.test(
      name,
    ),
  );
  if (!entries.some((entry) => entry.name === "word/document.xml")) {
    throw new Error("This DOCX file does not contain a readable document");
  }

  const parts = await Promise.all(
    entries.map(async (entry) => extractXmlText(await readZipEntry(entry))),
  );

  return normalizeText(parts.filter(Boolean).join("\n"));
}

async function readZipEntry(entry: ZipEntry) {
  const content =
    entry.compressionMethod === 0
      ? entry.data
      : entry.compressionMethod === 8
        ? await decompress(entry.data, "deflate-raw")
        : null;

  if (!content) {
    throw new Error("This DOCX compression format is not supported");
  }

  return new TextDecoder().decode(content);
}

function extractXmlText(xml: string) {
  if (typeof DOMParser === "undefined") {
    return extractXmlTextWithRegex(xml);
  }

  const document = new DOMParser().parseFromString(xml, "application/xml");
  const paragraphs = Array.from(document.getElementsByTagName("w:p"));
  const blocks = paragraphs.length
    ? paragraphs
    : Array.from(document.getElementsByTagName("w:tr"));

  return blocks
    .map((block) =>
      Array.from(block.getElementsByTagName("w:t"))
        .map((node) => node.textContent ?? "")
        .join(" "),
    )
    .filter(Boolean)
    .join("\n");
}

function extractXmlTextWithRegex(xml: string) {
  return Array.from(xml.matchAll(/<w:t[^>]*>(.*?)<\/w:t>/g), (match) =>
    decodeXmlEntities(match[1]),
  )
    .filter(Boolean)
    .join("\n");
}

function decodeXmlEntities(value: string) {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

type ZipEntry = {
  name: string;
  compressionMethod: number;
  data: Uint8Array;
};

function findZipEntries(
  bytes: Uint8Array,
  include: (name: string) => boolean,
) {
  if (bytes.byteLength < 22) return [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findSignature(view, 0x06054b50);
  if (eocdOffset < 0) return [];

  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let offset = centralDirectoryOffset;
  const matches: ZipEntry[] = [];

  for (let index = 0; index < totalEntries; index += 1) {
    if (offset < 0 || offset + 46 > view.byteLength) return matches;
    if (view.getUint32(offset, true) !== 0x02014b50) return matches;
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(
      bytes.slice(offset + 46, offset + 46 + nameLength),
    );

    if (include(name)) {
      if (localHeaderOffset < 0 || localHeaderOffset + 30 > view.byteLength) {
        offset += 46 + nameLength + extraLength + commentLength;
        continue;
      }
      if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
        offset += 46 + nameLength + extraLength + commentLength;
        continue;
      }
      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataOffset =
        localHeaderOffset + 30 + localNameLength + localExtraLength;
      if (
        dataOffset < 0 ||
        dataOffset + compressedSize > bytes.byteLength
      ) {
        offset += 46 + nameLength + extraLength + commentLength;
        continue;
      }
      matches.push({
        name,
        compressionMethod,
        data: bytes.slice(dataOffset, dataOffset + compressedSize),
      });
    }

    offset += 46 + nameLength + extraLength + commentLength;
  }

  return matches;
}

function findSignature(view: DataView, signature: number) {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === signature) return offset;
  }
  return -1;
}
