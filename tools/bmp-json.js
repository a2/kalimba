const fs = require("fs");
const { PNG } = require("pngjs");

function encode(buffer) {
  const png = PNG.sync.read(buffer);
  const page = Math.floor((png.width + 7) / 8);
  const result = Buffer.alloc(png.height * page, 0);

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      if ((png.data[idx] + png.data[idx + 1] + png.data[idx + 2]) / 3 > 127) {
        result[page * y + Math.floor(x / 8)] |= 1 << (7 - (x % 8));
      }
    }
  }

  return {
    width: png.width,
    height: png.height,
    bpp: 1,
    data: result.toString("base64"),
  };
}

if (require.main === module) {
  const buffer = fs.readFileSync(process.argv[2]);
  const result = encode(buffer);
  console.log(JSON.stringify(result, null, 2));
}

module.exports = encode;
