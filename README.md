# Yazılarım — Web Sitesi

Bu proje, **yazilarim** klasöründeki Markdown yazılarınızı minimalist ve responsive bir web sitesine dönüştürür. Site **GitHub Pages** üzerinde ücretsiz yayınlanabilir; kendi domain’inizi de bağlayabilirsiniz.

## Özellikler

- **Minimalist tasarım** — Okumaya odaklı, sade arayüz
- **Responsive** — Telefon ve tablet uyumlu
- **GitHub Pages uyumlu** — Hosting gerekmez
- **Özel domain** — Kendi domain’inizi bağlayabilirsiniz

## Gereksinimler

- **Python 3** (macOS’ta genelde yüklü) **veya** [Node.js](https://nodejs.org/) (LTS)

## Kurulum ve Derleme

### Python ile (önerilen — Node gerekmez)

1. Markdown kütüphanesini yükleyin:
   ```bash
   python3 -m pip install --user markdown
   ```
   (İsterseniz: `python3 -m pip install -r requirements.txt`)

2. Siteyi derleyin:
   ```bash
   python3 build.py
   ```

3. Bilgisayarınızda görüntülemek için yerel sunucuyu başlatın:
   ```bash
   python3 -m http.server 8000 --directory docs
   ```
   Tarayıcıda **http://localhost:8000** adresini açın.

### Node.js ile

1. `npm install`
2. `npm run build`
3. Yerelde denemek için: `npx serve docs` → http://localhost:3000

## GitHub Pages’e Alma

### 1. Repoyu GitHub’a atın

- GitHub’da yeni bir repo oluşturun (örn. `yazilarim` veya `websitem`).
- Projeyi push edin:
  ```bash
  git init
  git add .
  git commit -m "İlk commit: yazılar ve site"
  git branch -M main
  git remote add origin https://github.com/KULLANICI_ADINIZ/REPO_ADI.git
  git push -u origin main
  ```

### 2. GitHub Pages’i açın

- Repo sayfasında **Settings** → **Pages**.
- **Source**: “Deploy from a branch” seçin.
- **Branch**: `main`, **Folder**: `/docs` seçin.
- Save.

Birkaç dakika sonra site şu adreste yayında olur:
- `https://KULLANICI_ADINIZ.github.io/REPO_ADI/`

### 3. Proje sayfası için base path (opsiyonel)

Site adresiniz `...github.io/REPO_ADI/` ise, `build.js` içinde şu satırı düzenleyin:

```js
const BASE = '/REPO_ADI';  // Repo adınızı yazın
```

Sonra tekrar derleyin ve push edin:

```bash
npm run build
git add docs
git commit -m "Base path güncellendi"
git push
```

## Kendi Domain’inizi Bağlama

1. **GitHub’da**
   - Repo → **Settings** → **Pages**.
   - “Custom domain” alanına domain’inizi yazın (örn. `yazilarim.com`) ve Save.

2. **Domain sağlayıcınızda (DNS)**
   - **A kayıtları** ekleyin:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - **Veya** bir **CNAME** kaydı: `www` (veya @) → `KULLANICI_ADINIZ.github.io`

3. **Projede**
   - Repo’da `docs/` içine `CNAME` adında bir dosya oluşturun; içine sadece domain’inizi yazın (örn. `yazilarim.com`). GitHub Pages bu dosyayı build sırasında korur; elle eklemeniz yeterli.

DNS yayılması birkaç dakika ile 48 saat sürebilir.

## Yeni Yazı Eklemek

1. `yazilarim/` klasörüne yeni bir `.md` dosyası ekleyin.
2. Dosyanın ilk satırında başlığı `# Başlık` şeklinde yazın.
3. Tekrar derleyin ve (isteğe göre) push edin:
   ```bash
   npm run build
   git add yazilarim docs
   git commit -m "Yeni yazı eklendi"
   git push
   ```

## Görseller (Attachments)

Bazı yazılarınızda `Attachments/` ile başlayan görsel yolları var. Görsellerin sitede görünmesi için:

- Görselleri `yazilarim/Attachments/` klasörüne koyun **veya**
- Build script’i genişleterek bu görselleri `docs/` altına kopyalayıp HTML’deki yolları buna göre güncelleyebilirsiniz.

Şu an projede `Attachments` klasörü yok; ekledikten sonra gerekirse build’e kopyalama adımı eklenebilir.

## Klasör Yapısı

```
websitem/
├── yazilarim/          # Markdown yazılarınız
├── css/
│   └── style.css       # Site stilleri
├── build.js            # Derleme script’i
├── docs/               # Üretilen site (GitHub Pages buradan yayınlanır)
│   ├── index.html
│   ├── css/
│   └── yazi/
│       └── *.html
├── package.json
└── README.md
```

---

Yazılarınız sadece sizin; bu proje sadece onları web’de sade ve okunaklı göstermek için kullanılıyor.
