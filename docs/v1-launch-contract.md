# APINEX V1 Launch Contract

## Amac

Bu dokumanin amaci, APINEX v1 icin canliya cikis sinirini netlestirmektir.

Bu hafta kural su:

`Yeni analiz ozelligi ekleme yok. Urunlestirme var.`

## V1 Hedefi

V1 sonunda kullanici sunlari yapabilmeli:

1. Sistemin ne yaptigini anlamak
2. Yorum verisini girmek
3. Analiz sonucunu okumak
4. Scout Bee ciktilarini gormek

## Backend Icinde Resmi 4 Rota

V1 icin yeterli kabul edilen rotalar:

- `GET /api/status`
- `POST /api/review-engine/analyze`
- `GET /api/scout/producthunt`
- `GET /api/scout/producthunt/detayli-incele`

Bu hafta yeni rota acilmayacak.

## Frontend Icinde Resmi 4 Ekran

V1 icin yeterli kabul edilen ekranlar:

1. `Ana sayfa`
2. `Review Analyze ekrani`
3. `Sonuc ekrani`
4. `Scout ekrani`

Bu hafta ek dashboard, ayar paneli veya kullanici paneli yapilmayacak.

Frontend teknoloji secimi:

- `Vite + React`

## Frontend'in Okuyacagi Ana Alanlar

`POST /api/review-engine/analyze` sonucunda frontend icin resmi kabul edilen alanlar:

- `urun`
- `baskin_aci_noktalari`
- `eyleme_donuk_firsatlar`
- `karantina_havuzu`
- `ikincil_inceleme_ozeti`
- `karantina_sinyal_etiketleri`
- `yonetici_ozeti`

Bu alanlar v1 boyunca frontend sozlesmesi olarak kabul edilir.

## Backend Tarafinda Bu Hafta Yapilacak En Kritik 4 Is

1. `Istek dogrulama`
2. `Tek tip hata cevabi`
3. `Temel loglama`
4. `Canli ortam hazirligi`

## Hata Cevabi Sozlesmesi

V1 boyunca hata cevaplari mumkun oldugunca ortak sekilde doner.

Temel yapi:

- `durum`
- `servis`
- `hata.kod`
- `hata.mesaj`
- `hata.detaylar`
- `zaman_damgasi`

`review-engine` icin gecerli olmayan isteklerde ayrica:

- `ornek_govde`

geri doner.

## Temel Loglama Sozlesmesi

V1 icin loglama sade tutulur.

Her API isteginde en az su bilgiler konsola yazilir:

- HTTP method
- istek yolu
- HTTP durum kodu
- sonuc etiketi
- islem suresi

Sonuc etiketi su seviyelerden biri olur:

- `basarili`
- `istemci_hatasi`
- `sunucu_hatasi`

## Canli Ortam Hazirligi

V1 icin canli ortamda en az su degiskenler net olmali:

- `PORT`
- `NODE_ENV`
- `CLIENT_ORIGIN`
- `PRODUCT_HUNT_DEVELOPER_TOKEN`

`CLIENT_ORIGIN`, frontend'in hangi adresten API'ye erisecegini belirler.
Birden fazla frontend adresi varsa virgulle ayrilarak yazilabilir.

V1 kuralı:

- gelistirmede esnek davran
- canlida izinli originleri net tanimla
- CORS reddini API hata formatiyla don

## Bu Hafta Dondurulan Konular

V2'ye birakilan alanlar:

- yeni analiz katmani ekleme
- yeni aci etiketi ekleme
- yeni rota ekleme
- veritabani
- kullanici hesabi
- odeme sistemi
- Scout Bee ile PainHive otomatik koprusu
- cok servisli mimari

## Backend Dondurma Notu

Basari cevaplari ortak API ust yapisina yaklastirildiktan ve scriptler toparlandiktan sonra backend v1 icin dondurulur.

Bu noktadan sonra:

- yeni analiz ozelligi eklenmez
- sadece kritik bug duzeltmesi yapilir
- ana efor frontend tarafina kayar

## Sonuc

V1'in basari kosulu su:

`Backend sabit, frontend sade, canli surum erisilebilir.`
