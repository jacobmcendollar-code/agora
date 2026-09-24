/** OG tags live in the document head. Stop reading once that window is in memory. */
export const HTML_SNIPPET_BYTES = 200_000;

export async function readResponseTextLimited(
  res: Response,
  maxBytes = HTML_SNIPPET_BYTES
): Promise<string> {
  if (!res.body) {
    const text = await res.text();
    return text.length > maxBytes ? text.slice(0, maxBytes) : text;
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  try {
    while (received < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const room = maxBytes - received;
      if (value.byteLength <= room) {
        chunks.push(value);
        received += value.byteLength;
      } else {
        chunks.push(value.subarray(0, room));
        received += room;
        break;
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const buf = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buf.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(buf);
}
