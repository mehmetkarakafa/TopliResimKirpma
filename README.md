# Toplu Kırp — Toplu & Çoklu Fotoğraf Kırpma Aracı

Modern, sade, hızlı ve tamamen tarayıcı üzerinde (%100 istemci taraflı) çalışan kapsamlı görsel kırpma uygulaması.

**Canlı sürüm:** https://mehmetkarakafa.github.io/TopliResimKirpma/

Uygulama iki güçlü çalışma modu sunar:
1. **Toplu Fotoğraf Kırpma:** Birden fazla fotoğrafı aynı anda yükleyin, ortak en-boy oranlarını ve konumlandırmayı seçin, tek tıkla toplu ZIP indirin.
2. **Çoklu Serbest Kırpma (Yeni!):** Tek bir fotoğraf yükleyin, üzerine fareyle veya dokunarak istediğiniz sayıda serbest kırpma alanı çizin, taşıyın, boyutlandırın, çoğaltın ve tek tek veya ZIP olarak dışa aktarın.

---

## 🚀 Çalışma Modları ve Özellikleri

### 1. Mod: Toplu Fotoğraf Kırpma (Bulk Cropper)
- **Toplu Yükleme:** Onlarca görseli sürükle-bırak ile aynı anda ekleme.
- **Hazır En-Boy Oranları:** Serbest, 1:1 (Kare), 4:3, 3:2, 16:9, 9:16 (Dikey), 3:4, 2:3 ve Özel Oran (W:H).
- **Hassas Konumlandırma:** Merkez, Üst, Alt, Sol, Sağ butonları ile Yatay (X), Dikey (Y) ve Kapsama Ölçeği (%30 - %100) slider'ları.
- **Akıllı Çözünürlük:** Farklı çözünürlükteki görsellerin her birinin kendi doğal boyutlarına göre bozulmadan kırpılması.
- **Canlı Kart Önizlemesi:** Ortak ayarlar değiştikçe kartlardaki Canvas önizlemelerinin anında güncellenmesi.
- **Toplu İndirme:** `kirpilmis-gorseller.zip` olarak tek tıkla indirme.

### 2. Mod: Çoklu Serbest Kırpma (Multi-Crop Studio)
- **Serbest Çizim:** Fotoğrafın üzerinde fareyle tıklayıp sürükleyerek (veya mobilde parmağınızla) istediğiniz boyutlarda dikdörtgen alanlar oluşturma.
- **Sınırsız Alan Desteği:** Tek görsel üzerinde 10, 20 veya daha fazla bağımsız kırpma alanı tanımlayabilme.
- **Gelişmiş Düzenleme:**
  - Alanı fareyle tutup taşıma (görsel sınırları dışına taşmaz).
  - 8 yönlü tutamaçlarla (köşeler ve kenarlar) boyutlandırma.
  - Seçili alanı çoğaltma (Ctrl+D veya butonla).
  - Seçili alanı silme (Delete / Backspace tuşu veya butonla).
- **Geri Al & Yinele (Undo/Redo):**
  - Yapılan tüm çizim, taşıma ve boyutlandırma adımları geri alınabilir (`Ctrl+Z`) ve yinelenebilir (`Ctrl+Y`).
- **Piksel Doğruluğunda Koordinat Dönüşümü:**
  - Kullanıcının ekranda gördüğü görsel boyutu ne olursa olsun (küçültülmüş, yakınlaştırılmış veya büyütülmüş), tüm koordinatlar ve kırpma işlemleri **orijinal fotoğrafın gerçek piksellerine** dönüştürülerek hesaplanır.
- **Yakınlaştırma ve Sığdırma:**
  - Uzaklaştır (`-`), Yakınlaştır (`+`) ve Tek Tıkla Sığdır butonları.
  - `Ctrl + Fare Tekerleği` ile interaktif yakınlaştırma.
- **Kırpma Listesi (Sağ Panel):**
  - Oluşturulan tüm alanların numara, mini canlı önizleme, piksel boyutları (W × H) ve konum (X, Y) bilgileri.
  - Listeden alana tıklayarak sahnede o alanı seçebilme.
- **Dışa Aktarma Seçenekleri:**
  - Seçili alanı indir (`kirpim-01.png` vb.).
  - Tüm alanları tek tek indir.
  - Tüm alanları tek bir ZIP içinde indir (`coklu-kirpimlar.zip`).
  - Çıktı formatları: PNG (kayıpsız ve şeffaf), JPEG (kalite ayarlı, beyaz zemin korumalı), WebP.

---

## ⌨️ Klavye Kısayolları (Çoklu Kırpma Modu)

| Kısayol | İşlev |
|---|---|
| `Ctrl + Z` / `Cmd + Z` | Son işlemi Geri Al (Undo) |
| `Ctrl + Y` / `Ctrl + Shift + Z` | Geri alınan işlemi Yinele (Redo) |
| `Delete` / `Backspace` | Seçili kırpma alanını sil |
| `Ctrl + D` | Seçili kırpma alanını çoğalt |
| `Ctrl + Fare Tekerleği` | Fotoğrafı yakınlaştır / uzaklaştır |

---

## 📂 Proje Dosya Yapısı

```
TopliResimKirpma/
├── index.html        # Semantik HTML5 arayüzü, mod sekmeleri ve etkileşimli sahneler
├── style.css         # Modern, sade, duyarlı (responsive) CSS tasarım sistemi
├── script.js         # Toplu kırpıcı, etkileşimli çoklu kırpma motoru ve ZIP yöneticisi
└── README.md         # Kullanım kılavuzu ve teknik mimari detayları
```

---

## 💻 Bilgisayarda Nasıl Çalıştırılır?

Bu uygulama tamamen sunucusuz (client-side) çalışır. Harici bir backend veya Node/PHP kurulumu gerektirmez.

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
- **Gelişmiş Çevrimdışı (Offline) Desteği:** CDN erişimi engellense veya internet bağlantısı olmasa dahi, `script.js` içerisindeki **yerleşik Pure-JS ZIP motoru** kesintisiz çalışarak standartlara uygun `.zip` arşivi üretir.
- Harici hiçbir ücretli kütüphane veya backend servisi kullanılmamıştır.

---

## ⚠️ Bilinen Tarayıcı ve Format Sınırlamaları

1. **Animasyonlu GIF'ler:** Canvas API doğası gereği animasyonlu GIF'lerin ilk karesini statik görsel olarak işler.
2. **Şeffaflık (JPEG vs PNG):** PNG formatı şeffaflığı tam korur. JPEG seçildiğinde, şeffaf kısımlarda siyah leke oluşmasını önlemek amacıyla arka plan otomatik olarak beyazla doldurulur.
3. **Maksimum Canvas Boyutu:** Modern tarayıcılarda tek seferde yaklaşık 16.384 × 16.384 piksele kadar görsel kırpılabilir.
