import { readFile, stat } from "node:fs/promises";
import { dirname, extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const entryFiles = ["index.html", "admin.html"];
const errors = [];
const checkedJs = new Set();

async function exists(file) {
  try { return (await stat(file)).isFile(); } catch { return false; }
}

async function checkJs(file) {
  const absolute = normalize(file);
  if (checkedJs.has(absolute)) return;
  checkedJs.add(absolute);
  const source = await readFile(absolute, "utf8");
  const imports = [...source.matchAll(/(?:from\s+|import\s+)["']([^"']+)["']/g)].map((match) => match[1]);
  for (const target of imports.filter((value) => value.startsWith("."))) {
    const imported = resolve(dirname(absolute), target);
    if (!(await exists(imported))) errors.push(`Import ausente: ${relative(root, imported)}`);
    else if (extname(imported) === ".js") await checkJs(imported);
  }
  if (/123456789/.test(source)) errors.push(`Senha encontrada em ${relative(root, absolute)}`);
}

for (const entry of entryFiles) {
  const file = join(root, entry);
  const html = await readFile(file, "utf8");
  const ids = [...html.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length) errors.push(`IDs duplicados em ${entry}: ${[...new Set(duplicates)].join(", ")}`);

  const refs = [...html.matchAll(/(?:src|href)=["']([^"'#?]+)["']/g)].map((match) => match[1]);
  for (const ref of refs.filter((value) => !/^(?:https?:|mailto:|tel:)/.test(value))) {
    const target = resolve(root, ref);
    if (!(await exists(target))) errors.push(`Referência ausente em ${entry}: ${ref}`);
    else if (extname(target) === ".js") await checkJs(target);
  }
}

for (const sensitive of ["index.html", "admin.html", "js/site.js", "js/admin/firebase.js", "README.md"]) {
  const file = join(root, sensitive);
  if (await exists(file)) {
    const content = await readFile(file, "utf8");
    if (/123456789/.test(content)) errors.push(`Senha encontrada em ${sensitive}`);
  }
}

try {
  JSON.parse(await readFile(join(root, "vercel.json"), "utf8"));
} catch {
  errors.push("vercel.json ausente ou inválido.");
}

const vercelIgnore = await readFile(join(root, ".vercelignore"), "utf8");
for (const required of [
  "_backup-original-2026-10-29/",
  "site-agendamento-vt-main/",
  "adm-agendamento-vt-main/",
  "scripts/",
  "firebase/",
  ".env.*",
  "service-account*.json",
]) {
  if (!vercelIgnore.includes(required)) errors.push(`.vercelignore não exclui: ${required}`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verificação concluída: ${entryFiles.length} páginas, ${checkedJs.size} módulos e configuração Vercel válida.`);
}
