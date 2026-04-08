/**
 * French Food & Bakery Website Scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Targets:
 *   A) boulangeries across France
 *   B) salons de thé / brunch places in Paris
 */

import { chromium } from "playwright";
import fs            from "fs/promises";
import path          from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR   = path.join(__dirname, "../../output");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function sleep(ms) { return new Promise(r => setTimeout(r, ms + Math.random() * 800)); }

// ── Email extractor ───────────────────────────────────────────────────────────
const EMAIL_RE    = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const SKIP_EMAIL_DOMAINS = new Set([
  "sentry.io","wix.com","squarespace.com","wordpress.com","shopify.com",
  "example.com","w3.org","schema.org","facebook.com","instagram.com",
  "twitter.com","google.com","apple.com","microsoft.com","amazon.com",
]);

// ── Scrape a business website for emails + design notes ───────────────────────
async function analyzeWebsite(page, url) {
  if (!url || !url.startsWith("http")) return { emails: [], designNotes: "" };
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 18000 });
    await page.waitForTimeout(1200);

    return await page.evaluate((skipDomains) => {
      const text = document.body?.innerText || "";
      const html = document.documentElement.outerHTML;

      const mailto = Array.from(document.querySelectorAll("a[href^='mailto:']"))
        .map(a => a.href.replace("mailto:","").split("?")[0].trim().toLowerCase())
        .filter(e => e.includes("@"));

      const phones = (text.match(/(?:0|\+33)[1-9](?:[\s.\-]?\d{2}){4}/g) || [])
        .map(p => p.replace(/\s/g,""));

      const socials = {};
      const socialMap = { instagram:"instagram.com", facebook:"facebook.com", tiktok:"tiktok.com" };
      for (const [name, domain] of Object.entries(socialMap)) {
        const link = document.querySelector(`a[href*="${domain}"]`)?.href;
        if (link) socials[name] = link;
      }

      const hasMobileMenu   = !!document.querySelector("[class*='burger'], [class*='hamburger'], [class*='menu-toggle']");
      const hasOnlineOrder  = /commander|réserv|réserver|reservation|order online|book/i.test(text);
      const hasDelivery     = /livraison|delivery|uber eats|deliveroo|just eat/i.test(text);
      const hasPhotoGallery = document.querySelectorAll("img").length > 8;
      const usesWordPress   = html.includes("wp-content");
      const usesWix         = html.includes("wix.com") || html.includes("_wix");
      const usesSquarespace = html.includes("squarespace");
      const hasOpeningHours = /lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|horaires|opening/i.test(text);

      const cms = usesWordPress ? "WordPress" : usesWix ? "Wix" : usesSquarespace ? "Squarespace" : "Unknown/Custom";
      const notes = [
        hasOnlineOrder  && "online-ordering",
        hasDelivery     && "delivery",
        hasPhotoGallery && "photo-gallery",
        hasOpeningHours && "opening-hours",
        hasMobileMenu   && "mobile-nav",
      ].filter(Boolean).join(", ");

      return {
        emails: mailto,
        phones: [...new Set(phones)].slice(0, 3),
        socials,
        cms,
        designNotes: notes,
        pageTitle: document.title,
        hasReservation: hasOnlineOrder,
      };
    }, [...skipDomains]);
  } catch {
    return { emails: [], phones: [], socials: {}, cms: "Unknown", designNotes: "scrape_failed" };
  }
}

// ── Accept Google consent (needed in headless mode, per-page) ─────────────────
async function acceptGoogleConsent(page) {
  try {
    await page.click('button:has-text("Tout accepter")', { timeout: 4000 });
    await sleep(2500);
  } catch {}
}

