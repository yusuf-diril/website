#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Yazılarım sitesini derler. Node yoksa: python3 build.py
"""
import json
import random
import re
import shutil
from pathlib import Path

try:
    import markdown
except ImportError:
    print("Markdown kütüphanesi gerekli. Kurulum: python3 -m pip install markdown")
    exit(1)

PROJECT_DIR = Path(__file__).resolve().parent
YAZILARIM_DIR = PROJECT_DIR / "yazilarim"
DOCS_DIR = PROJECT_DIR / "docs"
YAZI_DIR = DOCS_DIR / "yazi"
PULLAR_DIR = PROJECT_DIR / "mektup-pullari"
PULLAR_OUT = DOCS_DIR / "img" / "pullar"
PUL_DOSYALARI = ["mektup-pulu-1.png", "mektup-pulu-2.png", "mektup-pulu-3.png", "mektup-pulu-4.png"]
SKETCHES_DIR = PROJECT_DIR / "img" / "sketches"
SKETCHES_OUT = DOCS_DIR / "img" / "sketches"
SKETCH_DEFAULT = PROJECT_DIR / "5067.jpg"  # anasayfa kartları için varsayılan sketch

# GitHub Pages: proje sayfası için base path. Kullanıcı sayfası için '' bırakın.
BASE = ""  # Örn: "/websitem"

# Kişiselleştirme (istediğiniz gibi değiştirin)
SITE_AUTHOR = "münzevî"  # Mahlas
# İmza döngüsü: sırayla gösterilir (JS'de münzevî → hiçten, kimseye.. → yusuf diril)
SIGNATURE_VARIATIONS = ["münzevî", "hiçten, kimseye..", "yusuf diril"]

# Hero'da her sayfa yüklemesinde rastgele gösterilecek alıntılar
HERO_QUOTES = [
    "Belki de hayatın başlığına yazılacak tek kelime sükûttur.",
    "Dünyam daraldığında artık insanların kapısını çalmıyorum. Seccademe koşuyorum.",
    "Vakit, geceyi çoktan devirdi.",
    "Söylenmiş ve söylenmemiş her ne varsa, sükûtun o derin kuyusuna emanet…",
    "Belki de hayatın başlığına yazılacak tek kelime sükûttur, duyulmayan çığlıkların hatrına.",
]

FOOTER_QUOTE = "Söylenmiş ve söylenmemiş her ne varsa, sükûtun o derin kuyusuna emanet…"

# Gizli kelimeler: yazıların içinde bu kelimelere tıklanınca gizli metin açılır (keşif / bulmaca).
# Uzun kelimeleri önce yaz (örn. sükûtun önce, sükût sonra).
GIZLI_KELIMELER = {
    "sükûtun": "Sükût da bir cevaptır. Bazen en derin olanı.",
    "sükût": "Bazen tek kelime yeter.",
    "vakit": "Vakit, geceyi çoktan devirdi.",
    "suskunluğun": "Suskunluk da bir dil.",
}

FONT_DRAWER_HTML = """
    <div class="reading-font-wrap" aria-label="Yazı fontu ve boyut seçimi">
      <div class="reading-option">
        <label for="reading-font-select" class="reading-font-label">Font</label>
        <select id="reading-font-select" class="reading-font-select">
          <option value="patrick-hand">Patrick Hand</option>
          <option value="shadows-into-light">Shadows Into Light</option>
          <option value="marck-script">Marck Script</option>
          <option value="caveat">Caveat</option>
          <option value="bad-script">Bad Script</option>
          <option value="cormorant-garamond">Cormorant Garamond</option>
          <option value="fraunces">Fraunces</option>
          <option value="playfair-display-italic">Playfair Display (italic)</option>
          <option value="prata">Prata</option>
          <option value="bodoni-moda">Bodoni Moda</option>
        </select>
      </div>
      <div class="reading-option">
        <label for="reading-size-select" class="reading-font-label">Boyut</label>
        <select id="reading-size-select" class="reading-font-select">
          <option value="small">Küçük</option>
          <option value="normal" selected>Normal</option>
          <option value="large">Büyük</option>
        </select>
      </div>
    </div>"""


def slugify(s):
    tr = {"ı": "i", "ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c", "â": "a", "î": "i", "û": "u", "İ": "i"}
    for k, v in tr.items():
        s = s.replace(k, v)
    s = re.sub(r"[\s–—:]+", "-", s)
    s = re.sub(r"[^\w\-]", "", s, flags=re.UNICODE)
    s = s.lower().strip("-").strip("-")
    return s or "yazi"


def extract_title(md):
    m = re.search(r"^#\s*(.+?)(?:\n|$)", md, re.MULTILINE)
    if m:
        return m.group(1).strip()
    first = md.strip().split("\n")[0].strip()
    return first[:80] + ("…" if len(first) > 80 else "") if first else "Yazı"


def extract_excerpt(md, max_chars=120):
    """Özet: sabit karakter sınırı (tüm yazılarda aynı uzunlukta görünsün)."""
    without_title = re.sub(r"^#\s*.+?(?:\n|$)", "", md.strip(), count=1)
    without_title = without_title.strip()
    if not without_title:
        return ""
    first_para = without_title.split("\n\n")[0].strip()
    first_para = re.sub(r"\s+", " ", first_para)
    first_para = re.sub(r"[*_`#\[\]]", "", first_para)
    if len(first_para) <= max_chars:
        return first_para
    cut = first_para[: max_chars + 1].rsplit(" ", 1)[0]
    return cut + "…" if cut else first_para[:max_chars] + "…"


def md_to_html(md):
    without_first = re.sub(r"^#\s*.+?\n\n?", "", md, count=1)
    body = markdown.markdown(without_first or md, extensions=["extra", "nl2br"])
    return body


def escape_html(s):
    if s is None:
        return ""
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def inject_secret_words(html_content):
    """Prose HTML içinde sadece metin kısımlarında gizli kelimeleri tıklanabilir yapar (uzun kelime önce)."""
    if not GIZLI_KELIMELER:
        return html_content
    for word, secret in sorted(GIZLI_KELIMELER.items(), key=lambda x: -len(x[0])):
        span = f'<span class="secret-word" tabindex="0" role="button" data-secret="{escape_html(secret)}" aria-label="Gizli">{escape_html(word)}</span>'
        def make_repl(w, s):
            return lambda m: ">" + m.group(1).replace(w, s) + "<" if w in m.group(1) else m.group(0)
        html_content = re.sub(r">([^<]+)<", make_repl(word, span), html_content)
    return html_content


def v3_header(index_href, sukut_href, is_index=True, signature_variations=None, show_font_toggle=False):
    nav_yazilar = f'<a href="{index_href}">Yazılar</a>'
    nav_sukut = f'<a href="{sukut_href}">Sükût</a>'
    nav_hakkimda = f'<a href="{index_href}#hakkimda">Hakkımda</a>'
    nav_iletisim = f'<a href="{index_href}#iletisim">İletişim</a>'
    data_sig = ""
    if signature_variations:
        data_sig = " data-signature-variations='" + json.dumps(signature_variations, ensure_ascii=False).replace("'", "&#39;") + "'"
    font_btn = '<button type="button" class="font-drawer-toggle" aria-label="Font ayarları">Aa</button>' if show_font_toggle else ""
    return f"""  <header class="site-head">
    <div class="wrap head-inner">
      <a href="{index_href}" class="site-signature"{data_sig}>{escape_html(SITE_AUTHOR)}</a>
      <nav class="site-nav">
        {nav_yazilar}
        {nav_sukut}
        {nav_hakkimda}
        {nav_iletisim}
      </nav>
      {font_btn}
      <button type="button" class="theme-toggle" aria-label="Gece modu">🌙</button>
    </div>
  </header>"""


def v3_footer(js_href, quote_override=None, dynamic_quote=False, script_before_js=None):
    if dynamic_quote:
        q = '<p class="foot-quote" id="foot-quote"></p>'
    else:
        raw = quote_override if quote_override is not None else FOOTER_QUOTE
        if "sükûtun" in raw:
            a, b = raw.split("sükûtun", 1)
            secret = GIZLI_KELIMELER.get("sükûtun", "Sükût da bir cevaptır.")
            q = f'<p class="foot-quote">{escape_html(a)}<span class="secret-word" tabindex="0" role="button" data-secret="{escape_html(secret)}" aria-label="Gizli">sükûtun</span>{escape_html(b)}</p>'
        else:
            q = f'<p class="foot-quote">{escape_html(raw)}</p>'
    return f"""  <footer class="site-foot">
    <div class="wrap foot-inner">
      {q}
      <p class="foot-meta">
        <span class="moon-phase" aria-hidden="true"></span>
        <label class="ambient-label"><input type="checkbox" class="ambient-toggle" aria-label="Gece sesi"> Gece sesi</label>
      </p>
    </div>
  </footer>
  <div id="secret-overlay" class="secret-overlay" role="dialog" aria-hidden="true">
    <p class="secret-overlay-text"></p>
    <button type="button" class="secret-overlay-close">×</button>
  </div>
  <audio id="ambient-audio" preload="none" aria-hidden="true"></audio>
  {script_before_js or ""}
  <script src="{js_href}"></script>"""


def v3_template(title, body, is_index=False, hero_html="", sukut_page=False, font_drawer_html=None, footer_quote_override=None, hero_quotes_for_js=None):
    index_href = f"{BASE}/index.html" if BASE else ("index.html" if is_index else "../index.html")
    sukut_href = f"{BASE}/sukut.html" if BASE else ("sukut.html" if is_index else "../sukut.html")
    css_href = f"{BASE}/css/style.css" if BASE else ("css/style.css" if is_index else "../css/style.css")
    js_href = f"{BASE}/js/main.js" if BASE else ("js/main.js" if is_index else "../js/main.js")
    site_title = "Yazılarım"
    page_title = escape_html(site_title if is_index else f"{title} — {site_title}")
    show_font = bool(font_drawer_html)
    header = v3_header(index_href, sukut_href, is_index, SIGNATURE_VARIATIONS if not sukut_page else None, show_font_toggle=show_font)
    use_dynamic_footer = hero_quotes_for_js is not None
    script_before_js = ""
    if hero_quotes_for_js is not None:
        script_before_js = "  <script>window.YAZILARIM_HERO_QUOTES = " + json.dumps(hero_quotes_for_js, ensure_ascii=False) + ";</script>"
    footer = v3_footer(js_href, quote_override=footer_quote_override, dynamic_quote=use_dynamic_footer, script_before_js=script_before_js)
    body_class = ' class="index-body"' if is_index else ""
    fonts_url = "https://fonts.googleapis.com/css2?family=Bad+Script&family=Bodoni+Moda:ital,wght@0,400;0,600;1,400&family=Caveat:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Fraunces:ital,wght@0,400;0,600;1,400&family=Great+Vibes&family=Marck+Script&family=Patrick+Hand&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Prata&family=Shadows+Into+Light&display=swap"
    drawer_block = ""
    if font_drawer_html:
        drawer_block = f"""
  <div id="font-drawer" class="font-drawer" aria-hidden="true">
    <button type="button" class="font-drawer-close" aria-label="Kapat">×</button>
    <div class="font-drawer-inner">
      {font_drawer_html}
    </div>
  </div>"""
    return f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{page_title}</title>
  <link rel="stylesheet" href="{css_href}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="{fonts_url}" rel="stylesheet">
</head>
<body{body_class}>
{header}
  <main class="{('main index-main' if is_index else 'main')}">
{hero_html}
    <div class="wrap main-inner">
{body}
    </div>
  </main>
{footer}{drawer_block}
</body>
</html>"""


