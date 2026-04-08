#!/usr/bin/env node
/**
 * French Food Website Database — CLI
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   node scrape-france.js                     # both: boulangeries + salons de thé
 *   node scrape-france.js --boulangeries       # boulangeries only
 *   node scrape-france.js --salons             # salons de thé / brunch only
 *   node scrape-france.js --count 50           # change target count (default 100)
 */

import fs   from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = path.join(__dirname, "output");

function parseArgs() {
  const args = process.argv.slice(2);
  const has  = f => args.includes(f);
  const get  = f => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null; };
  return {
    boulangeries: has("--boulangeries") || !has("--salons"),
    salons:       has("--salons")       || !has("--boulangeries"),
    count:        parseInt(get("--count") || "100", 10),
  };
}

async function main() {
  const opts = parseArgs();

  console.log("\n╔══════════════════════════════════════════════╗");
  console.log("║   French Food Website Database Builder       ║");
  console.log("╠══════════════════════════════════════════════╣");
  console.log(`║  Boulangeries France : ${opts.boulangeries ? "✓" : "✗"}                    ║`);
  console.log(`║  Salons de thé Paris : ${opts.salons ? "✓" : "✗"}                    ║`);
  console.log(`║  Target count each   : ${String(opts.count).padEnd(27)}║`);
  console.log("╚══════════════════════════════════════════════╝");

  const { scrapeBoulangeries, scrapeSalonsDeTe } = await import("./src/scrapers/french-food.js");

  const results = {};

  if (opts.boulangeries) results.boulangeries = await scrapeBoulangeries(opts.count);
  if (opts.salons)       results.salons       = await scrapeSalonsDeTe(opts.count);

  // Summary
  console.log("\n" + "═".repeat(52));
  console.log("  FINAL SUMMARY");
  console.log("═".repeat(52));

  if (results.boulangeries) {
    const b = results.boulangeries;
    const cms = {};
    b.forEach(x => { if (x.cms) cms[x.cms] = (cms[x.cms]||0)+1; });
    console.log(`\n  🥖 Boulangeries France`);
    console.log(`     Total     : ${b.length}`);
    console.log(`     Website   : ${b.filter(x=>x.website).length}`);
    console.log(`     Email     : ${b.filter(x=>x.emails?.length).length}`);
    console.log(`     CMS       : ${Object.entries(cms).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}(${v})`).join(", ")}`);
  }

  if (results.salons) {
    const s = results.salons;
    const cms = {};
    s.forEach(x => { if (x.cms) cms[x.cms] = (cms[x.cms]||0)+1; });
    console.log(`\n  ☕ Salons de thé / Brunch Paris`);
    console.log(`     Total     : ${s.length}`);
    console.log(`     Website   : ${s.filter(x=>x.website).length}`);
    console.log(`     Email     : ${s.filter(x=>x.emails?.length).length}`);
    console.log(`     CMS       : ${Object.entries(cms).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k}(${v})`).join(", ")}`);
  }

  console.log(`\n  📁 Files saved to: ${OUT_DIR}`);
  console.log("     boulangeries_france.csv / .json");
  console.log("     salons_de_the_paris.csv / .json");
  console.log("\n  ▶ Next: node scrape-france-websites.js --resume\n");
}

main().catch(err => {
  console.error("\nFatal:", err.message);
  process.exit(1);
});
