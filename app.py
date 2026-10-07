import os
from urllib.parse import quote, urlparse

from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    send_from_directory,
)
from werkzeug.middleware.proxy_fix import ProxyFix

from translations import TRANSLATIONS

app = Flask(__name__)

# Jika berada di belakang Nginx/Cloudflare, aktifkan dengan TRUST_PROXY=1.
# Jangan mengaktifkannya jika Flask menerima trafik internet secara langsung.
if os.environ.get("TRUST_PROXY") == "1":
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

# Batasi Host header pada production. Set TRUSTED_HOSTS, misalnya:
# TRUSTED_HOSTS=example.com,www.example.com
_trusted_hosts = os.environ.get("TRUSTED_HOSTS", "").strip()
if _trusted_hosts:
    app.config["TRUSTED_HOSTS"] = [
        host.strip() for host in _trusted_hosts.split(",") if host.strip()
    ]

# Mode pengembangan hanya aktif kalau FLASK_DEBUG=1 diset secara eksplisit.
DEV_MODE = os.environ.get("FLASK_DEBUG") == "1"

# SECRET_KEY wajib diset lewat environment variable saat produksi, mis.:
#   python -c "import secrets; print(secrets.token_hex(32))"
# Jangan menulis kunci rahasia langsung di kode atau menyimpannya di repo.
_secret = os.environ.get("SECRET_KEY")
if not _secret:
    if DEV_MODE:
        _secret = "kunci-khusus-pengembangan-lokal"
    else:
        raise RuntimeError(
            "SECRET_KEY belum diset. Buat dengan: "
            'python -c "import secrets; print(secrets.token_hex(32))" '
            "lalu set sebagai environment variable. "
            "Untuk uji lokal, jalankan dengan FLASK_DEBUG=1."
        )
app.secret_key = _secret

app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=not DEV_MODE,  # cookie hanya dikirim lewat HTTPS
    MAX_CONTENT_LENGTH=1024 * 1024,  # situs ini tidak menerima unggahan
)

# Kebijakan konten: hanya sumber yang memang dipakai situs ini.
CSP = "; ".join(
    [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data:",
        "frame-src https://www.google.com",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
    ]
)


@app.after_request
def security_headers(resp):
    resp.headers.setdefault("Content-Security-Policy", CSP)
    resp.headers.setdefault("X-Content-Type-Options", "nosniff")
    resp.headers.setdefault("X-Frame-Options", "DENY")
    resp.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    resp.headers.setdefault(
        "Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"
    )
    if request.is_secure:
        resp.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
    return resp

DEFAULT_LANG = "id"

NAV_ITEMS = [
    {"slug": "home", "endpoint": "home"},
    {"slug": "about", "endpoint": "about"},
    {"slug": "collection", "endpoint": "collection"},
    {"slug": "craft", "endpoint": "craft"},
    {"slug": "packages", "endpoint": "packages"},
    {"slug": "contact", "endpoint": "contact"},
]

# Nomor WhatsApp untuk booking (format internasional tanpa +).
WHATSAPP_NUMBER = "628881036377"
WHATSAPP_DISPLAY = "08881036377"

# Paket & harga (dari brosur pricelist Nov 2024). Harga dan ukuran kain diatur
# di sini; nama, deskripsi, dan daftar fasilitas ada di translations.py
# (bagian "packages"). sizes = lebar x tinggi kain dalam cm, dipakai untuk
# menggambar kain sesuai skala.
PACKAGE_GROUPS = [
    {
        "slug": "kids",
        "packages": [
            {"slug": "basic1", "price": 150000, "sizes": [(35, 35)]},
        ],
    },
    {
        "slug": "adult",
        "packages": [
            {"slug": "basic_plus", "price": 175000, "sizes": [(50, 50)]},
            {"slug": "basic2", "price": 250000, "sizes": [(35, 115)]},
        ],
    },
    {
        "slug": "deep",
        "packages": [
            {"slug": "cap", "price": 550000, "sizes": [(100, 200)]},
            {
                "slug": "terampil",
                "price": 1500000,
                "sizes": [(105, 35), (50, 105), (100, 200)],
            },
        ],
    },
]


# Tiga paket yang ditampilkan di beranda (satu per kelompok).
FEATURED_PACKAGES = ["basic1", "basic_plus", "terampil"]

# Indeks fakta (dari daftar "facts" di translations.py) yang tampil di kartu
# beranda. Ukuran kain sengaja tidak ditulis ulang karena sudah digambar di
# kartu; durasi/jumlah pertemuan ditampilkan karena itu yang dicari tamu.
# Skala gambar kain per kartu (px per cm) dan ukuran 1 kotak papan ukur (cm).
# Kain Basic digambar besar supaya terlihat jelas; Terampil berisi tiga kain
# (hingga 2 m) sehingga skalanya lebih kecil. Keterangan "1 kotak = ... cm"
# di kartu menyesuaikan, jadi ukuran tetap terbaca benar.
FEATURED_SCALE = {
    "basic1": {"scale": 3.4, "cell": 10},
    "basic_plus": {"scale": 3.4, "cell": 10},
    "terampil": {"scale": 0.85, "cell": 50},
}