// ── SOURCE: Google Maps ───────────────────────────────────────────────────────
async function scrapeGoogleMaps(page, query, targetCount) {
  const results = [];
  console.log(`\n  ▸ Google Maps: "${query}" (target: ${targetCount})`);

  try {
    const url = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2500);

    // Accept consent wall (appears in headless mode for EU)
    await acceptGoogleConsent(page);
    await page.waitForTimeout(2000);

    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => {
        const panel = document.querySelector('[role="feed"]');
        if (panel) panel.scrollTop += 600;
      });
      await sleep(1200);
    }

    const listings = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/maps/place/"]'));
      return links.map(link => {
        // Extract name from URL path (most reliable)
        const match = link.href.match(/\/maps\/place\/([^/]+)\//);
        const name  = match ? decodeURIComponent(match[1]).replace(/\+/g, " ") : "";
        // Try to get rating/address from container text
        const container = link.closest('[jsaction]') || link.parentElement?.parentElement;
        const lines = (container?.innerText || "").split("\n").filter(t => t.trim());
        const rating  = lines.find(t => /^\d[.,]\d/.test(t)) || "";
        const address = lines.find(t => t.includes(" · ") && !t.includes("€")) || lines[2] || "";
        return { name, href: link.href, rating, address };
      }).filter(l => l.name && l.href.includes("/maps/place/"));
    });

    const seen = new Set();
    const unique = listings.filter(l => { const k = l.name?.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
    console.log(`    Found ${unique.length} listings`);

    for (const listing of unique.slice(0, targetCount)) {
      try {
        await page.goto(listing.href, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(2000);

        const details = await page.evaluate(() => {
          const websiteBtn = document.querySelector('a[data-item-id="authority"]') ||
                             document.querySelector('a[aria-label*="site"], a[aria-label*="Site"]');
          const website = websiteBtn?.href?.split("?")[0];
          const phoneEl = document.querySelector('[data-item-id*="phone"]');
          const phone   = phoneEl?.textContent?.trim() ||
                          document.body.innerText.match(/(?:0|\+33)[1-9](?:[\s.\-]?\d{2}){4}/)?.[0];
          const address = document.querySelector('[data-item-id="address"]')?.textContent?.trim()
                        || document.querySelector('.rogA2c')?.textContent?.trim();
          const category = document.querySelector('.DkEaL')?.textContent?.trim();
          return { website, phone, address, category };
        });

        if (listing.name) {
          results.push({
            name:         listing.name,
            address:      details.address || listing.address || "",
            phone:        details.phone || "",
            website:      details.website || "",
            category:     details.category || "",
            rating:       listing.rating || "",
            reviews:      listing.reviews || "",
            googleMapsUrl: listing.href,
            source:       "google_maps",
          });
        }
        await sleep(1800);
      } catch { }
    }
  } catch (err) {
    console.log(`    ✗  Google Maps failed: ${err.message}`);
  }

  return results;
}

// ── SOURCE: PagesJaunes ───────────────────────────────────────────────────────
async function scrapePagesJaunes(page, category, location, targetCount) {
  const results = [];
  console.log(`\n  ▸ PagesJaunes: "${category}" in "${location}"`);

  try {
    const searchUrl = `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(category)}&ou=${encodeURIComponent(location)}&proximite=1`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(2500);

    try { await page.click("#didomi-notice-agree-button", { timeout: 3000 }); await sleep(500); } catch {}

    let pageNum = 1;
    while (results.length < targetCount && pageNum <= 5) {
      const listings = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".bi-content, [class*='bi-item']")).map(el => ({
          name:    el.querySelector(".denomination-links span, .bi-denomination")?.textContent?.trim(),
          address: el.querySelector(".adresse-principale, .bi-address")?.textContent?.trim(),
          phone:   el.querySelector(".btn-phone-link, [class*='phone']")?.textContent?.trim(),
          website: el.querySelector("a[href*='http']:not([href*='pagesjaunes'])")?.href
                || el.querySelector(".btn-internet a")?.href,
        })).filter(l => l.name);
      });

      listings.forEach(l => {
        if (results.length < targetCount) results.push({ ...l, location, source: "pagesjaunes" });
      });

      const nextBtn = await page.$(".pagination-next, [class*='next-page']");
      if (!nextBtn || results.length >= targetCount) break;
      await nextBtn.click();
      await page.waitForTimeout(2500);
      pageNum++;
    }
  } catch (err) {
    console.log(`    ✗  PagesJaunes failed: ${err.message}`);
  }

  console.log(`    Found ${results.length} listings`);
  return results;
}

