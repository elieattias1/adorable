#!/usr/bin/env node
/**
 * French Food — HTML & Screenshot Scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads boulangeries_france.json / salons_de_the_paris.json and for every
 * business with a website captures:
 *   • Desktop screenshot (1440×900)
 *   • Mobile screenshot  (390×844)
 *   • Cleaned HTML       (scripts stripped)
 *   • Design metadata    (fonts, colours, CMS, features)
 *
 * Usage:
 *   node scrape-france-websites.js                   # both categories
 *   node scrape-france-websites.js --boulangeries    # boulangeries only
 *   node scrape-france-websites.js --salons          # salons only
 *   node scrape-france-websites.js --limit 10        # cap at N sites
 *   node scrape-france-websites.js --concurrency 3   # parallel tabs
 *   node scrape-france-websites.js --resume          # skip already done
 */

import { chromium } from "playwright";
import fs            from "fs/promises";
import path          from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const VIEWPORT_DESKTOP = { width: 1440, height: 900 };
const VIEWPORT_MOBILE  = { width: 390,  height: 844 };
const TIMEOUT          = 28_000;
const UA_DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const UA_MOBILE  = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

const COOKIE_SELECTORS = [
  "#didomi-notice-agree-button", ".didomi-continue-without-agreeing",
  "[id*='accept-all']", "[id*='acceptAll']", "button[class*='accept']",
  "#onetrust-accept-btn-handler", ".cc-btn.cc-allow",
  "button:has-text('Tout accepter')", "button:has-text('Accepter')",
  "button:has-text('J\\'accepte')", "button:has-text('OK')",
];

function slugify(name, url) {
  if (name) return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50).replace(/-+$/, "");
  try { return new URL(url).hostname.replace("www.", "").replace(/\./g, "-"); } catch { return `site-${Date.now()}`; }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseCSV(content) {
  const lines   = content.split("\n").filter(l => l.trim());
  const headers = parseCSVRow(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVRow(line);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (values[i] || "").trim()]));
  }).filter(row => Object.values(row).some(v => v));
}

function parseCSVRow(line) {
  const result = []; let current = ""; let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i+1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (line[i] === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += line[i]; }
  }
  result.push(current);
  return result;
}

function cleanHTML(raw) {
  return raw
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "<script>[removed]</script>")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi,   "<style>[removed]</style>")
    .replace(/<svg[\s\S]*?<\/svg>/gi,                  "<svg>[removed]</svg>")
    .replace(/ style="[^"]*"/g, "")
    .replace(/\n\s*\n/g, "\n").trim();
}

async function extractMeta(page) {
  return page.evaluate(() => {
    const fonts = new Set();
    document.querySelectorAll("*").forEach(el => {
      const f = getComputedStyle(el).fontFamily.split(",")[0].replace(/['"]/g,"").trim();
      if (f) fonts.add(f);
    });

    const bgMap = {};
    document.querySelectorAll("*").forEach(el => {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)") bgMap[bg] = (bgMap[bg]||0)+1;
    });
    const topBg = Object.entries(bgMap).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([c])=>c);

    const navLinks = Array.from(document.querySelectorAll("nav a, header a"))
      .map(a => a.textContent.trim()).filter(Boolean).slice(0, 10);

    const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
      .map(h => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 100) })).slice(0, 8);

    const bodyText = document.body?.innerText || "";
    const html     = document.documentElement.outerHTML;

    const cms = html.includes("wp-content")     ? "WordPress"
              : html.includes("wix.com")||html.includes("_wix") ? "Wix"
              : html.includes("squarespace")    ? "Squarespace"
              : html.includes("webflow")        ? "Webflow"
              : html.includes("shopify")        ? "Shopify"
              : html.includes("jimdo")          ? "Jimdo"
              : html.includes("prestashop")     ? "PrestaShop"
              : "Custom";

    return {
      title:           document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.content || "",
      ogImage:         document.querySelector('meta[property="og:image"]')?.content || "",
      fonts:           [...fonts].slice(0, 8),
      backgroundColors: topBg,
      navLinks, headings, cms,
      imgCount: document.querySelectorAll("img, [style*='background-image']").length,
      features: {
        hasReservation:  /réserv|booking|réserver|reserver|table/i.test(bodyText),
        hasDelivery:     /livraison|delivery|uber eats|deliveroo|just eat/i.test(bodyText),
        hasOnlineOrder:  /commander|order online|commande en ligne/i.test(bodyText),
        hasOpeningHours: /lundi|mardi|mercredi|horaires|ouvert/i.test(bodyText),
        hasMenu:         /carte|menu|nos pains|nos viennoiseries|spécialités/i.test(bodyText),
        hasInstagram:    !!document.querySelector("a[href*='instagram.com']"),
      },
    };
  });
}