FEATURED_FACTS = {
    "basic1": [0, 2, 3],
    "basic_plus": [0, 2, 3],
    "terampil": [0, 4, 6],
}


def featured_packages():
    lookup = {}
    for group in PACKAGE_GROUPS:
        for pkg in group["packages"]:
            lookup[pkg["slug"]] = dict(pkg, group=group["slug"])
    return [
        dict(lookup[slug], home_facts=FEATURED_FACTS[slug], **FEATURED_SCALE[slug])
        for slug in FEATURED_PACKAGES
    ]


def min_price():
    return min(pkg["price"] for g in PACKAGE_GROUPS for pkg in g["packages"])


def get_lang():
    lang = session.get("lang", DEFAULT_LANG)
    return lang if lang in TRANSLATIONS else DEFAULT_LANG


def t(key, **kwargs):
    """Ambil teks terjemahan lewat path bertitik, mis. t('home.hero.title').
    Jatuh balik ke Bahasa Indonesia kalau key belum ada di bahasa aktif."""
    def lookup(lang_code):
        node = TRANSLATIONS.get(lang_code, {})
        for part in key.split("."):
            if isinstance(node, dict) and part in node:
                node = node[part]
            else:
                return None
        return node

    value = lookup(get_lang())
    if value is None:
        value = lookup(DEFAULT_LANG)
    if value is None:
        return key
    if isinstance(value, str) and kwargs:
        return value.format(**kwargs)
    return value


def wa_link(message=""):
    """Tautan WhatsApp ke nomor booking, dengan pesan yang sudah terisi."""
    url = f"https://wa.me/{WHATSAPP_NUMBER}"
    return f"{url}?text={quote(message)}" if message else url


@app.template_filter("rupiah")
def rupiah(value):
    if get_lang() == "en":
        return f"IDR {value:,}"
    return "Rp " + f"{value:,}".replace(",", ".")


def asset_v(filename):
    """Penanda versi file statis (waktu ubah file) supaya browser memuat ulang CSS/JS yang baru."""
    try:
        return int(os.path.getmtime(os.path.join(app.root_path, "static", filename)))
    except OSError:
        return 0


@app.context_processor
def inject_i18n():
    return {
        "asset_v": asset_v,
        "t": t,
        "lang": get_lang(),
        "nav_items": NAV_ITEMS,
        "wa_link": wa_link,
        "wa_display": WHATSAPP_DISPLAY,
    }


def safe_back_url():
    """Kembali ke halaman asal hanya kalau masih di situs ini (cegah open redirect)."""
    ref = request.referrer
    if ref:
        parsed = urlparse(ref)
        if parsed.scheme in ("http", "https") and parsed.netloc == request.host:
            return ref
    return url_for("home")


@app.route("/lang/<code>")
def set_lang(code):
    if code in TRANSLATIONS:
        session["lang"] = code
    return redirect(safe_back_url())


@app.route("/")
def home():
    return render_template(
        "home.html",
        active="home",
        featured=featured_packages(),
        min_price=min_price(),
    )


@app.route("/about")
def about():
    return render_template("about.html", active="about")


@app.route("/collection")
def collection():
    return render_template("collection.html", active="collection")


@app.route("/our-craft")
def craft():
    return render_template("craft.html", active="craft")


@app.route("/paket")
def packages():
    return render_template("packages.html", active="packages", groups=PACKAGE_GROUPS)


@app.route("/unduh-brosur")
def download_brochure():
    # Dikirim sebagai lampiran (Content-Disposition: attachment) supaya langsung
    # terunduh di semua browser, termasuk iOS Safari dan browser dalam aplikasi
    # (Instagram/WhatsApp) yang mengabaikan atribut `download` pada tautan.
    return send_from_directory(
        os.path.join(app.root_path, "static", "files"),
        "brosur-kembang-mayang.pdf",
        mimetype="application/pdf",
        as_attachment=True,
        download_name="Brosur-Kembang-Mayang.pdf",
    )


@app.route("/contact")
def contact():
    return render_template("contact.html", active="contact")


@app.errorhandler(404)
def not_found(error):
    return render_template("404.html"), 404


@app.errorhandler(500)
def internal_error(error):
    # Jangan tampilkan traceback atau detail exception ke pengunjung.
    return render_template("500.html"), 500


if __name__ == "__main__":
    app.run(debug=DEV_MODE)
