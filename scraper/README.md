# Website Template Scraper

Automated scraper for 64 industry reference websites. For each site it captures:
- **Full-page screenshot** (1440×900 viewport, PNG)
- **Cleaned HTML** (scripts stripped, whitespace collapsed — ready to feed to AI)
- **Design metadata** JSON (fonts, colours, nav links, headings, CTA text, dark/light mode)

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright's Chromium browser (one-time)
npx playwright install chromium

# 3. Run
npm run scrape
```

---

## Commands

| Command | What it does |
|---|---|
| `npm run scrape` | All 64 sites, concurrency=3 |
| `npm run scrape:high` | High-priority sites only (27 sites) |
| `npm run scrape:test` | First 3 sites with verbose logging — good for testing |
| `npm run scrape:resume` | Skip already-scraped sites, retry failures |
| `npm run scrape:saas` | SaaS industry only |
| `npm run scrape:ecomm` | E-commerce industry only |

### Advanced options

```bash
node scrape.js --concurrency 5          # increase parallel tabs (faster on good connections)
node scrape.js --industry "Restaurant"  # single industry
node scrape.js --priority high          # only high-priority sites
node scrape.js --ids 1,5,9,12           # specific site IDs
node scrape.js --limit 10               # stop after N sites
node scrape.js --out ./custom-output    # custom output folder
node scrape.js --resume --verbose       # resume + detailed logging
```

---

## Output structure

```
output/
├── screenshots/
│   ├── allbirds.png
│   ├── linear-app.png
│   └── ...                    (64 PNG files, 1440×900)
├── html/
│   ├── allbirds.html
│   ├── linear-app.html
│   └── ...                    (64 cleaned HTML files)
├── metadata/
│   ├── allbirds.json
│   ├── linear-app.json
│   └── ...                    (64 design metadata JSON files)
├── scrape-results.json        (full summary with stats by industry)
└── scrape-results.csv         (flat CSV — import into Excel to update your database)
```

### Metadata JSON schema

```json
{
  "id": 1,
  "name": "Allbirds",
  "url": "https://allbirds.com",
  "industry": "E-commerce",
  "type": "E-commerce store",
  "tags": ["minimal", "product", "DTC", "sustainability"],
  "priority": "high",
  "status": "success",
  "scrapedAt": "2024-01-15T10:23:45.000Z",
  "screenshotFile": "screenshots/allbirds.png",
  "htmlFile": "html/allbirds.html",
  "meta": {
    "title": "...",
    "metaDescription": "...",
    "fonts": ["Apertura", "Georgia"],
    "backgroundColors": ["rgb(240, 238, 233)", "rgb(255, 255, 255)"],
    "textColors": ["rgb(25, 25, 25)", "rgb(102, 102, 102)"],
    "headings": [{ "tag": "H1", "text": "..." }],
    "ctaTexts": ["Shop Now", "Learn More"],
    "navLinks": ["Men", "Women", "Kids", "Sale"],
    "hasVideo": false,
    "hasDarkBg": false
  }
}
```

---

## Feeding to your AI

### For HTML templates
Each `html/*.html` file is a cleaned single-page snapshot. Feed it as a system prompt example:

```js
const html = fs.readFileSync(`output/html/${slug}.html`, 'utf-8');
const prompt = `Here is the HTML structure of ${name} (${industry}, ${type}):\n\n${html}\n\nGenerate a similar layout for...`;
```

### For design context
Use `metadata/*.json` to give the AI colour palettes, font choices, and navigation patterns without sending the full HTML.

### Recommended AI prompt structure
```
You are building a website for [business description].
Industry reference: [industry]
Site type: [type]
Design patterns to follow: [tags from metadata]
Color palette: [backgroundColors + textColors from metadata]
Fonts used: [fonts from metadata]

Reference HTML structure:
[cleaned html]
```

---

## Tips

- **Rate limiting**: Default concurrency=3 is safe for most sites. Increase to 5–6 on fast connections.
- **Failures**: Sites behind aggressive bot detection (Cloudflare, etc.) may fail. Re-run with `--resume`.
- **Storage**: ~64 screenshots ≈ 50–100 MB. HTML files are typically 50–500 KB each.
- **Re-scraping**: Delete `output/metadata/sitename.json` and run with `--resume` to re-scrape a single site.
