const { decodeBlock } = require('uf2');

exports.loadUF2 = async function loadUF2(filename, rp2040) {
  const res = await fetch(filename);
  const buffer = await res.arrayBuffer();
  const fileData = new Uint8Array(buffer);

  let fileIndex = 0;
  var lastFlashAddress = 0;

  while (fileIndex < fileData.length) {
    const dataBlock = fileData.slice(fileIndex, fileIndex + 512);
    const block = decodeBlock(dataBlock);
    const { flashAddress, payload } = block;
    rp2040.flash.set(payload, flashAddress - 0x10000000);
    lastFlashAddress = flashAddress;
    fileIndex = fileIndex + 512;
  }
};
