import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";

const VIEWPORT = { width: 1440, height: 900 };
const TIMEOUT   = 30_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// ── HTML cleaning ──────────────────────────────────────────────────────────
function cleanHTML(raw) {
  return raw
    // remove script content (keep tag so AI knows scripts existed)
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "<script>[removed]</script>")
    // remove inline styles (reduce noise)
    .replace(/ style="[^"]*"/g, "")
    // remove SVG blobs
    .replace(/<svg[\s\S]*?<\/svg>/gi, "<svg>[removed]</svg>")
    // collapse whitespace
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

// ── Extract design metadata ────────────────────────────────────────────────
async function extractMeta(page) {
  return page.evaluate(() => {
    const getVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();

    // collect unique fonts
    const fonts = new Set();
    document.querySelectorAll("*").forEach((el) => {
      const f = getComputedStyle(el).fontFamily.split(",")[0].replace(/['"]/g, "").trim();
      if (f) fonts.add(f);
    });

    // collect dominant background colours (top 8 most used)
    const bgMap = {};
    document.querySelectorAll("*").forEach((el) => {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        bgMap[bg] = (bgMap[bg] || 0) + 1;
      }
    });
    const topBg = Object.entries(bgMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([c]) => c);

    // collect dominant text colours
    const fgMap = {};
    document.querySelectorAll("*").forEach((el) => {
      const c = getComputedStyle(el).color;
      if (c) { fgMap[c] = (fgMap[c] || 0) + 1; }
    });
    const topFg = Object.entries(fgMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([c]) => c);

    // navigation links
    const navLinks = Array.from(
      document.querySelectorAll("nav a, header a")
    ).map((a) => a.textContent.trim()).filter(Boolean).slice(0, 12);

    // headings
    const headings = Array.from(document.querySelectorAll("h1, h2"))
      .map((h) => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 120) }))
      .slice(0, 10);

    // CTA buttons
    const ctas = Array.from(
      document.querySelectorAll("button, a[class*='btn'], a[class*='cta'], a[class*='button']")
    ).map((el) => el.textContent.trim()).filter((t) => t.length > 1 && t.length < 60).slice(0, 8);

    // meta tags
    const metaDesc = document.querySelector('meta[name="description"]')?.content || "";
    const ogTitle  = document.querySelector('meta[property="og:title"]')?.content || "";
    const ogImage  = document.querySelector('meta[property="og:image"]')?.content || "";

    return {
      title: document.title,
      metaDescription: metaDesc,
      ogTitle,
      ogImage,
      fonts: [...fonts].slice(0, 10),
      backgroundColors: topBg,
      textColors: topFg,
      navLinks,
      headings,
      ctaTexts: ctas,
      hasVideo: !!document.querySelector("video"),
      hasDarkBg: topBg.some((c) => {
        const m = c.match(/\d+/g);
        if (!m) return false;
        const [r, g, b] = m.map(Number);
        return r < 60 && g < 60 && b < 60;
      }),
    };
  });
}

// ── Scrape a single site ───────────────────────────────────────────────────
export async function scrapeSite(site, outDir, browser, options = {}) {
  const { verbose = false } = options;
  const slug = site.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const result = {
    id:         site.id,
    name:       site.name,
    url:        site.url,
    industry:   site.industry,
    type:       site.type,
    tags:       site.tags,
    priority:   site.priority,
    slug,
    scrapedAt:  null,
    status:     "pending",
    error:      null,
    screenshotFile: null,
    htmlFile:       null,
    metadataFile:   null,
    meta:           null,
  };

  const context = await browser.newContext({
    viewport: VIEWPORT,
    userAgent: USER_AGENT,
    locale: "en-US",
  });
  const page = await context.newPage();

  // block heavy assets we don't need for HTML structure
  await page.route("**/*.{mp4,webm,woff,woff2,ttf,eot,otf}", (route) => route.abort());

  try {
    if (verbose) console.log(`  → navigating to ${site.url}`);
    await page.goto(site.url, { waitUntil: "domcontentloaded", timeout: TIMEOUT });

    // wait a little for JS-rendered content
    await page.waitForTimeout(2500);

    // dismiss cookie banners if possible
    for (const sel of [
      "[id*='cookie'] button", "[class*='cookie'] button",
      "[id*='consent'] button", "[class*='accept']",
      "[aria-label*='Accept']", "[aria-label*='accept']",
    ]) {
      try { await page.click(sel, { timeout: 1000 }); break; } catch {}
    }

    await page.waitForTimeout(500);

    // ── Screenshot ──────────────────────────────────────────────────────
    const screenshotPath = path.join(outDir, "screenshots", `${slug}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false, type: "png" });
    result.screenshotFile = `screenshots/${slug}.png`;
    if (verbose) console.log(`  ✓ screenshot saved`);

    // ── HTML ─────────────────────────────────────────────────────────────
    const rawHTML  = await page.content();
    const cleanHtml = cleanHTML(rawHTML);
    const htmlPath  = path.join(outDir, "html", `${slug}.html`);
    await fs.writeFile(htmlPath, cleanHtml, "utf-8");
    result.htmlFile = `html/${slug}.html`;
    if (verbose) console.log(`  ✓ HTML saved (${Math.round(cleanHtml.length / 1024)} KB)`);

    // ── Design Metadata ───────────────────────────────────────────────────
    const meta = await extractMeta(page);
    result.meta = meta;
    const metaPath = path.join(outDir, "metadata", `${slug}.json`);
    await fs.writeFile(metaPath, JSON.stringify({ ...result, meta }, null, 2), "utf-8");
    result.metadataFile = `metadata/${slug}.json`;
    if (verbose) console.log(`  ✓ metadata saved`);

    result.scrapedAt = new Date().toISOString();
    result.status    = "success";

  } catch (err) {
    result.status = "error";
    result.error  = err.message;
    if (verbose) console.error(`  ✗ error: ${err.message}`);
  } finally {
    await context.close();
  }

  return result;
}

// ── Browser pool helper ────────────────────────────────────────────────────
export async function launchBrowser() {
  return chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
}
