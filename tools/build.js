import esbuild from "esbuild";
import fs from "fs";

const code = fs.readFileSync(process.stdin.fd, "utf8");
const serve = process.argv.indexOf("--serve") !== -1;
const watch = process.argv.indexOf("--watch") !== -1;

/** @type esbuild.BuildOptions */
const buildOptions = {
  bundle: true,
  entryPoints: ["src/index.ts"],
  define: { code: JSON.stringify(code) },
  minify: process.env.NODE_ENV === "production",
  outfile: "dist/bundle.js",
  sourcemap: true,
  watch: watch,
};

if (serve) {
  esbuild
    .serve(
      {
        servedir: "dist",
      },
      buildOptions
    )
    .then((result) => {
      console.log(`Serving on port ${result.port}...`);
    });
} else {
  esbuild.build(buildOptions).catch(() => process.exit(1));
}
