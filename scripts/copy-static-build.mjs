import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { resolve } from "node:path"

const outDir = resolve("out")
const distDir = resolve("dist")

if (!existsSync(outDir)) {
  console.warn("skip dist copy: out directory was not generated")
  process.exit(0)
}

rmSync(distDir, { force: true, recursive: true })
mkdirSync(distDir, { recursive: true })
cpSync(outDir, distDir, { recursive: true })

console.log("copied static export from out/ to dist/")