// ── Enrich with website data ──────────────────────────────────────────────────
async function enrichWithWebsiteData(businesses, page, label) {
  const withSite = businesses.filter(b => b.website);
  console.log(`\n🔍 Enriching ${withSite.length} websites for ${label}...`);
  let enriched = 0;

  for (let i = 0; i < businesses.length; i++) {
    const biz = businesses[i];
    if (!biz.website) continue;

    process.stdout.write(`  [${i+1}/${businesses.length}] ${(biz.name||"").slice(0,35).padEnd(35)} `);
    try {
      const data = await analyzeWebsite(page, biz.website);
      biz.emails      = data.emails || [];
      biz.cms         = data.cms;
      biz.designNotes = data.designNotes;
      biz.socials     = data.socials || {};
      if (data.phones?.length) biz.phone = biz.phone || data.phones[0];
      if (data.hasReservation !== undefined) biz.hasOnlineReservation = data.hasReservation;
      enriched++;
      console.log(`✓ ${data.cms} | ${data.designNotes || "—"}`);
    } catch {
      biz.emails = [];
      console.log("✗ failed");
    }
    await sleep(1500);
  }

  console.log(`  Enriched ${enriched} websites`);
  return businesses;
}

// ── Dedup ─────────────────────────────────────────────────────────────────────
function deduplicateBusinesses(businesses) {
  const seen = new Map();
  for (const b of businesses) {
    const key = b.name?.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
    if (!key) continue;
    if (!seen.has(key) || (b.website && !seen.get(key).website)) seen.set(key, b);
  }
  return [...seen.values()];
}

// ── Export CSV ────────────────────────────────────────────────────────────────
async function exportCSV(businesses, filename) {
  const headers = [
    "Name","Address","City","Phone","Website","Emails","CMS",
    "Design Notes","Has Online Reservation","Rating","Source",
    "Google Maps","Instagram","Facebook",
  ];

  const rows = businesses.map(b => {
    const city = b.address?.split(",").pop()?.trim() || b.location || "";
    return [
      b.name || "",
      b.address || "",
      city,
      b.phone || "",
      b.website || "",
      (b.emails || []).join(" | "),
      b.cms || "",
      b.designNotes || "",
      b.hasOnlineReservation ? "Yes" : "No",
      b.rating || "",
      b.source || "",
      b.googleMapsUrl || "",
      b.socials?.instagram || "",
      b.socials?.facebook || "",
    ];
  });

  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const csvPath = path.join(OUT_DIR, filename);
  await fs.writeFile(csvPath, "\uFEFF" + csv, "utf-8");
  return csvPath;
}

