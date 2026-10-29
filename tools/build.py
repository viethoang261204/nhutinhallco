#!/usr/bin/env python3
"""
Ghép các trang trong _src/ thành HTML tĩnh: tiếng Việt ở thư mục gốc, tiếng Anh ở en/.

    python tools/build.py

Chỉ cần chạy khi sửa header, footer, menu, các khối dùng chung hoặc nội dung trong _src/.
Trang web sau khi build là HTML tĩnh, upload là chạy, không cần Python trên hosting.

Nguồn:
    _src/layout.html, _src/partials/, _src/pages/, _src/chatbot/kb.json              tiếng Việt
    _src/en/layout.html, _src/en/partials/, _src/en/pages/, _src/en/chatbot/kb.json  tiếng Anh
Khối dùng chung nào không có bản trong _src/en/partials/ (ví dụ sprite) thì dùng bản tiếng Việt.
Trang tiếng Anh đặt cùng tên file với trang tiếng Việt tương ứng, để nút VI | EN chuyển đúng trang.

Mỗi trang bắt đầu bằng một khối cấu hình JSON:

    <!--page
    {"title": "...", "description": "...", "nav": "san-pham",
     "crumbs": [["Sản phẩm", "san-pham.html"], ["i-Series", null]],
     "schema": ["product"], "priority": 0.8}
    -->

Trong nội dung có thể dùng:
    {{cta: Câu dẫn của dải kêu gọi}}          dải "Nhận báo giá"
    {{include: ten-partial}}                  chèn khối dùng chung ten-partial.html
"""
import html
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "_src"
SITE = "https://hallco.nhutin.com"  # TODO: đổi thành tên miền thật
TODAY = date.today().isoformat()

PHONE_TEXT = "0907 917 301"
PHONE_TEL = "+84907917301"
ZALO = "https://zalo.me/0907917301"

PRODUCT_PAGES = [
    "san-pham.html", "san-pham-i-series.html", "san-pham-w-floor.html",
    "san-pham-thanh-san.html", "san-pham-he-thong-co-dinh.html",
]

LANGS = {
    "vi": {
        "src": SRC,
        "out": ROOT,
        "path": "",                 # thư mục con trên website
        "kb_out": "js/chatbot-kb.js",
        "home": "Trang chủ",
        "crumbs_label": "Đường dẫn",
        "sub_toggle": "Mở danh mục {}",
        "switch_label": "Chọn ngôn ngữ",
        "business": "Như Tín – Đại lý ủy quyền HALLCO® tại Việt Nam",
        "category": "Sàn tự đổ cho xe chở hàng rời",
        "nav": [
            ("cach-hoat-dong", "cach-hoat-dong.html", "Cách hoạt động", None),
            ("san-pham", "san-pham.html", "Sản phẩm", [
                "Tổng quan sản phẩm", "Bộ dẫn động i-Series", "W Floor và BRUTE",
                "Thanh sàn và sàn nhựa", "Hệ thống cố định"]),
            ("ung-dung", "ung-dung.html", "Ứng dụng", None),
            ("bao-hanh", "bao-hanh.html", "Bảo hành", None),
            ("hoi-dap", "hoi-dap.html", "Hỏi đáp", None),
            ("about", "about.html", "Về Như Tín", None),
        ],
    },
    "en": {
        "src": SRC / "en",
        "out": ROOT / "en",
        "path": "en/",
        "kb_out": "js/chatbot-kb-en.js",
        "home": "Home",
        "crumbs_label": "Breadcrumb",
        "sub_toggle": "Open the {} submenu",
        "switch_label": "Choose language",
        "business": "Như Tín – Authorized HALLCO® dealer in Vietnam",
        "category": "Moving floor systems for bulk haulage",
        "nav": [
            ("cach-hoat-dong", "cach-hoat-dong.html", "How it works", None),
            ("san-pham", "san-pham.html", "Products", [
                "Product overview", "i-Series drives", "W Floor and BRUTE",
                "Floor slats and plastic floor", "Stationary systems"]),
            ("ung-dung", "ung-dung.html", "Applications", None),
            ("bao-hanh", "bao-hanh.html", "Warranty", None),
            ("hoi-dap", "hoi-dap.html", "FAQ", None),
            ("about", "about.html", "About Như Tín", None),
        ],
    },
}


CURRENT = ' aria-current="page"'


def read(p):
    return Path(p).read_text(encoding="utf-8")