async function scrapeBusiness(business, outDir, browser) {
  const url  = business.website || business.Website;
  const name = business.name    || business.Name || "";
  const slug = slugify(name, url);

  const result = {
    slug, name, url,
    address:  business.address  || business.Address  || "",
    phone:    business.phone    || business.Phone     || "",
    category: business.category || business.Category || "",
    googleMapsUrl: business.googleMapsUrl || business["Google Maps"] || "",
    scrapedAt: null, status: "pending", error: null,
    screenshotDesktop: null, screenshotMobile: null,
    htmlFile: null, metadataFile: null, meta: null,
  };

  const ctx  = await browser.newContext({ viewport: VIEWPORT_DESKTOP, userAgent: UA_DESKTOP, locale: "fr-FR", timezoneId: "Europe/Paris" });
  const page = await ctx.newPage();
  await page.route("**/*.{mp4,webm,woff2,ttf,eot,otf,gif}", r => r.abort());

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
    await page.waitForTimeout(2200);

    for (const sel of COOKIE_SELECTORS) {
      try { await page.click(sel, { timeout: 800 }); await sleep(400); break; } catch {}
    }
    await page.waitForTimeout(600);

    const desktopPath = path.join(outDir, "screenshots", `${slug}-desktop.png`);
    await page.screenshot({ path: desktopPath, fullPage: false, type: "png" });
    result.screenshotDesktop = `screenshots/${slug}-desktop.png`;

    const fullPath = path.join(outDir, "screenshots", `${slug}-full.png`);
    await page.screenshot({ path: fullPath, fullPage: true, type: "png" });

    const rawHTML   = await page.content();
    const htmlPath  = path.join(outDir, "html", `${slug}.html`);
    await fs.writeFile(htmlPath, cleanHTML(rawHTML), "utf-8");
    result.htmlFile = `html/${slug}.html`;

    result.meta = await extractMeta(page);
    await ctx.close();

    // Mobile
    const mCtx  = await browser.newContext({ viewport: VIEWPORT_MOBILE, userAgent: UA_MOBILE, locale: "fr-FR", isMobile: true, hasTouch: true });
    const mPage = await mCtx.newPage();
    await mPage.route("**/*.{mp4,webm,woff2,ttf,eot,otf,gif}", r => r.abort());
    try {
      await mPage.goto(url, { waitUntil: "domcontentloaded", timeout: TIMEOUT });
      await mPage.waitForTimeout(1800);
      for (const sel of COOKIE_SELECTORS) { try { await mPage.click(sel, { timeout: 600 }); break; } catch {} }
      const mobilePath = path.join(outDir, "screenshots", `${slug}-mobile.png`);
      await mPage.screenshot({ path: mobilePath, fullPage: false, type: "png" });
      result.screenshotMobile = `screenshots/${slug}-mobile.png`;
    } catch {}
    await mCtx.close();

    const metaPath = path.join(outDir, "metadata", `${slug}.json`);
    await fs.writeFile(metaPath, JSON.stringify({ ...result, meta: result.meta }, null, 2));
    result.metadataFile = `metadata/${slug}.json`;
    result.scrapedAt    = new Date().toISOString();
    result.status       = "success";

  } catch (err) {
    result.status = "error";
    result.error  = err.message;
    try { await ctx.close(); } catch {}
  }

  return result;
}

