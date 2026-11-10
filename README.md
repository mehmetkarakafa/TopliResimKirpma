# Çoklu Kırp — Tek Fotoğraftan Çoklu Serbest Kırpma

Modern, sade, hızlı ve tamamen tarayıcı üzerinde (%100 istemci taraflı) çalışan görsel kırpma uygulaması.

**Canlı sürüm:** https://mehmetkarakafa.github.io/TopliResimKirpma/

© 2026 Mehmet Karakafa. Tüm hakları saklıdır. Bu depo portföy amacıyla herkese açıktır; kodun izinsiz kopyalanması, dağıtılması veya ticari kullanımı serbest değildir. Ayrıntı için `LICENSE` dosyasına bakın.

Tek bir fotoğraf yükleyin, üzerine fareyle veya dokunarak istediğiniz sayıda serbest kırpma alanı çizin; alanları taşıyın, boyutlandırın, çoğaltın, istediklerinizin arka planını silin ve tek tek veya ZIP olarak dışa aktarın.

---

## 🚀 Özellikler

- **Serbest Çizim:** Fotoğrafın üzerinde tıklayıp sürükleyerek (veya mobilde parmağınızla) dikdörtgen alanlar oluşturma.
- **Sınırsız Alan Desteği:** Tek görsel üzerinde 10, 20 veya daha fazla bağımsız kırpma alanı.
- **Gelişmiş Düzenleme:**
  - Alanı fareyle tutup taşıma (görsel sınırları dışına taşmaz).
  - 8 yönlü tutamaçlarla (köşeler ve kenarlar) boyutlandırma.
  - Seçili alanı çoğaltma (Ctrl+D veya butonla) ve silme (Delete / Backspace veya butonla).
- **Geri Al & Yinele:** Çizim, taşıma, boyutlandırma ve arka plan silme adımları geri alınabilir (`Ctrl+Z`) ve yinelenebilir (`Ctrl+Y`).
- **Arka Plan Silme (Çevrimdışı):**
  - Sağ paneldeki onay kutularıyla (veya "Tümünü seç") alanları işaretleyin, **"Seçililerin Arka Planını Sil"** butonuna basın.
  - Alanın kenarlarındaki baskın renk arka plan kabul edilir; kenarlara bağlı benzer renkli pikseller şeffaf yapılır, nesne kenarları yumuşatılır.
  - **Renk Toleransı** kaydırıcısı ile ne kadar benzer rengin silineceği ayarlanır.
  - **"İç boşluklardaki aynı rengi de sil"** seçeneği, kenara bağlı olmayan (ör. bir harfin ya da halkanın içindeki) aynı renkli bölgeleri de siler.
  - Sonuç tuval üzerinde damalı zeminle anında gösterilir; alan taşınır veya boyutlandırılırsa yeni bölge için otomatik yeniden hesaplanır.
  - **"Geri Getir"** ile işaretli alanların orijinal arka planı geri yüklenir.
  - Düz / tek renkli zeminlerde (stüdyo çekimi, beyaz fon, belge, logo) en iyi sonucu verir; karmaşık fotoğraf arka planları için uygun değildir.
- **Piksel Doğruluğunda Koordinatlar:** Ekrandaki görüntü boyutu ne olursa olsun tüm kırpmalar **orijinal fotoğrafın gerçek pikselleri** üzerinden yapılır.
- **Yakınlaştırma ve Sığdırma:** `-` / `+` / Sığdır butonları ve `Ctrl + Fare Tekerleği`.
- **Kırpma Listesi (Sağ Panel):** Her alan için numara, mini önizleme, piksel boyutları ve konum; tıklayarak seçme, isme tıklayarak yeniden adlandırma.
- **Dışa Aktarma:**
  - Seçili alanı, tüm alanları tek tek veya tek bir ZIP içinde (`coklu-kirpimlar.zip`) indirme.
  - Çıktı formatları: PNG (kayıpsız, şeffaf), JPEG (kalite ayarlı, beyaz zemin), WebP.

---

## ⌨️ Klavye Kısayolları

| Kısayol | İşlev |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | Son işlemi Geri Al |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Geri alınan işlemi Yinele |
| `Delete` / `Backspace` | Seçili kırpma alanını sil |
| `Ctrl + D` | Seçili kırpma alanını çoğalt |
| `Ctrl + Fare Tekerleği` | Fotoğrafı yakınlaştır / uzaklaştır |

---

## 📂 Proje Dosya Yapısı

```
TopluGorselKirpma/
├── index.html        # HTML5 arayüzü ve etkileşimli çalışma alanı
├── style.css         # Sade, duyarlı (responsive) CSS tasarım sistemi
├── script.js         # Çoklu kırpma motoru, arka plan silme ve ZIP yöneticisi
└── README.md         # Kullanım kılavuzu
```

---

## 💻 Bilgisayarda Nasıl Çalıştırılır?

Uygulama tamamen sunucusuz (client-side) çalışır. Harici bir backend veya Node/PHP kurulumu gerektirmez.

### 1. Yöntem: Doğrudan Tarayıcıda Açma (En Kolay)
1. Depoyu indirin ya da klonlayın ve klasörünü açın.
2. `index.html` dosyasına çift tıklayarak modern bir web tarayıcısında (Chrome, Edge, Firefox, Brave, Safari) açın.

### 2. Yöntem: Yerel Sunucu ile Açma
- **VS Code Live Server:** `index.html` üzerinde sağ tıklayıp *"Open with Live Server"* seçeneğini tıklayın.
- **Node.js ile:**
  ```bash
  npx serve .
  ```
- **Python ile:**
  ```bash
  python -m http.server 8080
  ```

---

## 📦 Bağımlılıklar

- **JSZip (v3.10.1):** CDN üzerinden yüklenir (`https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js`).
- **Çevrimdışı Destek:** CDN erişimi olmasa dahi `script.js` içindeki **yerleşik Pure-JS ZIP motoru** standartlara uygun `.zip` arşivi üretir. Arka plan silme de tamamen yerel çalışır, hiçbir model veya kütüphane indirmez.

---

## ⚠️ Bilinen Tarayıcı ve Format Sınırlamaları

1. **Animasyonlu GIF'ler:** Canvas API, animasyonlu GIF'lerin ilk karesini statik görsel olarak işler.
2. **Şeffaflık (JPEG vs PNG):** PNG ve WebP şeffaflığı korur. JPEG seçildiğinde şeffaf kısımlar (silinen arka planlar dahil) beyazla doldurulur.
3. **Maksimum Canvas Boyutu:** Modern tarayıcılarda tek seferde yaklaşık 16.384 × 16.384 piksele kadar görsel kırpılabilir.
