# APINEX Architecture

## Cekirdek Yaklasim

APINEX, veriyi once toplar, sonra temizler, sonra rapora cevirir.

Ana akis:

`Veri -> Temizleme -> Analiz -> Icgoru -> Karar`

## Aktif Bilesenler

### Queen Bee

Merkezi kontrol mantigi. Su an dogrudan ayri servis olarak degil, `server.js` icindeki genel orkestrasyon mantiginda duruyor.

### Scout Bee

Product Hunt kaynagini tarar.

Urettigi seyler:

- genel skor
- stratejik aday filtresi
- notebook metni
- podcast metni
- yonetici ozeti

### PainHive

SaaS yorumlarini analiz eder.

Urettigi seyler:

- veri temizligi skoru
- baskin aci noktasi
- aci noktasi sayisi
- kaynak ozeti
- yonetici ozeti

## Kural Merkezi

`apinex-config.json` icinde tutulur.

Buradaki bolumler:

- `scout_bee_scoring`
- `scout_bee_detailed_analysis`
- `review_analysis_engine`

## Veri Felsefesi

APINEX icin ilk kural:

`Veri temizligi, diger tum optimizasyonlardan once gelir.`

Bu nedenle yorum motorunda:

- desteklenen kaynak listesi
- kaynak agirliklari
- minimum yorum boyu
- negatif sinyal anahtar kelimeleri
- aci taksonomisi

ayri tutulur.

## Dosya Rolleri

- `server.js`: aktif uygulama mantigi
- `apinex-config.json`: davranis ve analiz kurallari
- `README.md`: kullanim rehberi
- `PROJECT_STATE.md`: hizli durum ozeti
- `docs/review-engine.md`: yorum motoru ayrintisi
- `examples/`: test girdi ve ciktilari
