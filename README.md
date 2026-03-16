# APINEX

APINEX, veri toplama, pazar okuma ve yapay zeka destekli icgoru uretimi odakli bir `Data / Analytics AI` projesidir.

## Mevcut Odak

Su an projedeki ana cekirdek:

- `PainHive`: SaaS yorum analizi ve aci noktasi cikarma motoru
- `Scout Bee`: Product Hunt verisini toplayan ve raporlayan pazar tarama katmani

## Calisan Rotalar

### Sunucu durumu

- `GET /api/status`

### Product Hunt tarama

- `GET /api/scout/producthunt`
- `GET /api/scout/producthunt/detayli-incele`

### Yorum analizi motoru

- `POST /api/review-engine/analyze`

## Hizli Baslangic

### 1. Bagimliliklari kur

```bash
npm install
```

### 2. Ortam degiskenlerini hazirla

`.env.example` dosyasini referans al ve `.env` olustur.

Gerekli alan:

```env
PORT=3000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
PRODUCT_HUNT_DEVELOPER_TOKEN=buraya_token
```

Not:

- `CLIENT_ORIGIN`, frontend'in gelecegi adresi belirtir
- birden fazla origin gerekiyorsa virgulle yazilabilir
- ornek: `CLIENT_ORIGIN=https://apinex-ui.vercel.app,https://www.apinex.ai`

### 3. Sunucuyu calistir

```bash
npm run dev
```

Canli benzeri calistirma:

```bash
npm start
```

### 4. Frontend'i calistir

Frontend klasoru:

- `frontend/`

Ortam degiskeni:

```env
VITE_API_BASE_URL=http://localhost:3000
```

Frontend gelistirme:

```bash
npm run frontend:dev
```

Frontend build kontrolu:

```bash
npm run frontend:build
```

Frontend canli ortam degiskeni:

```env
VITE_API_BASE_URL=https://apinex-api.onrender.com
```

Not:

- Degerin sonunda gereksiz `/` birakma
- Vercel tarafinda bu degisken `frontend` projesine tanimlanmali
- V1 icin hizli ve ucuz cikista backend ornegi olarak `Render` varsayildi
- 2. asamada bu alan `https://api.apinex.ai` olarak degistirilebilir

### 5. Frontend'i Vercel'e cikar

Vercel uzerinde en sade kurulum:

1. Projeyi import et.
2. `Root Directory` olarak `frontend` sec.
3. `Install Command`: `npm install`
4. `Build Command`: `npm run build`
5. `Output Directory`: `dist`
6. `Environment Variable`: `VITE_API_BASE_URL=https://apinex-api.onrender.com`

Backend tarafinda ayni anda su alan da guncellenmeli:

```env
CLIENT_ORIGIN=https://apinex-ui.vercel.app
```

Not:

- Birden fazla origin gerekiyorsa virgulle ayrilabilir.
- `frontend/vercel.json`, `BrowserRouter` alt sayfalarinin yenilemede 404 vermemesi icin eklendi.
- Ozel domain almadan ilk cikista onerilen cift su: `https://apinex-ui.vercel.app` + `https://apinex-api.onrender.com`
- Uygulama ilk meyvesini verdikten sonra profesyonel gecis su olabilir: `https://app.apinex.ai` + `https://api.apinex.ai`

## Ornek Testler

### Review engine ornek istegi

Dosya:

- `examples/review-analysis-request.json`

PowerShell ile test:

```powershell
$body = Get-Content ".\examples\review-analysis-request.json" -Raw
Invoke-WebRequest -UseBasicParsing -Method POST -Uri "http://localhost:3000/api/review-engine/analyze" -ContentType "application/json" -Body $body | Select-Object -ExpandProperty Content
```

### Beklenen ornek cevap

- `examples/review-analysis-response.json`

## Geri Donus Dosyalari

Projeyi tekrar ayaga kaldirmak icin once su dosyalari oku:

1. `PROJECT_STATE.md`
2. `docs/v1-launch-contract.md`
3. `docs/architecture.md`
4. `docs/review-engine.md`
5. `examples/review-analysis-request.json`
6. `examples/review-analysis-response.json`

## V1 Canliya Cikis Siniri

Bu hafta icin urunlestirme referansi:

- `docs/v1-launch-contract.md`

Bu dokuman, v1 icin:

- resmi 4 backend rotayi
- resmi 4 frontend ekrani
- frontend'in okuyacagi veri alanlarini
- bu hafta dondurulan konulari

tek yerde toplar.

## Notlar

- Gercek gizli anahtarlar `.env` icinde tutulur ve repoya gonderilmez.
- `apinex-config.json` sistem kurallari ve analiz motoru sozluklerini tutar.
- `server.js` su anda tum aktif cekirdek mantigin toplandigi ana dosyadir.
