# PainHive Review Engine

## Amac

PainHive, SaaS urun yorumlarini alip tekrar eden aci noktalarini cikarmak icin tasarlandi.

Temel hedef:

`yorum -> siniflandirma -> etiket -> aci -> oruntu -> yonetici ozeti -> urun firsati`

## Beklenen Girdi

`POST /api/review-engine/analyze`

Govde:

```json
{
  "product": "Drift",
  "reviews": [
    {
      "source": "G2",
      "rating": 2,
      "title": "Powerful but expensive",
      "body": "The platform is powerful but pricing is too expensive and setup is confusing."
    }
  ]
}
```

## Girdi Dogrulama

Bu rota artik gelen istegi daha net kontrol eder.

En az su kurallar beklenir:

- istek govdesi gecerli bir JSON nesnesi olmali
- `reviews` alani dizi olmali
- `reviews` bos olmamali
- her yorum nesne olmali
- her yorumda en azindan `body` veya `title` dolu olmali
- varsa `rating` sayisal olmali

Gecersiz isteklerde hata cevabi ortak bir formatta doner:

- `durum`
- `servis`
- `hata.kod`
- `hata.mesaj`
- `hata.detaylar`
- `ornek_govde`

## Isleme Adimlari

1. Yorum normalize edilir
2. Kaynak adi normalize edilir
3. Yorum ana akis, karantina veya eleme olarak siniflandirilir
4. Ana akistaki tekrarlayan yorumlar ayiklanir
5. Negatif yorum sinyali aranir
6. Aci etiketleri bulunur
7. Etiketler kume haline getirilir
8. Siddet skoru hesaplanir
9. En baskin aci noktasi raporlanir
10. Aci noktalarindan eyleme donuk firsatlar uretilir

## Ilk Acı Etiketleri

- `fiyat_pahali`
- `kurulum_karmasik`
- `kullanim_zor`
- `entegrasyon_sorunu`
- `destek_zayif`
- `eksik_ozellik`
- `performans_sorunu`
- `olcumleme_zayif`

## Veri Temizligi Skoru

Bu skor su sinyallerden hesaplanir:

- yorum govdesi yeterli uzunlukta mi
- desteklenen kaynak mi
- tekrar sayisi ne kadar

Ama su an ilk surum oldugu icin basit hesap kullanilir.

## Cikti

Motor sunlari dondurur:

- `toplam_yorum`
- `islenen_yorum`
- `negatif_yorum_sayisi`
- `karantina_yorum_sayisi`
- `elenen_yorum_sayisi`
- `veri_temizligi_skoru`
- `kaynak_ozeti`
- `baskin_aci_noktalari`
- `karantina_havuzu`
- `ikincil_inceleme_ozeti`
- `karantina_sinyal_etiketleri`
- `yonetici_ozeti`
- `eyleme_donuk_firsatlar`

## Karantina Havuzu

Bu katmanin amaci, kalite esigini gecemeyen ama yine de degerli sinyal tasiyan yorumlari tamamen kaybetmemektir.

Kisaca mantik su:

- yeterince uzun yorumlar ana analize gider
- fazla kisa ama negatif puanli veya guclu duygu tasiyan yorumlar `karantina_havuzu` alanina dusurulur
- cok zayif ve anlamsiz yorumlar tamamen elenir

Karantina havuzundaki yorumlar bu asamada ana aci skoru hesabina katilmaz.
Sadece ikinci inceleme icin saklanir.

Her karantina kaydi su alanlari icerir:

- `kaynak`
- `puan`
- `baslik`
- `alinti`
- `karakter_sayisi`
- `kelime_sayisi`
- `inceleme_durumu`
- `nedenler`

`nedenler` alaninda yorumun neden karantinaya alindigi yazilir.
Ornek nedenler:

- `short_negative_rating`
- `negative_keyword_signal`
- `strong_emotion_signal`

## Ikincil Inceleme Katmani

Bu katmanin amaci, karantinaya dusen yorumlari sadece listelemek yerine onlar icin hafif bir baglam ozeti cikarmaktir.

Yani sistem artik sunu da soyler:

- karantinadaki yorumlarda hangi duygu baskin
- en cok hangi sinyal etiketi tekrar ediyor
- tekrar eden kisa sikayet deseni var mi
- bu grup yorumlar ana rapora not olarak dusmeli mi

Bu katman su an ana aci skoru veya firsat skorunu degistirmez.
Sadece yardimci baglam verir.

`ikincil_inceleme_ozeti` icindeki temel alanlar:

- `durum`
- `karantina_kaynagi_sayisi`
- `baskin_duygu`
- `baskin_sinyal`
- `tekrar_eden_kisa_sikayet_desenleri`
- `ana_rapora_not`

`karantina_sinyal_etiketleri` ise karantina havuzunda en cok gorulen sinyal turlerini kisa bir liste olarak dondurur.

## Firsat Katmani

Bu yeni katmanin amaci, sistemi sadece "sorun bulundu" noktasinda birakmamak.

Yani PainHive artik su iki soruya da cevap verir:

1. En baskin aci noktasi ne?
2. Bu acidan hangi urun firsati cikabilir?

Her firsat nesnesi su alanlari icerir:

- `firsat`: pazardaki net bosluk
- `deger_onerisi`: kullaniciya sunulacak vaat
- `urun_hipotezi`: bu boslugu hedefleyen urun veya modul fikri
- `oncelik_seviyesi`: `yuksek`, `orta` veya `dusuk`
- `oncelik_gerekcesi`: neden oncelikli oldugu
- `dayanak_aci_noktasi`: bu firsatin hangi tekrar ve siddet verisine dayandigi

Bu ilk surumde firsatlar serbest AI uretimi ile degil, kural bazli sablonlarla uretilir.
Boylece ciktilar daha aciklanabilir, daha kararlı ve test edilmesi daha kolay olur.

## Sonraki Gelistirmeler

- daha akilli duygu analizi
- kategori bazli bosluk skoru
- kaynak bazli zaman trendi
- urunler arasi karsilastirma
- AI destekli yorum kumelendirme
