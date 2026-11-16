// Renders sample files with the theme through VS Code's TextMate engine.
// Prints one line per token (file, line, column, text, colour, font style, scopes)
// and writes an HTML page showing the samples as VS Code would colour them.
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import oniguruma from "vscode-oniguruma";
import textmate from "vscode-textmate";

const { values: flags, positionals: samples } = parseArgs({
  options: {
    theme: { type: "string" },
    grammars: { type: "string" },
    html: { type: "string" },
  },
  allowPositionals: true,
});

const languages = {
  ".go": "source.go",
  ".js": "source.js",
  ".json": "source.json",
  ".yaml": "source.yaml",
  ".yml": "source.yaml",
};

// VS Code's dark defaults when a theme sets no editorBracketHighlight colours.
const defaultBracketColours = ["#ffd700", "#da70d6", "#179fff"];

const wasm = await readFile(path.join("node_modules", "vscode-oniguruma", "release", "onig.wasm"));
await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));

const grammarFiles = new Map();
for (const name of await readdir(flags.grammars)) {
  if (!name.endsWith(".json")) {
    continue;
  }
  const file = path.join(flags.grammars, name);
  grammarFiles.set(JSON.parse(await readFile(file, "utf8")).scopeName, file);
}

const registry = new textmate.Registry({
  onigLib: Promise.resolve({
    createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
    createOnigString: (s) => new oniguruma.OnigString(s),
  }),
  loadGrammar: async (scopeName) => {
    const file = grammarFiles.get(scopeName);
    return file ? textmate.parseRawGrammar(await readFile(file, "utf8"), file) : null;
  },
});

const theme = JSON.parse(await readFile(flags.theme, "utf8"));
const foreground = theme.colors["editor.foreground"];
const background = theme.colors["editor.background"];
registry.setTheme({ settings: [{ settings: { foreground, background } }, ...theme.tokenColors] });
const colourMap = registry.getColorMap();
const bracketColours = [1, 2, 3, 4, 5, 6]
  .map((n) => theme.colors[`editorBracketHighlight.foreground${n}`])
  .filter(Boolean);

const fontStyles = { 1: "italic", 2: "bold", 4: "underline", 8: "strikethrough" };

function style(metadata) {
  const colour = colourMap[(metadata >>> 15) & 0x1ff].toLowerCase();
  const bits = (metadata >>> 11) & 0xf;
  const font = Object.entries(fontStyles)
    .filter(([bit]) => bits & Number(bit))
    .map(([, name]) => name);
  return { colour, font };
}

function metadataAt(encoded, index) {
  let metadata = encoded[1];
  for (let i = 0; i < encoded.length; i += 2) {
    if (encoded[i] > index) {
      break;
    }
    metadata = encoded[i + 1];
  }
  return metadata;
}

const escapeHTML = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const panes = [];
const out = [];
for (const sample of samples) {
  const scopeName = languages[path.extname(sample)];
  const grammar = scopeName && (await registry.loadGrammar(scopeName));
  if (!grammar) {
    throw new Error(`no grammar for ${sample}`);
  }
  const lines = (await readFile(sample, "utf8")).replace(/\n$/, "").split("\n");
  let stack = textmate.INITIAL;
  let depth = 0;
  const rendered = [];
  for (const [n, line] of lines.entries()) {
    const scoped = grammar.tokenizeLine(line, stack);
    const encoded = grammar.tokenizeLine2(line, stack).tokens;
    stack = scoped.ruleStack;
    let html = "";
    for (const token of scoped.tokens) {
      const text = line.slice(token.startIndex, token.endIndex);
      const { colour, font } = style(metadataAt(encoded, token.startIndex));
      const scopes = token.scopes.slice(1);
      if (text.trim()) {
        const column = token.startIndex + text.length - text.trimStart().length + 1;
        out.push([path.basename(sample), n + 1, column, text.trim(), colour, font.join(",") || "-", scopes.join(" ")].join("\t"));
      }
      // Bracket pair colorization, as VS Code applies it on top of the grammar.
      let bracket = "";
      if (/^[()[\]{}]$/.test(text.trim()) && !scopes.some((s) => /^(string|comment)/.test(s))) {
        const opening = "([{".includes(text.trim());
        const level = opening ? depth++ : --depth;
        const colours = bracketColours.length ? bracketColours : defaultBracketColours;
        bracket = ` data-bracket="${colours[((level % colours.length) + colours.length) % colours.length]}"`;
      }
      const css = [`color:${colour}`, font.includes("italic") && "font-style:italic", font.includes("bold") && "font-weight:bold"]
        .filter(Boolean)
        .join(";");
      html += `<span style="${css}"${bracket} title="${scopes.map(escapeHTML).join("&#10;")}">${escapeHTML(text)}</span>`;
    }
    rendered.push(`<div class="ln"><span class="nr">${n + 1}</span><span>${html || " "}</span></div>`);
  }
  panes.push(`<section><h2>${escapeHTML(path.basename(sample))}</h2><div class="buf">${rendered.join("")}</div></section>`);
}

console.log(out.join("\n"));

if (flags.html) {
  await writeFile(
    flags.html,
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Emerald Ocean in VS Code</title>
<style>
body { background:#050807; color:${foreground}; font:13.5px/1.6 "JetBrains Mono","SF Mono",Menlo,monospace; margin:0; padding:1.5rem; }
main { display:grid; grid-template-columns:repeat(auto-fit, minmax(560px, 1fr)); gap:1rem; }
section { background:${background}; border-radius:8px; overflow:hidden; }
h2 { font-size:12.5px; font-weight:normal; margin:0; padding:.3rem .9rem; background:${theme.colors["editorGroupHeader.tabsBackground"] ?? background}; }
.buf { white-space:pre; tab-size:4; overflow-x:auto; padding:.25rem 0; }
.ln { display:flex; } .nr { width:3.2em; text-align:right; padding-right:1em; color:${theme.colors["editorLineNumber.foreground"] ?? foreground}; flex:none; }
label { display:block; margin-bottom:1rem; font-size:12px; }
</style>
</head>
<body>
<label><input type="checkbox" id="pairs"> bracket pair colorization (on by default in VS Code)</label>
<main>${panes.join("")}</main>
<script>
document.getElementById("pairs").addEventListener("change", (e) => {
  for (const el of document.querySelectorAll("[data-bracket]")) {
    el.dataset.grammar ??= el.style.color;
    el.style.color = e.target.checked ? el.dataset.bracket : el.dataset.grammar;
  }
});
</script>
</body>
</html>
`,
  );
}
