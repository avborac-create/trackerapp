# PRD — Tracker

## 1. Ürün tanımı

Tracker, yapılacak işler listesi değildir. Kullanıcının her gün az da olsa vakit ayırmak istediği alışkanlıkları ve gelişim alanlarını, **haftalık ritim** üzerinden izlediği görsel bir çalışma alanıdır.

Ana fikir: OneNote benzeri serbest/bağlantılı yüzey hissi; fakat gerçek veri kaydı, dokunulabilir günlük işaretler ve haftalık istatistikler.

Bu özellik mevcut web uygulamasına entegre edilecektir. Yeni hosting, ayrı uygulama veya ayrı kullanıcı hesabı oluşturulmayacaktır. Mevcut uygulamanın kimlik doğrulama, veritabanı, tasarım sistemi ve dağıtım yapısı kullanılacaktır.

## 2. Problem

Mevcut Notion sistemi veri bakımından yeterli olsa da haftalık alışkanlıkların görünürlüğü zayıf ve tablo hissi fazla güçlüdür. Canva ise görselleştirme sağlayabilir ama gerçek işaretleme, otomatik haftalık sıfırlama ve istatistik davranışını sağlamaz.

Tracker’ın çözmesi gereken soru:

> Bu hafta hangi alanlara gerçekten temas ettim; hangi alanlar açık, hangileri beklemede ve ritmim nasıl ilerliyor?

## 3. Hedefler

- iPhone ve masaüstünde aynı veriyi sorunsuz kullanmak.
- Her düğüm için Pazartesi–Pazar arasında tek dokunuşla işaret koymak/kaldırmak.
- Haftayı tek, görsel bir yüzeyde görmek; klasik görev tablosu hissi vermemek.
- Her hafta başında aynı sistemin temiz bir haftasını otomatik başlatmak.
- Hafta sonunda tamamlanma oranlarını ve ritmi otomatik görmek.
- Dış durum kodlarını günlük işaretlerden kesin biçimde ayırmak.

## 4. Hedef dışı (V1)

- Hukuk bürosu dosya/müvekkil/takip yönetimi.
- Takvim saat bloklama veya toplantı yönetimi.
- Çok kullanıcılı ekip yetkilendirmesi.
- Bildirim, hatırlatıcı, gamification, AI önerileri.
- Gantt, karmaşık proje yönetimi, bağımlılık grafikleri.

## 5. Temel kavramlar

### 5.1 Düğüm

Takip edilen bir alışkanlık veya gelişim alanı. Örnek: “Math Session”, “Diksiyon”, “Tao Te Ching”.

### 5.2 İç kategori

Her düğüm şu dört kategoriden birine aittir:

- `Eşlikçi`: Günün yanında düzenli duran küçük tekrarlar.
- `Multi`: Birden fazla çalışma hattı olan alanlar.
- `Aktif`: Bu dönemde bilinçli olarak vakit ayrılan alanlar.
- `Pasif`: Açık tutulan ama bu hafta zorunlu olmayan alanlar.

İç kategori, düğümün Tracker içindeki karakteridir; dış durum kodu değildir.

### 5.3 Dış durum kodu

Her düğüm ayrıca tek bir dış durum taşır:

| Kod | Anlamı | Haftalık tiklere etkisi |
|---|---|---|
| `Gelen Kutusu` | Henüz ayrıştırılmamış yeni fikir veya alışkanlık | Haftalık yüzeye girmez |
| `Şimdi Değil` | Açık, fakat şu anda takip edilmeyecek | Haftalık yüzeye girmez |
| `Gündemde` | Aktif olarak haftalık ritimde izlenir | O haftanın tik yüzeyinde görünür |
| `Kapatıldı` | Döngüden çıkarılmıştır | Haftalık yüzeye girmez |

Bir düğümün `Gündemde` olması, o gün yapılmış olduğu anlamına gelmez. Günlük işaretler ayrı veridir.

### 5.4 Hafta

Pazartesi 00:00’da başlayan ve Pazar 23:59’da biten kayıt dönemi. Her hafta bağımsız bir geçmiş kaydıdır.

## 6. Kullanıcı akışları

### A. Yeni düğüm yakalama

1. Kullanıcı hızlı ekleye basar.
2. Yalnızca ad girer.
3. Düğüm varsayılan olarak `Gelen Kutusu`na düşer.
4. Sonradan iç kategori ve dış durum verilebilir.