def parse_page(path):
    text = read(path)
    m = re.match(r"\s*<!--page\s*(\{.*?\})\s*-->\s*", text, re.S)
    if not m:
        raise SystemExit(f"{path}: thiếu khối <!--page {{...}} -->")
    meta = json.loads(m.group(1))
    return meta, text[m.end():]


def nav_html(L, active, current_file):
    items = []
    for key, href, label, sub in L["nav"]:
        cur = CURRENT if href == current_file else ""
        cls = ' class="is-active"' if key == active else ""
        if not sub:
            items.append(f'          <li{cls}><a href="{href}"{cur}>{label}</a></li>')
            continue
        subs = "\n".join(
            f'              <li><a href="{h}"{CURRENT if h == current_file else ""}>{t}</a></li>'
            for h, t in zip(PRODUCT_PAGES, sub)
        )
        toggle = L["sub_toggle"].format(label.lower())
        items.append(f'''          <li class="has-sub{' is-active' if key == active else ''}">
            <a href="{href}"{cur}>{label}</a>
            <button class="sub-toggle" type="button" aria-expanded="false" aria-controls="sub-{key}" data-sub-toggle>
              <svg class="icon" aria-hidden="true"><use href="#i-chevron"/></svg>
              <span class="visually-hidden">{toggle}</span>
            </button>
            <ul class="sub" id="sub-{key}">
{subs}
            </ul>
          </li>''')
    return "\n".join(items)


def crumbs_html(L, crumbs):
    if not crumbs:
        return ""
    parts = [f'<li><a href="index.html">{L["home"]}</a></li>']
    for label, href in crumbs:
        if href:
            parts.append(f'<li><a href="{href}">{label}</a></li>')
        else:
            parts.append(f'<li aria-current="page">{label}</li>')
    return f'    <nav class="crumbs wrap" aria-label="{L["crumbs_label"]}"><ol>' + "".join(parts) + "</ol></nav>"


def exists(lang, filename):
    return (LANGS[lang]["src"] / "pages" / filename).is_file()


def page_url(lang, filename):
    base = f"{SITE}/{LANGS[lang]['path']}"
    return base if filename == "index.html" else base + filename


def lang_switch_html(lang, filename):
    """Nút VI | EN. Trang không có bản ngôn ngữ kia thì trỏ về trang chủ của ngôn ngữ đó."""
    up = "../" if LANGS[lang]["path"] else ""
    links = []
    for code in LANGS:
        target = filename if exists(code, filename) else "index.html"
        href = target if code == lang else up + LANGS[code]["path"] + target
        cur = ' aria-current="true"' if code == lang else ""
        links.append(f'<a href="{href}" hreflang="{code}" lang="{code}"{cur}>{code.upper()}</a>')
    return (f'<div class="lang-switch" role="group" aria-label="{LANGS[lang]["switch_label"]}">'
            + "".join(links) + "</div>")


def hreflang_html(filename):
    codes = [code for code in LANGS if exists(code, filename)]
    if len(codes) < 2:
        return ""
    tags = [f'<link rel="alternate" hreflang="{code}" href="{page_url(code, filename)}">' for code in codes]
    tags.append(f'<link rel="alternate" hreflang="x-default" href="{page_url("vi", filename)}">')
    return "\n  ".join(tags)


def strip_tags(s):
    s = re.sub(r"<[^>]+>", "", s)
    return re.sub(r"\s+", " ", html.unescape(s)).strip()


FAQ_RE = re.compile(r"<details[^>]*data-faq-item[^>]*>\s*<summary>(.*?)</summary>\s*<div class=\"faq-a\">(.*?)</div>\s*</details>", re.S)


def faq_items(body):
    return [{"@type": "Question", "name": strip_tags(m.group(1)),
             "acceptedAnswer": {"@type": "Answer", "text": strip_tags(m.group(2))}}
            for m in FAQ_RE.finditer(body)]


ORG = {
    "@type": "Organization",
    "@id": f"{SITE}/#org",
    "name": "Công ty Cổ phần Như Tín",
    "alternateName": "NHUTIN",
    "url": "https://nhutin.com",
    "logo": f"{SITE}/assets/img/nhutin-logo.png",
    "foundingDate": "2010",
    "telephone": PHONE_TEL,
    "email": "[EMAIL]",
    "sameAs": ["https://nhutin.com", "https://bavohatdieu.com"],
}


