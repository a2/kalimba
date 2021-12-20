import { RP2040 } from "rp2040js";
import { decodeBlock } from "uf2";

export default async function loadUF2(filename: string, rp2040: RP2040) {
  const buffer = await fetch(filename).then((res) => res.arrayBuffer());
  const fileData = new Uint8Array(buffer);

  let fileIndex = 0;
  while (fileIndex < fileData.length) {
    const dataBlock = fileData.slice(fileIndex, fileIndex + 512);
    const { flashAddress, payload } = decodeBlock(dataBlock);
    rp2040.flash.set(payload, flashAddress - 0x10000000);
    fileIndex += 512;
  }
}