### B. Haftaya alma

1. Kullanıcı düğümü `Gündemde`ye geçirir.
2. İç kategorisini seçer/değiştirir.
3. Düğüm mevcut haftada ilgili kategori kümesinde görünür.
4. Yedi günün tüm işaretleri başlangıçta boştur.

### C. Günlük kullanım

1. Kullanıcı Tracker’ı açar.
2. Gündemdeki düğümün o güne ait kutusuna dokunur/tıklar.
3. Kutu `tamamlandı` olur; tekrar dokunulursa boş hâle döner.
4. Değişiklik anında kaydedilir; ek “Kaydet” düğmesi gerekmez.

### D. Hafta kapanışı ve yenileme

1. Hafta sonunda kullanıcı “Haftayı Kapat”a basar veya yeni hafta ilk açıldığında sistem otomatik yeni haftayı oluşturur.
2. Kapanan haftanın işaretleri ve istatistikleri sabitlenir.
3. `Gündemde` olan düğümler yeni haftaya aynı kategoriyle taşınır; günlük işaretler temiz başlar.
4. Eski haftalar salt okunur geçmiş olarak açılabilir.

## 7. Ekranlar

### 7.1 Tracker ana ekranı — hafta yüzeyi

Bu ana ekrandır.

- Üst bar: önceki hafta / mevcut hafta / sonraki hafta, hafta tarih aralığı, “Haftayı Kapat”.
- Orta alan: serbest yüzey hissi veren dört görsel kategori kümesi: Eşlikçi, Multi, Aktif, Pasif.
- Her kümede, yalnızca `Gündemde` durumundaki düğüm kartları bulunur.
- Kartta düğüm adı, dış durum etiketi, Pazartesi–Pazar için 7 büyük dokunma alanı ve `x/7` sayaç görünür.
- Sağ veya alt çekmece: Gelen Kutusu, Şimdi Değil ve Kapatıldı. Kart sürükleyerek veya kart menüsüyle durum değiştirilebilir.
- Sağ/alt özet paneli: bu haftaki toplam işaret, mümkün işaret, oran, kategori oranları, düğüm başına `x/7`.

Masaüstünde yüzey geniş ve kümeler bağlantılı/akışkan görünmelidir. Mobilde aynı bilgi dikey kaydırmalı kart görünümüne dönüşebilir; işaret alanları en az 44×44 px dokunma alanı olmalıdır.

### 7.2 Düğüm düzenleme paneli

- Ad
- İç kategori: Eşlikçi / Multi / Aktif / Pasif
- Dış durum: Gelen Kutusu / Şimdi Değil / Gündemde / Kapatıldı
- Silme yerine V1’de `Kapatıldı` önerilir.

### 7.3 Hafta geçmişi

- Haftaların tarih aralığı ve toplam oranı listelenir.
- Bir haftaya dokunulduğunda o haftanın yüzeyi ve istatistikleri açılır.
- Geçmiş hafta varsayılan olarak düzenlenemez.

## 8. İşaretleme kuralları

- Günlük işaret ikili durumdadır: `tamamlandı` veya `boş`.
- Bir düğüm aynı gün için yalnızca tek işaret taşır.
- İşaret yapılınca ilgili düğümün sayacı hemen güncellenir.
- Haftalık oran, o hafta Gündemde bulunan düğümlerin mümkün günlük işaret sayısına göre hesaplanır.
- Bir düğüm hafta ortasında Gündemdeye alınırsa yalnızca dahil edildiği gün ve sonrasındaki günler “mümkün işaret” sayılır. Bu, geçmiş günleri haksız biçimde eksik göstermeyi önler.

## 9. İstatistikler

V1’de otomatik hesaplanacaklar:

- Toplam tamamlanan işaret / mümkün işaret
- Genel haftalık tamamlanma yüzdesi
- İç kategori bazında tamamlanma oranı
- Her düğümün haftalık `x/7` veya `x/n` sonucu
- En çok işaretlenen düğüm
- Gün bazında toplam işaretler (Pzt–Paz)

İstatistikler yalnızca görünür metrik olmalı; kullanıcının ayrıca hesap yapması beklenmemelidir.

## 10. Veri modeli

