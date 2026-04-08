#!/usr/bin/env node
/**
 * Website Template Scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   node scrape.js                        # scrape all 64 sites (concurrency=3)
 *   node scrape.js --concurrency 5        # faster with more parallel tabs
 *   node scrape.js --industry "SaaS"      # only one industry
 *   node scrape.js --priority high        # only high-priority sites
 *   node scrape.js --ids 1,5,9,12         # specific IDs
 *   node scrape.js --resume               # skip already-scraped sites
 *   node scrape.js --limit 10             # stop after N sites (useful for testing)
 *   node scrape.js --out ./my-output      # custom output directory
 */

import { chromium } from "playwright";
import fs            from "fs/promises";
import path          from "path";
import { fileURLToPath } from "url";
import { sortedSites }   from "./src/sites.js";
import { scrapeSite, launchBrowser } from "./src/scraper.js";
import { ProgressTracker }           from "./src/tracker.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Parse CLI args ─────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const get  = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : null;
  };
  return {
    concurrency: parseInt(get("--concurrency") || "3", 10),
    industry:    get("--industry"),
    priority:    get("--priority"),
    ids:         get("--ids")?.split(",").map(Number),
    resume:      args.includes("--resume"),
    limit:       parseInt(get("--limit") || "0", 10),
    outDir:      get("--out") || path.join(__dirname, "output"),
    verbose:     args.includes("--verbose"),
  };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();

  // ensure output dirs exist
  await fs.mkdir(path.join(opts.outDir, "screenshots"), { recursive: true });
  await fs.mkdir(path.join(opts.outDir, "html"),        { recursive: true });
  await fs.mkdir(path.join(opts.outDir, "metadata"),    { recursive: true });

  // filter sites
  let queue = [...sortedSites];
  if (opts.ids)     queue = queue.filter((s) => opts.ids.includes(s.id));
  if (opts.industry) queue = queue.filter((s) => s.industry === opts.industry);
  if (opts.priority) queue = queue.filter((s) => s.priority === opts.priority);

  // resume: skip sites whose metadata already exists
  if (opts.resume) {
    const keep = [];
    for (const site of queue) {
      const slug = site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      try {
        await fs.access(path.join(opts.outDir, "metadata", `${slug}.json`));
        // file exists → already done, skip
      } catch {
        keep.push(site);
      }
    }
    const skipped = queue.length - keep.length;
    if (skipped > 0) console.log(`⏭  Resuming — skipping ${skipped} already-scraped sites`);
    queue = keep;
  }

  if (opts.limit > 0) queue = queue.slice(0, opts.limit);

  if (queue.length === 0) {
    console.log("No sites to scrape.");
    process.exit(0);
  }

  console.log(`\n🌐 Website Template Scraper`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Sites to scrape : ${queue.length}`);
  console.log(`  Concurrency     : ${opts.concurrency} parallel tabs`);
  console.log(`  Output dir      : ${opts.outDir}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const tracker = new ProgressTracker(queue.length, opts.outDir);
  const browser = await launchBrowser();

  // ── Concurrency pool ───────────────────────────────────────────────────
  let index = 0;

  async function worker() {
    while (index < queue.length) {
      const site = queue[index++];
      if (opts.verbose) console.log(`\n[${site.industry}] ${site.name}`);
      const result = await scrapeSite(site, opts.outDir, browser, { verbose: opts.verbose });
      tracker.record(result);
      tracker.print(result);
    }
  }

  const workers = Array.from({ length: opts.concurrency }, () => worker());
  await Promise.all(workers);

  await browser.close();

  // ── Save results ───────────────────────────────────────────────────────
  const { summaryPath, csvPath } = await tracker.saveResults();

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ Done in ${tracker.elapsed()}`);
  console.log(`   Succeeded : ${tracker.success}/${queue.length}`);
  console.log(`   Failed    : ${tracker.failed}/${queue.length}`);
  console.log(`   Results   : ${summaryPath}`);
  console.log(`   CSV       : ${csvPath}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (tracker.failed > 0) {
    console.log("Failed sites:");
    tracker.results
      .filter((r) => r.status === "error")
      .forEach((r) => console.log(`  ✗ ${r.name} — ${r.error}`));
    console.log('\nTip: re-run with --resume to retry only failed sites\n');
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
