# Tracker

`tracker_prd.md` PRD'sine göre kurulmuş, tek kullanıcılı, haftalık alışkanlık/gelişim takip
uygulaması. iPhone ve masaüstü arasında aynı veriyi görmek için gerçek bir veritabanı
üzerinden senkronize çalışır — hesap/login yok, gizli bir bağlantı ile erişim korunur.

Next.js (App Router) + Prisma ile yazıldı. Ana yüzey, kategori kümeleri, Gelen Kutusu/Şimdi
Değil/Kapatıldı çekmecesi, hafta geçmişi ve düğüm bazlı aylık Dashboard mevcuttur.

## Yerel geliştirme

```bash
npm install
npm run dev
```

`http://localhost:3000` adresini aç. Yerel geliştirmede `ACCESS_TOKEN` ayarlanmadığı sürece
erişim koruması devre dışıdır.

Veritabanı yerel olarak SQLite (`prisma/dev.db`) kullanır. Şema değiştirdiğinde:

```bash
npx prisma migrate dev --name <değişiklik-adı>
```

## Erişim koruması (şifresiz gizli link)

Giriş ekranı/şifre yok. Bunun yerine `middleware`/`proxy.ts` dosyası, `ACCESS_TOKEN` ortam
değişkeni ayarlıysa `?token=...` sorgu parametresini kontrol eder; doğruysa 1 yıllık bir
cookie bırakır ve token'ı URL'den temizler. Yanlış/eksikse `/locked` sayfasına yönlendirir.

Yayına alırken:

1. Rastgele uzun bir dize üret (örn. `openssl rand -hex 24`).
2. Vercel proje ayarlarında `ACCESS_TOKEN` ortam değişkenine bunu yaz.
3. Kendine `https://<domain>/?token=<o-dize>` linkini gönder; bir kere açman yeterli, sonrası
   cookie ile hatırlanır (iPhone ve masaüstünde ayrı ayrı bir kere açman gerekir).

## Vercel'e deploy (SQLite → Postgres geçişi)

SQLite dosyası Vercel'in sunucusuz ortamında kalıcı değildir; iki cihaz arasında
senkronizasyon için gerçek bir bulut veritabanı gerekir. Deploy etmeden önce:

1. Vercel projesinde **Storage → Postgres** (Neon tabanlı) bir veritabanı oluştur; bu proje
   ile bağla. Vercel otomatik olarak `DATABASE_URL` ortam değişkenini enjekte eder.
2. `prisma/schema.prisma` içinde `datasource db` bloğunun `provider` alanını
   `"sqlite"` yerine `"postgresql"` yap.
3. Yeni bir migration üret ve bulut veritabanına uygula:
   ```bash
   vercel env pull .env.local
   npx prisma migrate dev --name postgres_init
   ```
4. Vercel'e deploy et (`vercel --prod` veya GitHub entegrasyonu ile push).
5. Yukarıdaki `ACCESS_TOKEN` adımını uygula.

Bu adımlar tek seferliktir; sonrasında hem lokal hem prod aynı akışla (Prisma migration)
ilerler.

## Veri modeli

`tracker_nodes`, `tracker_weeks`, `tracker_week_nodes`, `tracker_daily_marks` — PRD'nin 10.
bölümüyle birebir eşleşir. Kategori/haftaya dahil olma bilgisi `tracker_week_nodes` içinde
snapshot olarak saklanır; bir düğümün kategorisi sonradan değişse bile geçmiş haftalar
bozulmaz.

## Sayfalar

- `/` — ana hafta yüzeyi (kategori kümeleri, günlük işaretleme, özet paneli, Gelen Kutusu)
- `/history` — geçmiş haftaların listesi (salt okunur)
- `/dashboard` — düğüm bazlı aylık tamamlanma tablosu