class Progress {
  constructor(total) { this.total = total; this.done = 0; this.success = 0; this.failed = 0; this.start = Date.now(); }
  record(r) { this.done++; r.status === "success" ? this.success++ : this.failed++; }
  eta() {
    if (!this.done) return "…";
    const s = Math.round((Date.now() - this.start) / this.done * (this.total - this.done) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s/60)}m${s%60}s`;
  }
  bar() {
    const pct = Math.round(this.done / this.total * 100);
    const fill = Math.floor(pct / 5);
    return `[${"█".repeat(fill)}${"░".repeat(20-fill)}] ${pct}%`;
  }
  print(r) {
    const icon = r.status === "success" ? "✓" : "✗";
    const cms  = r.meta?.cms ? ` [${r.meta.cms}]` : "";
    console.log(`${this.bar()} ${this.done}/${this.total} ETA:${this.eta()} ${icon} ${(r.name||"").slice(0,30)}${cms}`);
  }
}

async function loadBusinesses(filePath) {
  const content = await fs.readFile(filePath, "utf-8");
  const ext     = path.extname(filePath).toLowerCase();
  if (ext === ".json") { const d = JSON.parse(content); return Array.isArray(d) ? d : []; }
  if (ext === ".csv")  return parseCSV(content.replace(/^\uFEFF/, ""));
  throw new Error(`Unsupported: ${ext}`);
}

async function generateGallery(results, outDir, title) {
  const successful = results.filter(r => r.status === "success");
  const cmsColors  = { WordPress:"#0073AA", Wix:"#0C6EFC", Squarespace:"#000", Webflow:"#4353FF", Custom:"#666" };

  const cards = successful.map(r => {
    const cms   = r.meta?.cms || "Unknown";
    const cmsBg = cmsColors[cms] || "#888";
    const feats = Object.entries(r.meta?.features || {}).filter(([,v])=>v)
      .map(([k])=>k.replace("has","").replace(/([A-Z])/g," $1").trim().toLowerCase()).join(" · ");
    return `<div class="card" onclick="window.open('${r.url}','_blank')">
      <div class="img-wrap">
        <img src="${r.screenshotDesktop||""}" alt="${r.name}" onerror="this.style.display='none'">
        <div class="cms-badge" style="background:${cmsBg}">${cms}</div>
      </div>
      <div class="info">
        <div class="biz-name">${r.name||"—"}</div>
        <div class="biz-addr">${(r.address||"").slice(0,50)}</div>
        ${feats ? `<div class="features">${feats}</div>` : ""}
        <div class="actions">
          <a href="${r.htmlFile||"#"}" target="_blank">HTML</a>
          <a href="${r.screenshotDesktop||"#"}" target="_blank">Desktop</a>
          ${r.screenshotMobile?`<a href="${r.screenshotMobile}" target="_blank">Mobile</a>`:""}
          <a href="${r.url}" target="_blank">↗ Visit</a>
        </div>
      </div>
    </div>`;
  }).join("\n");

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>${title} — Gallery</title>
<style>
* { box-sizing:border-box; margin:0; padding:0 }
body { font-family:-apple-system,sans-serif; background:#f5f4f0; color:#1a1a1a }
.header { background:#1a1a1a; color:white; padding:24px 32px; display:flex; align-items:center; justify-content:space-between }
.header h1 { font-size:18px; font-weight:600 }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; padding:24px 32px }
.card { background:white; border-radius:10px; overflow:hidden; cursor:pointer; transition:transform .15s,box-shadow .15s; box-shadow:0 1px 3px rgba(0,0,0,.08) }
.card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,.12) }
.img-wrap { position:relative; height:180px; overflow:hidden; background:#f0efeb }
.img-wrap img { width:100%; height:100%; object-fit:cover; object-position:top }
.cms-badge { position:absolute; top:8px; right:8px; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:600; color:white }
.info { padding:12px 14px }
.biz-name { font-weight:600; font-size:14px; margin-bottom:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.biz-addr { font-size:12px; color:#888; margin-bottom:6px }
.features { font-size:11px; color:#aaa; margin-bottom:8px }
.actions { display:flex; gap:6px; flex-wrap:wrap }
.actions a { font-size:11px; padding:3px 8px; border:1px solid #e0e0e0; border-radius:4px; color:#555; text-decoration:none }
.actions a:hover { background:#f5f5f5 }
</style></head><body>
<div class="header"><h1>${title}</h1><span>${successful.length} sites</span></div>
<div class="grid">${cards}</div>
</body></html>`;

  await fs.writeFile(path.join(outDir, "gallery.html"), html, "utf-8");
}

