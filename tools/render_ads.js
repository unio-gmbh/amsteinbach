// Rendert Sujets aus ads/index.html als PNG (1080 px). Aufruf: im Repo-Root `python3 -m http.server 8777`, dann
// node tools/render_ads.js <Zielordner> 1.1,1.2,... (Playwright nötig)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const out = process.argv[2], ids = process.argv[3].split(','), base = process.env.ADS_URL || 'http://localhost:8777/ads/index.html';
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const errs = [];
  for (const f of ['45', '916']) {
    const p = await b.newPage({ viewport: { width: 1080, height: f === '45' ? 1350 : 1920 } });
    p.on('pageerror', e => errs.push(e.message));
    for (const id of ids) {
      await p.goto(`${base}?only=${id}&f=${f}`);
      await p.waitForFunction(() => document.body.dataset.ready === '1');
      await p.waitForLoadState('networkidle');
      const of = await p.evaluate(() => [...document.querySelectorAll('.ad *')].filter(el => { const r = el.getBoundingClientRect(); return el.children.length === 0 && (r.right > 1081 || r.left < -1) && !el.matches('img.ph,.scrim-t,.scrim-b'); }).map(el => el.className || el.tagName));
      if (of.length) errs.push(`${id} ${f} overflow: ${of.join(',')}`);
      await p.screenshot({ path: `${out}/${id}_${f === '45' ? '4x5' : '9x16'}.png` });
    }
    await p.close();
  }
  console.log(errs.length ? errs.join('\n') : 'ok');
  await b.close();
})();
