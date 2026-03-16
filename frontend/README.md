# APINEX Frontend

Bu klasor, APINEX v1 arayuzunu tutar.

Teknoloji secimi:

- `Vite`
- `React`
- `react-router-dom`

## Ekranlar

- `Ana sayfa`
- `Review Analyze`
- `Sonuc`
- `Scout`

## Lokal gelistirme

1. Bagimliliklari kur:

```bash
npm install
```

2. Ortam degiskenini hazirla:

```env
VITE_API_BASE_URL=http://localhost:3000
```

3. Gelistirme sunucusunu ac:

```bash
npm run dev
```

## Build ve onizleme

Build al:

```bash
npm run build
```

Build ciktisini yerelde gormek icin:

```bash
npm run preview
```

## Canli ortam ayarlari

Frontend sadece tek bir ortam degiskeni okur:

- `VITE_API_BASE_URL`

Kural:

- degerin sonunda gereksiz `/` birakma
- lokal ornek: `http://localhost:3000`
- v1 hizli canli ornek: `https://apinex-api.onrender.com`
- 2. asama profesyonel ornek: `https://api.apinex.ai`

## Vercel dagitimi

Vercel uzerinde en sade kurulum:

1. Projeyi import et.
2. `Root Directory` olarak `frontend` sec.
3. `Install Command` alanina `npm install` yaz.
4. `Build Command` alanina `npm run build` yaz.
5. `Output Directory` alanina `dist` yaz.
6. Ortam degiskeni olarak `VITE_API_BASE_URL=https://apinex-api.onrender.com` ekle.

Not:

- `vercel.json` dosyasi, `BrowserRouter` kullanan alt sayfalarin yenilemede acilmasi icin eklendi.
- Ornek alt sayfalar: `/review`, `/results`, `/scout`
- V1 icin hizli ve ucuz cift: `https://apinex-ui.vercel.app` + `https://apinex-api.onrender.com`
- 2. asamada bu cift `https://app.apinex.ai` + `https://api.apinex.ai` olabilir

## Backend baglantisi

Canli frontend adresin neyse backend tarafindaki `CLIENT_ORIGIN` degerine onu ekle.

Ornek:

```env
CLIENT_ORIGIN=https://apinex-ui.vercel.app
```
