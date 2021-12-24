const webpack = require("webpack");
const bmpJson = require("./bmp-json");

module.exports = (options, loaderContext, content) => {
  return new Promise((resolve, reject) => {
    const compiler = webpack({
      mode: loaderContext.mode,
      entry: loaderContext.resourcePath,
      module: {
        rules: [
          {
            test: /\.png$/,
            type: "asset/inline",
            generator: { dataUrl: bmpJson },
          },
        ],
      },
      target: "es5",
      externals: {
        adc: "commonjs adc",
        at: "commonjs at",
        button: "commonjs button",
        dgram: "commonjs dgram",
        events: "commonjs events",
        gpio: "commonjs gpio",
        graphics: "commonjs graphics",
        http: "commonjs http",
        i2c: "commonjs i2c",
        led: "commonjs led",
        net: "commonjs net",
        pwm: "commonjs pwm",
        rp2: "commonjs rp2",
        spi: "commonjs spi",
        stream: "commonjs stream",
        uart: "commonjs uart",
        url: "commonjs url",
        wifi: "commonjs wifi",
      },
      output: {
        chunkFormat: "commonjs",
      },
      devtool: false,
    });

    let source;
    compiler.hooks.shouldEmit.tap("build-loader", (compilation) => {
      source = compilation.getAsset("main.js").source.source();
      return false;
    });

    compiler.run((err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }
        reject(err);
        return;
      }

      const info = stats.toJson();

      if (stats.hasErrors()) {
        console.error(info.errors);
      }

      if (stats.hasWarnings()) {
        console.warn(info.warnings);
      }

      resolve({
        cacheable: true,
        code: source,
        dependencies: [loaderContext.resourcePath],
      });
    });
  });
};