// ── MAIN: Boulangeries ────────────────────────────────────────────────────────
export async function scrapeBoulangeries(targetCount = 100) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log("\n🥖 SCRAPING BOULANGERIES FRANCE");
  console.log("─".repeat(50));

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ userAgent: UA, locale: "fr-FR" });
  const page    = await context.newPage();
  await page.route("**/*.{mp4,webm,woff,woff2,ttf,gif}", r => r.abort());

  let all = [];

  const cities = [
    "boulangerie artisanale Paris",
    "boulangerie artisanale Paris 11",
    "boulangerie artisanale Paris Marais",
    "boulangerie artisanale Paris Montmartre",
    "boulangerie artisanale Paris 15",
    "boulangerie artisanale Lyon",
    "boulangerie artisanale Marseille",
    "boulangerie artisanale Bordeaux",
    "boulangerie artisanale Toulouse",
    "boulangerie artisanale Lille",
    "boulangerie artisanale Nantes",
    "boulangerie artisanale Strasbourg",
    "boulangerie artisanale Nice",
    "boulangerie artisanale Rennes",
    "boulangerie artisanale Montpellier",
    "boulangerie artisanale Grenoble",
    "boulangerie artisanale Aix-en-Provence",
    "boulangerie artisanale Rouen",
    "boulangerie artisanale Angers",
    "meilleur boulangerie Paris",
    "boulangerie bio Paris",
    "boulangerie viennoiserie Paris",
  ];

  for (const query of cities) {
    if (all.length >= targetCount * 1.5) break;
    const found = await scrapeGoogleMaps(page, query, 18);
    all.push(...found.map(b => ({ ...b, category: "Boulangerie" })));
    await sleep(3000);
  }

  if (all.length < targetCount) {
    all.push(...await scrapePagesJaunes(page, "boulangerie", "France", targetCount - all.length));
    await sleep(2000);
  }

  all = deduplicateBusinesses(all);
  console.log(`\n  Total unique boulangeries: ${all.length}`);

  // Only take those with websites, up to targetCount, to maximise template value
  const withSite = all.filter(b => b.website);
  const toEnrich = withSite.slice(0, targetCount);
  const rest     = all.filter(b => !b.website).slice(0, targetCount - toEnrich.length);
  const ordered  = [...toEnrich, ...rest];

  const enriched = await enrichWithWebsiteData(ordered, page, "boulangeries");
  all = enriched;
  await browser.close();

  const jsonPath = path.join(OUT_DIR, "boulangeries_france.json");
  await fs.writeFile(jsonPath, JSON.stringify(all, null, 2));
  const csvPath = await exportCSV(all, "boulangeries_france.csv");

  console.log(`\n✓ Boulangeries done!`);
  console.log(`   ${all.length} businesses | ${all.filter(b=>b.website).length} with website | ${all.filter(b=>b.emails?.length).length} with email`);
  console.log(`   CSV  → ${csvPath}`);
  console.log(`   JSON → ${jsonPath}`);

  return all;
}

// ── MAIN: Salons de thé ───────────────────────────────────────────────────────
export async function scrapeSalonsDeTe(targetCount = 100) {
  await fs.mkdir(OUT_DIR, { recursive: true });
  console.log("\n☕ SCRAPING SALONS DE THÉ & BRUNCH — PARIS");
  console.log("─".repeat(50));

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ userAgent: UA, locale: "fr-FR" });
  const page    = await context.newPage();
  await page.route("**/*.{mp4,webm,woff,woff2,ttf,gif}", r => r.abort());

  let all = [];

  const queries = [
    "salon de thé Paris",
    "brunch café Paris",
    "brunch Paris 11",
    "brunch Paris Marais",
    "salon de thé Montmartre Paris",
    "brunch Paris 15",
    "café brunch Paris Oberkampf",
    "salon de thé Paris Bastille",
    "brunch Paris Saint Germain",
    "brunch gastronomique Paris",
    "tea room Paris",
    "café gourmand brunch Paris 9",
  ];

  for (const query of queries) {
    if (all.length >= targetCount * 1.3) break;
    const found = await scrapeGoogleMaps(page, query, 12);
    all.push(...found.map(b => ({ ...b, category: "Salon de thé / Brunch", city: "Paris" })));
    await sleep(3000);
  }

  all = deduplicateBusinesses(all);
  console.log(`\n  Total unique salons/brunch: ${all.length}`);

  all = await enrichWithWebsiteData(all.slice(0, targetCount), page, "salons de thé");
  await browser.close();

  const jsonPath = path.join(OUT_DIR, "salons_de_the_paris.json");
  await fs.writeFile(jsonPath, JSON.stringify(all, null, 2));
  const csvPath = await exportCSV(all, "salons_de_the_paris.csv");

  console.log(`\n✓ Salons de thé / Brunch done!`);
  console.log(`   ${all.length} businesses | ${all.filter(b=>b.website).length} with website | ${all.filter(b=>b.emails?.length).length} with email`);
  console.log(`   CSV  → ${csvPath}`);
  console.log(`   JSON → ${jsonPath}`);

  return all;
}
