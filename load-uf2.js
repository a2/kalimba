const { decodeBlock } = require('uf2');

exports.loadUF2 = async function loadUF2(filename, rp2040) {
  const buffer = await fetch(filename).then(res => res.arrayBuffer());
  const fileData = new Uint8Array(buffer);

  let fileIndex = 0;
  while (fileIndex < fileData.length) {
    const dataBlock = fileData.slice(fileIndex, fileIndex + 512);
    const { flashAddress, payload } = decodeBlock(dataBlock);
    rp2040.flash.set(payload, flashAddress - 0x10000000);
    fileIndex += 512;
  }
};
