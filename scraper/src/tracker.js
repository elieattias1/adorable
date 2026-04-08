import fs from "fs/promises";
import path from "path";

export class ProgressTracker {
  constructor(total, outDir) {
    this.total   = total;
    this.done    = 0;
    this.success = 0;
    this.failed  = 0;
    this.results = [];
    this.outDir  = outDir;
    this.startTime = Date.now();
  }

  record(result) {
    this.done++;
    this.results.push(result);
    if (result.status === "success") this.success++;
    else this.failed++;
  }

  elapsed() {
    const s = Math.round((Date.now() - this.startTime) / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
  }

  eta() {
    if (this.done === 0) return "calculating…";
    const msPerSite = (Date.now() - this.startTime) / this.done;
    const remaining = (this.total - this.done) * msPerSite;
    const s = Math.round(remaining / 1000);
    return s < 60 ? `~${s}s` : `~${Math.floor(s/60)}m ${s%60}s`;
  }

  print(current) {
    const pct = Math.round((this.done / this.total) * 100);
    const bar = "█".repeat(Math.floor(pct / 5)) + "░".repeat(20 - Math.floor(pct / 5));
    const icon = current.status === "success" ? "✓" : "✗";
    console.log(
      `[${bar}] ${pct}% | ${this.done}/${this.total} | ` +
      `✓${this.success} ✗${this.failed} | ETA ${this.eta()} | ` +
      `${icon} ${current.name}`
    );
  }

  async saveResults() {
    const summary = {
      generatedAt: new Date().toISOString(),
      totalSites:  this.total,
      succeeded:   this.success,
      failed:      this.failed,
      elapsed:     this.elapsed(),
      byIndustry:  {},
      sites:       this.results,
    };

    // group by industry
    for (const r of this.results) {
      if (!summary.byIndustry[r.industry]) {
        summary.byIndustry[r.industry] = { total: 0, success: 0, failed: 0, sites: [] };
      }
      const g = summary.byIndustry[r.industry];
      g.total++;
      if (r.status === "success") g.success++; else g.failed++;
      g.sites.push({ id: r.id, name: r.name, status: r.status });
    }

    const summaryPath = path.join(this.outDir, "scrape-results.json");
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

    // also write a simple CSV for easy import into Excel
    const csvLines = [
      "id,name,url,industry,type,priority,status,screenshotFile,htmlFile,scrapedAt,error"
    ];
    for (const r of this.results) {
      csvLines.push([
        r.id, `"${r.name}"`, r.url, `"${r.industry}"`, `"${r.type}"`,
        r.priority, r.status,
        r.screenshotFile || "", r.htmlFile || "",
        r.scrapedAt || "", `"${(r.error || "").replace(/"/g,'""')}"`
      ].join(","));
    }
    const csvPath = path.join(this.outDir, "scrape-results.csv");
    await fs.writeFile(csvPath, csvLines.join("\n"), "utf-8");

    return { summaryPath, csvPath };
  }
}
