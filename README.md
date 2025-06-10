# IP Manager - Fikri Mülkiyet Yönetim Sistemi

## 📋 Proje Açıklaması

IP Manager, fikri mülkiyet haklarının (patent, marka, telif hakkı, tasarım) dijital ortamda yönetilmesi için geliştirilmiş modern bir web uygulamasıdır.

## 🚀 Özellikler

- **Kimlik Doğrulama Sistemi** - Güvenli giriş/çıkış
- **Dashboard** - Genel bakış ve istatistikler  
- **Veri Giriş Modülü** - IP kayıt oluşturma
- **Kişi Yönetimi** - Hak sahiplerini organize etme
- **Çoklu IP Türü** - Patent, Marka, Telif Hakkı, Tasarım
- **Dosya Yönetimi** - Belge yükleme ve organizasyon
- **Responsive Tasarım** - Mobil uyumlu arayüz

## 🛠️ Teknolojiler

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Tasarım:** Modern CSS Grid, Flexbox, Animations
- **Veri:** LocalStorage (demo amaçlı)
- **İkonlar:** Unicode Emoji
- **Responsive:** Mobile-first yaklaşım

## 📁 Dosya Yapısı

```
ip-manager/
├── index.html          # Giriş sayfası (Kimlik doğrulama)
├── dashboard.html      # Ana sayfa (Dashboard)
├── data-entry.html     # Veri giriş formu
└── README.md          # Bu dosya
```

## 🔧 Kurulum

### 1. Depoyu İndirin
```bash
git clone https://github.com/[kullanici-adi]/ip-manager.git
cd ip-manager
```

### 2. Yerel Sunucu Başlatın

**Python ile:**
```bash
python -m http.server 8000
```

**Node.js ile:**
```bash
npx http-server
```

**PHP ile:**
```bash
php -S localhost:8000
```

### 3. Tarayıcıda Açın
```
http://localhost:8000
```

## 👨‍💻 Kullanım

### Demo Hesaplar
- **E-posta:** demo@ipmanager.com  
- **Şifre:** demo123

### Diğer Test Hesapları
- **admin@ipmanager.com** / admin123
- **test@example.com** / test123

### Temel İşlem Akışı
1. **index.html** - Giriş yapın
2. **dashboard.html** - Genel durumu görüntüleyin
3. **data-entry.html** - Yeni IP kaydı oluşturun

## 🧪 Test Özellikleri

### Tarayıcı Konsolu Komutları

**Giriş Sayfası (index.html):**
```javascript
testAuth.fillDemo()          // Demo bilgileri doldur
testAuth.getCurrentUser()    // Aktif kullanıcı
testAuth.logout()           // Çıkış yap
```

**Dashboard (dashboard.html):**
```javascript
testDashboard.refreshStats()                    // İstatistikleri yenile
testDashboard.addActivity("patent", "Test")     // Aktivite ekle
testDashboard.getCurrentUser()                  // Kullanıcı bilgisi
```

**Veri Giriş (data-entry.html):**
```javascript
testDataEntry.setTestData("trademark")  // Marka test verisi
testDataEntry.setTestData("patent")     // Patent test verisi
testDataEntry.getFormData()             // Form verilerini al
testDataEntry.resetForm()               // Formu sıfırla
```

## 📝 Modül Detayları

### Modül 1: Kimlik Doğrulama (index.html)
- ✅ Güvenli giriş sistemi
- ✅ Form validasyonu
- ✅ Session yönetimi
- ✅ Demo hesap desteği
- ✅ Responsive tasarım

### Modül 2: Dashboard (dashboard.html)
- ✅ İstatistik kartları
- ✅ Grafik placeholder'ları
- ✅ Son aktiviteler
- ✅ Hızlı aksiyonlar
- ✅ Navigasyon menüsü

### Modül 3: Veri Giriş (data-entry.html) - Versiyon 4
- ✅ 4 IP türü desteği (Patent, Marka, Telif, Tasarım)
- ✅ Kişi yönetimi sistemi
- ✅ Modal ile yeni kişi ekleme
- ✅ Dosya yükleme (Drag & Drop)
- ✅ Form validasyonu
- ✅ Dinamik form alanları

## 🎯 Özellikler

### IP Türleri
- **📋 Patent** - Buluş ve teknolojik yenilikler
- **🏷️ Marka** - İsim, logo ve tanıtım işaretleri
- **© Telif Hakkı** - Edebi ve sanatsal eserler
- **🎨 Tasarım** - Endüstriyel tasarımlar

### Kişi Yönetimi
- **👤 Bireysel** - Gerçek kişiler
- **🏢 Şirket** - Tüzel kişiler
- **🏛️ Kurum** - Kamu kurumları

### Dosya Yönetimi
- **Desteklenen Formatlar:** PDF, DOC, DOCX, JPG, PNG
- **Maksimum Boyut:** 10MB
- **Drag & Drop** desteği

## 🔮 Gelecek Sürümler

### Modül 4: Portfolio (Planlanan)
- IP listesi ve filtreleme
- Detaylı görüntüleme
- Arama özelliği

### Modül 5: Raporlama (Planlanan)
- Grafik ve analizler
- PDF rapor oluşturma
- İstatistiksel veriler

### Modül 6: Ayarlar (Planlanan)
- Kullanıcı profili
- Sistem ayarları
- Yedekleme/Geri yükleme

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'i push edin (`git push origin feature/yeni-ozellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Geliştirici:** [Adınız]
- **E-posta:** [E-posta adresiniz]
- **Proje URL:** https://github.com/[kullanici-adi]/ip-manager

## 🙏 Teşekkürler

Bu projeyi kullandığınız için teşekkürler! Geri bildirimlerinizi bekliyoruz.

---

**Not:** Bu proje demo amaçlıdır. Gerçek üretim ortamında kullanım için güvenlik önlemleri alınmalıdır.