def business(L):
    return {
        "@type": "LocalBusiness",
        "@id": f"{SITE}/#business",
        "name": L["business"],
        "parentOrganization": {"@id": f"{SITE}/#org"},
        "url": f"{SITE}/{L['path']}",
        "image": f"{SITE}/assets/img/og-image.jpg",
        "telephone": PHONE_TEL,
        "email": "[EMAIL]",
        "taxID": "[MST]",
        "address": {"@type": "PostalAddress", "streetAddress": "222C đường Linh Trung, Phường Linh Xuân",
                    "addressLocality": "Thành phố Hồ Chí Minh", "addressCountry": "VN"},
        "areaServed": "VN",
    }


def schema(L, meta, body, filename, url):
    graph = [ORG]
    kinds = meta.get("schema", [])
    if "business" in kinds:
        graph.append(business(L))
    if "product" in kinds:
        p = meta["product"]
        graph.append({
            "@type": "Product",
            "name": p["name"],
            "description": p["description"],
            "brand": {"@type": "Brand", "name": "HALLCO®"},
            "manufacturer": {"@type": "Organization", "name": "HALLCO Industries, Inc.", "url": "https://www.hallcoindustries.com"},
            "image": f"{SITE}/assets/img/{p['image']}",
            "category": L["category"],
            "url": url,
        })
    faqs = faq_items(body)
    if faqs and "faq" in kinds:
        graph.append({"@type": "FAQPage", "mainEntity": faqs})
    if meta.get("crumbs"):
        base = f"{SITE}/{L['path']}"
        items = [{"@type": "ListItem", "position": 1, "name": L["home"], "item": base}]
        for i, (label, href) in enumerate(meta["crumbs"], start=2):
            items.append({"@type": "ListItem", "position": i, "name": label, "item": base + (href or filename)})
        graph.append({"@type": "BreadcrumbList", "itemListElement": items})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, indent=2)


# Cụm không được ngắt dòng (dấu gạch nối hay khoảng trắng bên trong): bọc bằng <span class="nw">
NOWRAP = re.compile(r"(?<![\w-])(i-(?:Series|\d{4})|NLR-HD|[Rr]ơ-moóc|0907 917 301|0907\.917\.301)(?![\w-])")
SKIP_TAGS = {"script", "style", "title", "option", "textarea"}


def protect_terms(html_text):
    """Bọc các cụm trong NOWRAP, chỉ ở phần chữ hiển thị (không trong thẻ, thuộc tính hay SKIP_TAGS)."""
    out, skip = [], []
    for part in re.split(r"(<[^>]+>)", html_text):
        if part.startswith("<"):
            m = re.match(r"<(/?)([a-zA-Z0-9]+)", part)
            if m:
                tag = m.group(2).lower()
                if tag in SKIP_TAGS:
                    if m.group(1):
                        if skip and skip[-1] == tag:
                            skip.pop()
                    elif not part.endswith("/>"):
                        skip.append(tag)
            out.append(part)
        elif skip or not part.strip():
            out.append(part)
        else:
            out.append(NOWRAP.sub(r'<span class="nw">\1</span>', part))
    return "".join(out)


# Trang ở thư mục con (en/): đường dẫn tới ảnh, CSS, JS, send.php phải lùi một cấp
SHARED_ATTR = re.compile(r'((?:src|href|action|poster|srcset)=")((?:assets|css|js)/|favicon\.ico|site\.webmanifest|send\.php)')
SRCSET = re.compile(r'srcset="([^"]*)"')


def relocate(html_text):
    html_text = SHARED_ATTR.sub(r"\1../\2", html_text)
    return SRCSET.sub(lambda m: 'srcset="' + re.sub(r"(,\s*)(assets/)", r"\1../\2", m.group(1)) + '"', html_text)


def build_chatbot_kb(lang):
    """Gộp các câu ở trang Hỏi đáp với chatbot/kb.json của ngôn ngữ đó thành js/chatbot-kb*.js."""
    L = LANGS[lang]
    kb = json.loads(read(L["src"] / "chatbot" / "kb.json"))
    faq_body = parse_page(L["src"] / "pages" / "hoi-dap.html")[1]
    extra_kw = kb.get("faq_keywords", {})
    faq_actions = kb.get("faq_actions", {})
    entries = []
    for i, m in enumerate(FAQ_RE.finditer(faq_body), start=1):
        q = strip_tags(m.group(1))
        if q not in extra_kw:
            print(f"  lưu ý ({lang}): câu hỏi đáp \"{q}\" chưa có từ khóa trong chatbot/kb.json")
        entry = {"id": f"faq-{i}", "q": q, "a": m.group(2).strip(),
                 "keywords": extra_kw.get(q, []), "link": "hoi-dap.html"}
        if q in faq_actions:
            entry["actions"] = faq_actions[q]
        entries.append(entry)
    missing = (set(extra_kw) | set(faq_actions)) - {e["q"] for e in entries}
    if missing:
        raise SystemExit(f"{lang}/chatbot/kb.json: không còn câu hỏi đáp {sorted(missing)}")
    entries += kb["entries"]
    js = ("/* Sinh tự động bởi tools/build.py từ trang Hỏi đáp và chatbot/kb.json. Không sửa tay. */\n"
          "window.NT_KB = " + json.dumps(entries, ensure_ascii=False, separators=(",", ":")) + ";\n")
    (ROOT / L["kb_out"]).write_text(js, encoding="utf-8")
    print(f"đã tạo {L['kb_out']} với {len(entries)} mục")


