// Minimal type declaration for heic-convert (ships no types). We only use the
// default export to decode a HEIC/HEIF buffer to JPEG/PNG.
declare module "heic-convert" {
  interface HeicConvertOptions {
    buffer: ArrayBufferLike | Uint8Array;
    format: "JPEG" | "PNG";
    quality?: number;
  }
  function convert(options: HeicConvertOptions): Promise<ArrayBuffer>;
  export default convert;
}