def main():
    DOCS_DIR.mkdir(parents=True, exist_ok=True)
    YAZI_DIR.mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "css").mkdir(parents=True, exist_ok=True)
    (DOCS_DIR / "js").mkdir(parents=True, exist_ok=True)

    entries = []
    for path in sorted(YAZILARIM_DIR.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        title = extract_title(raw)
        slug = slugify(path.stem) or slugify(title)
        excerpt = extract_excerpt(raw)
        entries.append({"title": title, "slug": slug, "excerpt": excerpt})

    entries.sort(key=lambda e: e["title"].lower())
    yazi_base = f"{BASE}/" if BASE else ""

    sketch_files = []
    if SKETCHES_DIR.exists():
        sketch_files = sorted(SKETCHES_DIR.glob("*.jpg")) + sorted(SKETCHES_DIR.glob("*.jpeg")) + sorted(SKETCHES_DIR.glob("*.png"))
    if not sketch_files and SKETCH_DEFAULT.exists():
        sketch_files = [SKETCH_DEFAULT]

    for path in sorted(YAZILARIM_DIR.glob("*.md")):
        raw = path.read_text(encoding="utf-8")
        title = extract_title(raw)
        slug = slugify(path.stem) or slugify(title)
        html_content = md_to_html(raw)
        html_content = inject_secret_words(html_content)
        back_url = f"{BASE}/index.html" if BASE else "../index.html"
        other_entries = [x for x in entries if x["slug"] != slug]
        sugg = random.choice(other_entries) if other_entries else None
        sugg_block = ""
        if sugg:
            sugg_block = f'\n      <p class="belki-bunu-da-oku">Belki bunu da okumak istersin: <a href="{sugg["slug"]}.html">{escape_html(sugg["title"])}</a></p>'
        pul_img = ""
        if PULLAR_DIR.exists():
            pul_dosya = random.choice(PUL_DOSYALARI)
            if (PULLAR_DIR / pul_dosya).exists():
                pul_path = f"{BASE}/img/pullar/{pul_dosya}" if BASE else f"../img/pullar/{pul_dosya}"
                pul_img = f'<img src="{pul_path}" alt="" class="yazi-pul" loading="lazy" />'
        article_body = f"""    <nav class="nav"><a href="{back_url}">← Tüm yazılar</a></nav>
    <div class="yazi-page" data-reading-font="patrick-hand" data-prose-size="normal">
    <article class="yazi">
      <h1 class="yazi-baslik">{escape_html(title)}</h1>
      <div class="yazi-divider" aria-hidden="true"></div>
      <div class="yazi-govde prose dropcap">{pul_img}{html_content}</div>{sugg_block}
    </article>
    </div>"""
        full_html = v3_template(title, article_body, is_index=False, hero_html="", sukut_page=False, font_drawer_html=FONT_DRAWER_HTML)
        (YAZI_DIR / f"{slug}.html").write_text(full_html, encoding="utf-8")

    yazi_base = f"{BASE}/" if BASE else ""
    hero_block = """
    <section class="hero hero-index" aria-label="Giriş">
      <div class="hero-bg hero-stars" aria-hidden="true"></div>
      <div class="hero-divider" aria-hidden="true"></div>
    </section>"""

    img_base = f"{yazi_base}img/" if yazi_base else "img/"
    satirlar_html = []
    for i, e in enumerate(entries):
        pul_dosya = PUL_DOSYALARI[i % len(PUL_DOSYALARI)]
        pul_src = f"{img_base}pullar/{pul_dosya}"
        ozet = escape_html(e["excerpt"]) if e.get("excerpt") else ""
        # Çift index: metin sol, pul sağ. Tek: pul sol, metin sağ.
        satir_class = "yazi-satir pul-sag" if i % 2 == 0 else "yazi-satir pul-sol"
        satirlar_html.append(f"""    <section class="{satir_class}" data-index="{i}">
      <div class="satir-metin">
        <h2 class="satir-baslik"><a href="{yazi_base}yazi/{e["slug"]}.html">{escape_html(e["title"])}</a></h2>
        <p class="satir-ozet">{ozet}</p>
        <a href="{yazi_base}yazi/{e["slug"]}.html" class="satir-oku">Oku</a>
      </div>
      <div class="satir-pul">
        <img src="{pul_src}" alt="" loading="lazy" />
      </div>
    </section>""")

    index_satirlar = "\n".join(satirlar_html)
    n_slides = len(entries)
    index_body = f"""
    <div class="index-page" data-reading-font="patrick-hand" data-prose-size="normal">
    <div id="yazi-slider-viewport" class="yazi-slider-viewport" data-total-slides="{n_slides}">
      <div id="yazi-slider-track" class="yazi-slider-track" style="--total-slides: {n_slides};">
        <div id="yazilar" class="yazi-satirlar">
{index_satirlar}
        </div>
      </div>
    </div>
    </div>"""

    index_html = v3_template("Yazılar", index_body, is_index=True, hero_html=hero_block, font_drawer_html=FONT_DRAWER_HTML, hero_quotes_for_js=HERO_QUOTES)
    (DOCS_DIR / "index.html").write_text(index_html, encoding="utf-8")

    sukut_body = """
    <div class="sukut-page">
      <p class="sukut-word">Sükût</p>
      <p class="sukut-alt">Bazen sadece susmak gerekir.</p>
    </div>"""
    sukut_html = v3_template("Sükût", sukut_body, is_index=False, hero_html="", sukut_page=True)
    (DOCS_DIR / "sukut.html").write_text(sukut_html, encoding="utf-8")

    shutil.copy2(PROJECT_DIR / "css" / "style.css", DOCS_DIR / "css" / "style.css")
    js_src = PROJECT_DIR / "js" / "main.js"
    if js_src.exists():
        shutil.copy2(js_src, DOCS_DIR / "js" / "main.js")

    PULLAR_OUT.mkdir(parents=True, exist_ok=True)
    for f in PUL_DOSYALARI:
        src = PULLAR_DIR / f
        if src.exists():
            shutil.copy2(src, PULLAR_OUT / f)

    print(f"{len(entries)} yazı derlendi → docs/")


if __name__ == "__main__":
    main()
