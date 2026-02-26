const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const YAZILARIM_DIR = path.join(__dirname, 'yazilarim');
const DOCS_DIR = path.join(__dirname, 'docs');
const YAZI_DIR = path.join(DOCS_DIR, 'yazi');

// GitHub Pages: proje sayfası için base path (repo adı). Kullanıcı sayfası için '' bırakın.
const BASE = ''; // Örn: '/websitem' proje sayfası için

function slugify(str) {
  const tr = { 'ı':'i','ş':'s','ğ':'g','ü':'u','ö':'o','ç':'c','â':'a','î':'i','û':'u','İ':'i' };
  let s = str.replace(/[\s–—:]+/g, '-').replace(/[^\w\u0080-\uFFFF-]/g, '');
  Object.keys(tr).forEach(k => { s = s.replace(new RegExp(k, 'g'), tr[k]); });
  return s.toLowerCase().replace(/-+/g, '-').replace(/^-|-$/g, '') || 'yazi';
}

function extractTitle(md) {
  const m = md.match(/^#\s*(.+?)(?:\n|$)/m);
  return m ? m[1].trim() : 'Yazı';
}

function mdToHtml(md) {
  const withoutFirstHeading = md.replace(/^#\s*.+?\n\n?/m, '');
  marked.setOptions({ gfm: true, breaks: true });
  return marked.parse(withoutFirstHeading || md);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function pageTemplate(title, body, isIndex = false) {
  const siteTitle = 'Yazılarım';
  const indexHref = BASE ? `${BASE}/index.html` : (isIndex ? 'index.html' : '../index.html');
  const backLink = isIndex ? '' : `<nav class="nav"><a href="${indexHref}">← Tüm yazılar</a></nav>`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(isIndex ? siteTitle : `${title} — ${siteTitle}`)}</title>
  <link rel="stylesheet" href="${BASE ? BASE + '/css/style.css' : (isIndex ? 'css/style.css' : '../css/style.css')}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@400;500&display=swap" rel="stylesheet">
</head>
<body>
  <header class="site-head">
    <div class="wrap">
      <a href="${indexHref}" class="site-title">${siteTitle}</a>
    </div>
  </header>
  <main class="main wrap">
    ${backLink}
    ${body}
  </main>
  <footer class="site-foot">
    <div class="wrap">Yazılar bana aittir. İzinsiz kopyalanamaz.</div>
  </footer>
</body>
</html>`;
}

function main() {
  ensureDir(DOCS_DIR);
  ensureDir(YAZI_DIR);
  ensureDir(path.join(DOCS_DIR, 'css'));

  const files = fs.readdirSync(YAZILARIM_DIR).filter(f => f.endsWith('.md'));
  const entries = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(YAZILARIM_DIR, file), 'utf8');
    const title = extractTitle(raw);
    const slug = slugify(path.basename(file, '.md')) || slugify(title);
    const htmlContent = mdToHtml(raw);
    const articleHtml = `
    <article class="yazi">
      <h1 class="yazi-baslik">${escapeHtml(title)}</h1>
      <div class="yazi-govde prose">${htmlContent}</div>
    </article>`;
    const fullHtml = pageTemplate(title, articleHtml, false);
    const outPath = path.join(YAZI_DIR, `${slug}.html`);
    fs.writeFileSync(outPath, fullHtml, 'utf8');
    entries.push({ title, slug });
  }

  entries.sort((a, b) => a.title.localeCompare(b.title, 'tr'));

  const listHtml = `
    <h1 class="index-baslik">Yazılar</h1>
    <ul class="yazi-listesi">
      ${entries.map(e => `<li><a href="${BASE ? BASE + '/' : ''}yazi/${e.slug}.html">${escapeHtml(e.title)}</a></li>`).join('\n      ')}
    </ul>`;
  const indexHtml = pageTemplate('Yazılar', listHtml, true);
  fs.writeFileSync(path.join(DOCS_DIR, 'index.html'), indexHtml, 'utf8');

  const cssSrc = path.join(__dirname, 'css', 'style.css');
  if (fs.existsSync(cssSrc)) {
    fs.copyFileSync(cssSrc, path.join(DOCS_DIR, 'css', 'style.css'));
  }

  console.log(`${entries.length} yazı derlendi → docs/`);
}

main();
