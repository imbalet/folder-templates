import esbuild from "esbuild";

const production = process.argv.includes("production");

await esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    external: ["obsidian"],
    format: "cjs",
    target: "es2018",
    sourcemap: production ? false : "inline",
    treeShaking: true,
    outfile: "main.js",
    minify: production,
});

console.log(
    production
        ? "Built production plugin."
        : "Built development plugin.",
);