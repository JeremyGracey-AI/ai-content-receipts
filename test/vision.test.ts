import { describe, it, expect } from "vitest";
import sharp from "sharp";
import { prepareImageForVision } from "@/lib/vision";

describe("prepareImageForVision", () => {
  it("passes through vision-supported formats unchanged", async () => {
    const png = await sharp({
      create: { width: 2, height: 2, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .png()
      .toBuffer();

    const prepared = await prepareImageForVision(png, "image/png");
    expect(prepared).not.toBeNull();
    expect(prepared!.mediaType).toBe("image/png");
    expect(prepared!.data).toBe(png.toString("base64"));
  });

  it("transcodes TIFF to JPEG", async () => {
    const tiff = await sharp({
      create: { width: 4, height: 4, channels: 3, background: { r: 9, g: 9, b: 9 } },
    })
      .tiff()
      .toBuffer();

    const prepared = await prepareImageForVision(tiff, "image/tiff");
    expect(prepared).not.toBeNull();
    expect(prepared!.mediaType).toBe("image/jpeg");

    // The returned data really is JPEG.
    const meta = await sharp(Buffer.from(prepared!.data, "base64")).metadata();
    expect(meta.format).toBe("jpeg");
  });

  it("fails closed (null) when bytes cannot be decoded as the claimed type", async () => {
    const notHeic = Buffer.from("this is not a heic file");
    const prepared = await prepareImageForVision(notHeic, "image/heic");
    expect(prepared).toBeNull();
  });
});
