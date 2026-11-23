/* Dependency-free test of synthetic fixtures and browser session behaviour. */
"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const page = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const match = page.match(/<script>([\s\S]*?)<\/script>/);
assert(match, "One inline script must exist.");
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) {
    nodes.set(id, {
      id, value: "", innerHTML: "", textContent: "", hidden: false,
      disabled: false, dataset: {},
      classList: { add() {}, remove() {}, toggle() {} },
      addEventListener() {}, appendChild() {}, remove() {}
    });
  }
  return nodes.get(id);
}
globalThis.location = { hash: "" };
globalThis.window = { scrollTo() {} };
globalThis.document = {
  getElementById: node,
  querySelectorAll() { return []; },
  createElement() { return node("test-dummy"); },
  body: { appendChild() {} }
};
const api = new Function(match[1] + "\nreturn { FIXTURES, createSamplePdf, generatedBytes, expectedHash, processBytes, collectRows, runAnalysis, state };")();
const { FIXTURES, createSamplePdf, generatedBytes, expectedHash, processBytes, collectRows, runAnalysis, state } = api;
function simulatedUpload(fixture) {
  const b = generatedBytes(fixture);
  return { size: b.length, async arrayBuffer() { return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); } };
}
function assertPdfOffsets(pdfBytes) {
  const pdf = Buffer.from(pdfBytes).toString("ascii");
  assert(pdf.startsWith("%PDF-1.4\n"));
  assert.match(pdf, /\/Count 100\b/);
  assert.equal((pdf.match(/\/Type \/Page\b/g) || []).length, 100);
  const offsets = Array.from(pdf.matchAll(/^(\d{10}) 00000 n /gm), m => Number(m[1]));
  assert.equal(offsets.length, 206, "100 pages require 200 page/stream objects, four fonts, pages tree and catalog");
  offsets.forEach((offset, idx) => {
    assert(pdf.slice(offset).startsWith(String(idx + 1) + " 0 obj\n"), "PDF object xref points to the right object");
  });
  const trailer = pdf.match(/startxref\n(\d+)\n%%EOF\n$/);
  assert(trailer, "Valid PDF trailer must exist");
  assert(pdf.slice(Number(trailer[1])).startsWith("xref\n"), "Cross-reference offset must be valid");
}
async function main() {
  assert.equal(FIXTURES.length, 3);
  const hashes = new Set();
  for (const fixture of FIXTURES) {
    const bytes = createSamplePdf(fixture);
    assert(bytes.length < 2 * 1024 * 1024);
    assertPdfOffsets(bytes);
    const printed = Buffer.from(bytes).toString("ascii");
    for (const item of fixture.items) {
      assert(printed.includes(item.id), "Page must visibly print a clause ID");
      assert(printed.includes(item.rev), "Page must visibly print a clause revision");
    }
    assert.match(printed, /\/BaseFont \/Helvetica-Bold/, "Business-style headings use bold typography");
    assert.match(printed, /SECTION [B-J]/, "PDF contains sectioned contract content");
    assert(printed.includes("TASK / RECORDS CROSSWALK"), "Controlled work-package tables are printed");
    assert(printed.includes("SYNTHETIC TRAINING SAMPLE"), "Each page carries a clear training label");
    assert(printed.includes("CONTRACT AWARD / PROCUREMENT INSTRUMENT"), "Cover resembles a procurement award");
    assert(printed.includes("TABLE OF CONTENTS"), "Contract has a section index");
    assert(printed.includes("AWARD INFORMATION"), "Contract has administrative terms");
    assert(printed.includes("QUALITY AND PERFORMANCE CONTROLS"), "Contract has substantive control narratives");
    const pageStreams = Array.from(printed.matchAll(/<< \/Length \d+ >>\nstream\n([\s\S]*?)endstream/g), m => m[1]);
    assert.equal(pageStreams.length, 100, "Every page has a distinct PDF content stream");
    assert(pageStreams.every(s => s.includes("SYNTHETIC TRAINING SAMPLE")), "Training disclosure on all pages");
    assert(pageStreams.every(s => s.length > 1400), "Every page has a substantial visible layout");
    for (const item of fixture.items) {
      assert(pageStreams[item.page - 1].includes(item.id), "Cited clause must appear on its exact physical page");
      const visibleText = Array.from(pageStreams[item.page - 1].matchAll(/\(([^)]*)\) Tj/g), m => m[1]).join(" ");
      assert(visibleText.includes(item.excerpt), "Exact synthetic evidence excerpt must be readable on cited page");
    }
    hashes.add(await expectedHash(fixture));
  }
  assert.equal(hashes.size, 3, "Every demo PDF has a distinct signature");
  await processBytes([simulatedUpload(FIXTURES[0])]);
  assert.equal(state.selected.size, 1);
  runAnalysis();
  assert.equal(state.rows.length, 3, "One fixture yields only its clauses");
  assert.equal(state.rows.reduce((sum, r) => sum + r.evidence.length, 0), 3);

  const modified = new Uint8Array(generatedBytes(FIXTURES[1]));
  modified[modified.length - 31] ^= 1;
  await processBytes([{ size: modified.length, async arrayBuffer() { return modified.buffer.slice(0); } }]);
  assert.equal(state.selected.size, 1, "Modified or unrelated PDFs must not be accepted");
  assert.equal(state.rows.length, 0, "Uploading again clears old results until re-analysis");

  state.selected.clear();
  await processBytes(FIXTURES.map(simulatedUpload));
  assert.equal(state.selected.size, 3);
  const rows = collectRows();
  assert.equal(rows.length, 7, "Repeated clause IDs are grouped");
  assert.equal(rows.reduce((sum, r) => sum + r.evidence.length, 0), 9);
  assert.equal(rows.find(r => r.id === "52.204-21").evidence.length, 2);
  runAnalysis();
  assert.equal(state.rows.length, 7);
  assert.equal(state.rows.every(r => r.evidence.every(e => e.page >= 1 && e.page <= 100)), true);
  console.log("PASS: 3 valid synthetic 100-page PDFs, exact-match rejection, 1-to-3 uploads and matrix evidence.");
}
main().catch(error => { console.error(error); process.exitCode = 1; });