async function main() {
  const args        = process.argv.slice(2);
  const has         = f => args.includes(f);
  const get         = f => { const i = args.indexOf(f); return i !== -1 ? args[i+1] : null; };
  const concurrency = parseInt(get("--concurrency") || "3", 10);
  const limit       = parseInt(get("--limit") || "0", 10);
  const resume      = has("--resume");
  const onlyBouls   = has("--boulangeries");
  const onlySalons  = has("--salons");
  const BASE_OUT    = path.join(__dirname, "output");

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("   French Food — HTML & Screenshot Scraper");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let batches = [];
  if (!onlySalons) batches.push({
    label: "Boulangeries France",
    inputFile: path.join(BASE_OUT, "boulangeries_france.json"),
    fallback:  path.join(BASE_OUT, "boulangeries_france.csv"),
    outDir:    path.join(BASE_OUT, "boulangeries"),
  });
  if (!onlyBouls) batches.push({
    label: "Salons de thé / Brunch Paris",
    inputFile: path.join(BASE_OUT, "salons_de_the_paris.json"),
    fallback:  path.join(BASE_OUT, "salons_de_the_paris.csv"),
    outDir:    path.join(BASE_OUT, "salons-scraped"),
  });

  for (const batch of batches) {
    console.log(`\n── ${batch.label} ${"─".repeat(Math.max(0, 48 - batch.label.length))}`);

    let inputFile = batch.inputFile;
    try { await fs.access(inputFile); } catch {
      if (batch.fallback) {
        try { await fs.access(batch.fallback); inputFile = batch.fallback; } catch {
          console.log(`  ✗  Input file not found. Run: node scrape-france.js first`);
          continue;
        }
      } else { console.log(`  ✗  File not found: ${inputFile}`); continue; }
    }

    const allBusinesses = await loadBusinesses(inputFile);
    const withWebsite   = allBusinesses.filter(b => {
      const w = b.website || b.Website || "";
      return w && w.startsWith("http");
    });
    console.log(`  Loaded: ${allBusinesses.length} | With website: ${withWebsite.length}`);

    const outDir = batch.outDir;
    await fs.mkdir(path.join(outDir, "screenshots"), { recursive: true });
    await fs.mkdir(path.join(outDir, "html"),        { recursive: true });
    await fs.mkdir(path.join(outDir, "metadata"),    { recursive: true });

    let queue = withWebsite;
    if (resume) {
      const done = new Set();
      try {
        const existing = await fs.readdir(path.join(outDir, "metadata"));
        existing.forEach(f => done.add(f.replace(".json", "")));
      } catch {}
      const before = queue.length;
      queue = queue.filter(b => !done.has(slugify(b.name || b.Name, b.website || b.Website)));
      if (before > queue.length) console.log(`  Resuming: skipping ${before - queue.length} already scraped`);
    }

    if (limit > 0) queue = queue.slice(0, limit);
    console.log(`  To scrape: ${queue.length} | Concurrency: ${concurrency}\n`);

    if (!queue.length) { console.log("  Nothing to scrape."); continue; }

    const browser  = await chromium.launch({ headless: true, args: ["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"] });
    const progress = new Progress(queue.length);
    const results  = [];
    let   idx      = 0;

    async function worker() {
      while (idx < queue.length) {
        const business = queue[idx++];
        const result   = await scrapeBusiness(business, outDir, browser);
        results.push(result);
        progress.record(result);
        progress.print(result);
        await sleep(500);
      }
    }

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    await browser.close();

    const summary = {
      label: batch.label, scrapedAt: new Date().toISOString(),
      total: results.length,
      success: results.filter(r=>r.status==="success").length,
      failed:  results.filter(r=>r.status==="error").length,
      cms: results.filter(r=>r.meta?.cms).reduce((acc,r)=>{ acc[r.meta.cms]=(acc[r.meta.cms]||0)+1; return acc; }, {}),
      sites: results,
    };

    await fs.writeFile(path.join(outDir, "scrape-results.json"), JSON.stringify(summary, null, 2));
    await generateGallery(results, outDir, batch.label);

    console.log(`\n  ✓ Done! ${summary.success}/${summary.total} succeeded`);
    console.log(`  CMS: ${Object.entries(summary.cms).sort((a,b)=>b[1]-a[1]).map(([c,n])=>`${c}:${n}`).join(", ")}`);
    console.log(`  Output: ${outDir}`);
    console.log(`  → Open gallery.html in browser to browse screenshots`);

    if (summary.failed > 0) {
      console.log(`\n  Failed (first 5):`);
      results.filter(r=>r.status==="error").slice(0,5).forEach(r=>{
        console.log(`    ✗ ${(r.name||"").slice(0,30).padEnd(30)} ${(r.error||"").slice(0,60)}`);
      });
      console.log(`  Tip: re-run with --resume to retry failures`);
    }
  }
}

main().catch(err => { console.error("Fatal:", err.message); process.exit(1); });