Mevcut uygulamanın ORM/veritabanı standardına uyarlanmalıdır. İsimler örnektir.

```text
tracker_nodes
- id
- user_id
- title
- category: companion | multi | active | passive
- external_status: inbox | not_now | on_agenda | closed
- created_at
- updated_at

tracker_weeks
- id
- user_id
- starts_on (Pazartesi)
- ends_on (Pazar)
- state: open | closed
- created_at
- closed_at

tracker_week_nodes
- id
- week_id
- node_id
- category_snapshot
- included_on
- removed_on (nullable)
- sort_order

tracker_daily_marks
- id
- week_node_id
- day (date)
- completed (boolean)
- created_at
- updated_at
```

Not: Hafta geçmişinin bozulmaması için kategori ve haftaya dahil edilme bilgisi `tracker_week_nodes` içinde snapshot olarak saklanmalıdır. Düğüm daha sonra kategorisini veya dış durumunu değiştirse bile eski haftalar değişmemelidir.

## 11. Teknik ve UX gereksinimleri

- Mevcut uygulamanın kimlik doğrulamasını ve kullanıcı izolasyonunu kullan.
- Yeni bir hosting/deployment hattı oluşturma.
- Mevcut veritabanını kullan; yeni dış servis zorunluluğu getirme.
- Her tıklama sonra gecikmesiz optimistik arayüz güncellemesi yap; hata olursa geri al ve anlaşılır mesaj göster.
- Mobil öncelikli; iPhone Safari’de düzgün çalışmalı.
- Masaüstünde klavye/mouse ile, mobilde dokunma ile rahat kullanılmalı.
- Erişilebilirlik: işaret kutuları sadece renkle anlaşılmamalı; ✓/boş durum metinsel veya ikonla belli olmalı.
- Haftanın zaman dilimi kullanıcının cihaz saat dilimine göre hesaplanmalı; başlangıç Pazartesi olmalı.
- Veri silme yerine kapatma/arşivleme tercih edilmeli.

## 12. Kabul kriterleri

1. Kullanıcı bir düğümü Gelen Kutusu’na ekleyebilir.
2. Kullanıcı düğümü Gündemdeye alıp dört iç kategoriden birine koyabilir.
3. Gündemdeki kartta yedi günün her biri bağımsız işaretlenebilir.
4. İşaret anında kaydolur; sayfa yenilenince korunur.
5. Aynı hesapla iPhone ve masaüstünde aynı hafta ve işaretler görünür.
6. Haftalık ve kategori bazlı oranlar manuel hesap yapılmadan görüntülenir.
7. Yeni hafta, Gündemde düğümleri taşır fakat günlük tikleri sıfırlar.
8. Eski haftanın verisi sonraki düğüm/durum değişikliklerinden etkilenmez.
9. Gündemde olmayan düğümler ana haftalık ritim yüzeyinde görünmez.
10. Ana ekran görev tablosu gibi değil; kategori kümeleri ve kartlar üzerinden görsel bir çalışma yüzeyi gibi algılanır.

## 13. Claude Code için uygulama talimatı

Bu PRD’ye göre mevcut uygulamadaki teknoloji yığınını önce incele. Mevcut router, tasarım sistemi, auth, ORM ve migration düzenini koru. Tracker’ı bağımsız bir özellik/modül olarak ekle; uygulamanın mevcut alanlarını değiştirme.

Önce veri şemasını ve migration’ları, sonra API/server action katmanını, ardından Tracker ana ekranını kur. Günlük işaretleme, haftalık devir ve istatistik hesaplarını testlerle doğrula. Uygulama sonunda şu senaryoyu manuel test et:

1. “Math Session” düğümünü Gelen Kutusu’na ekle.
2. Aktif kategorisiyle Gündemdeye taşı.
3. Pazartesi ve Çarşamba kutularını işaretle.
4. Oranın `2/7` olarak güncellendiğini doğrula.
5. Yeni haftayı oluştur; düğümün yeni haftada boş yedi kutuyla geldiğini doğrula.
6. Eski haftada `2/7` sonucunun korunup değişmediğini doğrula.

Önce işlevselliği bitir; görsel zihin haritası/serbest yüzey estetiğini ikinci iterasyonda uygula. V1, mobilde çok rahat işaretlenen ama masaüstünde de geniş yüzey hissi veren temiz bir Tracker olmalıdır.
