#!/usr/bin/env node
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

if (process.stdin.isTTY) {
  throw new Error("Expected data from stdin");
}

const code = fs.readFileSync(process.stdin.fd, "utf8");
const build = process.argv.indexOf("--build") !== -1;
const watch = process.argv.indexOf("--watch") !== -1;

const kalumaModules = [
  "adc",
  "at",
  "button",
  "dgram",
  "events",
  "gpio",
  "graphics",
  "http",
  "i2c",
  "led",
  "net",
  "pwm",
  "rp2",
  "spi",
  "stream",
  "uart",
  "url",
  "wifi",
];

const dist = path.join(__dirname, "..", "dist");

/** @type esbuild.BuildOptions */
const buildOptions = {
  bundle: true,
  entryPoints: [path.join(__dirname, "..", "src/browser.ts")],
  external: kalumaModules,
  define: { code: JSON.stringify(code) },
  minify: process.env.NODE_ENV === "production",
  outfile: path.join(dist, "js/bundle.js"),
  sourcemap: true,
  watch: watch,
};

if (build) {
  esbuild.build(buildOptions).catch(() => process.exit(1));
} else {
  esbuild.serve({ servedir: dist }, buildOptions).then((result) => {
    console.log(`Serving on port ${result.port}...`);
  });
}