def expand(body, partials):
    def cta(m):
        return partials["cta"].replace("{{text}}", m.group(1).strip())
    body = re.sub(r"\{\{cta:\s*(.*?)\}\}", cta, body)
    body = re.sub(r"\{\{include:\s*([\w-]+)\s*\}\}", lambda m: partials[m.group(1)], body)
    return body


def build_lang(lang, sitemap):
    L = LANGS[lang]
    partials = {p.stem: read(p).rstrip("\n") for p in (SRC / "partials").glob("*.html")}
    if L["src"] != SRC:
        partials.update({p.stem: read(p).rstrip("\n") for p in (L["src"] / "partials").glob("*.html")})
    layout = read(L["src"] / "layout.html")
    L["out"].mkdir(exist_ok=True)
    for path in sorted((L["src"] / "pages").glob("*.html")):
        meta, body = parse_page(path)
        filename = path.name
        url = page_url(lang, filename)
        body = expand(body, partials)
        preloads = "\n".join(
            f'  <link rel="preload" href="{p["href"]}" as="{p["as"]}"'
            + (f' type="{p["type"]}"' if p.get("type") else "")
            + (f' media="{p["media"]}"' if p.get("media") else "")
            + (" crossorigin" if p["as"] == "font" else "")
            + ">"
            for p in meta.get("preload", [])
        )
        noindex = meta.get("noindex")
        repl = {
            "title": html.escape(meta["title"], quote=False),
            "description": html.escape(meta["description"]),
            "og_title": html.escape(meta.get("og_title", meta["title"])),
            "canonical": url,
            "hreflang": "" if noindex else hreflang_html(filename),
            "og_image": f"{SITE}/assets/img/{meta.get('og_image', 'og-image.jpg')}",
            "preloads": preloads,
            "jsonld": schema(L, meta, body, filename, url),
            "sprite": partials["sprite"],
            "nav": nav_html(L, meta.get("nav", ""), filename),
            "lang_switch": lang_switch_html(lang, filename),
            "crumbs": crumbs_html(L, meta.get("crumbs")),
            "content": body.strip("\n"),
            "footer": partials["footer"],
            "float": partials["float"],
            "chatbot": partials["chatbot"],
            # 404: noindex và base="/" để CSS, ảnh vẫn đúng khi lỗi xảy ra ở đường dẫn nhiều cấp
            "robots": '<meta name="robots" content="noindex">\n  <base href="/">' if noindex else "",
        }
        out = layout
        for k, v in repl.items():
            out = out.replace("{{" + k + "}}", v)
        b = out.index("<body>")
        out = out[:b] + protect_terms(out[b:])
        if L["path"]:
            out = relocate(out)
        leftover = re.findall(r"\{\{[^}]+\}\}", out)
        if leftover:
            raise SystemExit(f"{lang}/{filename}: còn chỗ chưa thay {leftover}")
        (L["out"] / filename).write_text(out, encoding="utf-8")
        if not noindex:
            sitemap.append((url, meta.get("priority", 0.7)))
        print("đã tạo", L["path"] + filename)
    build_chatbot_kb(lang)


def build():
    sys.stdout.reconfigure(encoding="utf-8")  # console Windows mặc định cp1252
    sitemap = []
    for lang in LANGS:
        build_lang(lang, sitemap)

    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             f"<!-- Sinh tự động bởi tools/build.py. Tên miền: {SITE} (đổi trong tools/build.py) -->",
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for url, pr in sorted(sitemap, key=lambda x: -x[1]):
        lines.append(f"  <url><loc>{url}</loc><lastmod>{TODAY}</lastmod><priority>{pr:.1f}</priority></url>")
    lines.append("</urlset>")
    (ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("đã tạo sitemap.xml với", len(sitemap), "trang")


if __name__ == "__main__":
    build()
