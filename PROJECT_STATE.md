# PROJECT_STATE

## Projenin Mevcut Durumu

APINEX su an `Data / Analytics AI` odaginda ilerliyor.

Aktif cekirdek sistemler:

- `Scout Bee`: Product Hunt verisini cekip pazar sinyali raporu uretir
- `PainHive`: SaaS yorumlarindan aci noktasi cikarir

## Aktif Rotalar

- `GET /api/status`
- `GET /api/scout/producthunt`
- `GET /api/scout/producthunt/detayli-incele`
- `POST /api/review-engine/analyze`

## Ana Dosyalar

- `server.js`: aktif sunucu ve analiz mantigi
- `apinex-config.json`: kural setleri, skorlama ve yorum motoru sozlukleri
- `.env.example`: gerekli ortam degiskenlerinin sablonu
- `README.md`: hizli kurulum ve geri donus rehberi

## Son Eklenen Cekirdek

`PainHive` v1:

- yorum temizleme
- tekrar ayiklama
- negatif sinyal tespiti
- aci etiketi esleme
- aci noktasi kumelendirme
- veri temizligi skoru
- yonetici ozeti

## Ilk Tasarlanan Aci Etiketleri

- `fiyat_pahali`
- `kurulum_karmasik`
- `kullanim_zor`
- `entegrasyon_sorunu`
- `destek_zayif`
- `eksik_ozellik`
- `performans_sorunu`
- `olcumleme_zayif`

## Sonraki Dogal Adimlar

1. Yorumdan aci etiketi cikarma mantigini daha akilli hale getirmek
2. Kategori bazli bosluk skoru eklemek
3. Gercek G2 / Capterra / TrustRadius veri katmanini baglamak
4. Acilar -> firsatlar -> urun hipotezi hattini kurmak

## V1 Canliya Cikis Karari

Bu haftaki uygulama karari:

- yeni analiz ozelligi eklemek yerine urunlestirme odagina gecildi
- backend icin resmi 4 rota sabitlendi
- frontend icin resmi 4 ekran hedefi belirlendi
- v2'ye atilacak konular donduruldu
- backend basari cevaplari ortaklasti ve package scriptleri toparlandi
- bu noktadan sonra ana efor frontend tarafina kaydirildi

Domain stratejisi:

- v1 ilk cikista frontend icin `https://apinex-ui.vercel.app` benzeri Vercel domaini kullanilacak
- v1 ilk cikista backend icin `https://apinex-api.onrender.com` benzeri platform domaini kullanilacak
- `app.apinex.ai` ve `api.apinex.ai` gibi ozel domainler ikinci asamaya birakildi

Bu kararlarin tek referans dokumani:

- `docs/v1-launch-contract.md`

## Geri Donus Sirasi

Birisi projeyi ilk kez acacaksa su sirayla okusun:

1. `README.md`
2. `PROJECT_STATE.md`
3. `docs/v1-launch-contract.md`
4. `docs/architecture.md`
5. `docs/review-engine.md`
6. `examples/review-analysis-request.json`
7. `examples/review-analysis-response.json`
