export const MAX_DECOMPRESSED_BYTES = 16 * 1024 * 1024;

export function normalizeText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function decompress(
  bytes: Uint8Array,
  format: CompressionFormat,
): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream(format));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const result = await reader.read();
    if (result.done) break;

    totalLength += result.value.byteLength;
    if (totalLength > MAX_DECOMPRESSED_BYTES) {
      await reader.cancel();
      throw new Error("The document expands beyond the safe local size limit");
    }
    chunks.push(result.value);
  }

  const output = new Uint8Array(totalLength);
  let offset = 0;
  chunks.forEach((chunk) => {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return output;
}
