import {
  cpSync,
  existsSync,
  mkdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { resolve } from "node:path"

const distDir = resolve("dist")
const distServerDir = resolve("dist/server")
const standaloneDir = resolve(".next/standalone")
const staticDir = resolve(".next/static")
const publicDir = resolve("public")
const hostingFile = resolve(".openai/hosting.json")

if (!existsSync(standaloneDir)) {
  console.warn("skip dist packaging: .next/standalone directory was not generated")
  process.exit(0)
}

rmSync(distDir, { force: true, recursive: true })
mkdirSync(distServerDir, { recursive: true })
cpSync(standaloneDir, distServerDir, { recursive: true, dereference: true })

const serverEntry = resolve("dist/server/server.js")
if (existsSync(serverEntry)) {
  renameSync(serverEntry, resolve("dist/server/server.cjs"))
  writeFileSync(
    resolve("dist/server/index.js"),
    [
      'import { existsSync } from "node:fs"',
      'import { resolve } from "node:path"',
      'import { createRequire } from "node:module"',
      "",
      "const cwd = process.cwd()",
      "const candidates = [",
      "  resolve(cwd, 'dist', 'server', 'server.cjs'),",
      "  resolve(cwd, 'server.cjs'),",
      "]",
      "const serverPath = candidates.find((candidate) => existsSync(candidate))",
      "",
      "if (!serverPath) {",
      '  throw new Error(`Unable to locate server.cjs from ${cwd}`)',
      "}",
      "",
      "const require = createRequire(serverPath)",
      "require(serverPath)",
      "",
    ].join("\n"),
    "utf8"
  )
}

if (existsSync(staticDir)) {
  mkdirSync(resolve("dist/server/.next"), { recursive: true })
  cpSync(staticDir, resolve("dist/server/.next/static"), {
    recursive: true,
    dereference: true,
  })
}

if (existsSync(publicDir)) {
  cpSync(publicDir, resolve("dist/server/public"), {
    recursive: true,
    dereference: true,
  })
}

if (existsSync(hostingFile)) {
  mkdirSync(resolve("dist/.openai"), { recursive: true })
  cpSync(hostingFile, resolve("dist/.openai/hosting.json"))
}

console.log("packaged standalone Next.js build into dist/")
