# IP Manager - Fikri Mülkiyet Yönetim Sistemi

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Demo](https://img.shields.io/badge/demo-live-brightgreen.svg)

🌐 **Live Demo:** https://kubilayguzel.github.io/ip-manager

IP Manager, fikri mülkiyet haklarının (patent, marka, telif hakkı, tasarım) dijital ortamda yönetilmesi için geliştirilmiş **modern ve entegre** bir web uygulamasıdır.

## 🚀 Yeni Özellikler (v2.0) 

### ✨ **Portfolio Sayfası (YENİ!)**
- 📊 **Gelişmiş Tablo Görünümü** - Tüm IP kayıtları düzenli tabloda
- 🔍 **Akıllı Filtreleme** - Tür, durum, tarih ve metin arama
- 📈 **Gerçek Zamanlı İstatistikler** - Anlık sayılar ve durumlar
- 📁 **CSV Dışa Aktarma** - Verilerinizi kolayca dışa aktarın
- 👁️ **Detaylı Görüntüleme** - Modal ile kayıt detayları
- 🔄 **Dinamik Sıralama** - Tüm kolonlarda çift yönlü sıralama

### 🔗 **Tam Entegre Sistem**
- 🔄 **Sayfalar Arası Senkronizasyon** - Veriler tüm sayfalarda güncel
- 📱 **%100 Responsive** - Mobil ve masaüstü uyumlu
- ⚡ **Gelişmiş Hata Yönetimi** - localStorage olmadan da çalışır
- 🎯 **Optimize Edilmiş UX** - Kullanıcı dostu arayüz

## 📁 Proje Yapısı

```
ip-manager/
├── index.html          # 🔐 Kimlik Doğrulama Sistemi
├── dashboard.html      # 📊 Ana Sayfa & Canlı İstatistikler  
├── data-entry.html     # ➕ Gelişmiş Veri Giriş Modülü
├── portfolio.html      # 📋 Portföy Yönetim Sistemi (YENİ!)
└── README.md          # 📖 Dokümantasyon
```

## 🎯 Modül Durumları

| Modül | Durum | Açıklama | Özellikler |
|-------|-------|----------|------------|
| 🔐 **Kimlik Doğrulama** | ✅ Aktif | Güvenli giriş sistemi | Demo hesaplar, session yönetimi |
| 📊 **Dashboard** | ✅ Güncellandı | Gerçek verilerle istatistikler | Canlı sayılar, aktivite akışı |
| ➕ **Veri Giriş** | ✅ Geliştirildi | Portfolio entegrasyonu | 4 IP türü, dosya yükleme |
| 📋 **Portfolio** | 🆕 **YENİ** | Tam özellikli kayıt yönetimi | Filtreleme, arama, dışa aktarma |
| 📈 **Raporlar** | 🔄 Planlanan | Gelişmiş raporlama sistemi | Grafikler, analizler |
| ⚙️ **Ayarlar** | 🔄 Planlanan | Kullanıcı ve sistem ayarları | Profil, tercihler |

## 🧪 Demo Hesapları

Uygulamayı test etmek için aşağıdaki hesapları kullanabilirsiniz:

| E-posta | Şifre | Rol | Açıklama |
|---------|--------|-----|----------|
| `demo@ipmanager.com` | `demo123` | Demo Kullanıcı | Temel özellikler |
| `admin@ipmanager.com` | `admin123` | Yönetici | Tüm yetkiler |
| `test@example.com` | `test123` | Test Kullanıcı | Test amaçlı |

## 🔧 Kurulum & Çalıştırma

### 1. Repository'yi İndirin
```bash
git clone https://github.com/kubilayguzel/ip-manager.git
cd ip-manager
```

### 2. Yerel Sunucu Başlatın
```bash
# Python ile
python -m http.server 8000

# Node.js ile  
npx http-server

# PHP ile
php -S localhost:8000
```

### 3. Tarayıcıda Açın
```
http://localhost:8000
```

## 🧪 Geliştirici Araçları

### Tarayıcı Konsolu Komutları:

#### 🔐 **Giriş Sayfasında (index.html)**
```javascript
testAuth.fillDemo()              // Demo bilgileri otomatik doldur
testAuth.getCurrentUser()        // Aktif kullanıcı bilgileri
testAuth.logout()                // Çıkış yap
```

#### 📊 **Dashboard'da (dashboard.html)**  
```javascript
testDashboard.refreshStats()     // İstatistikleri gerçek verilerle yenile
testDashboard.addActivity("patent", "Test aktivite") // Yeni aktivite ekle
testDashboard.getCurrentUser()   // Kullanıcı bilgilerini görüntüle
```

#### ➕ **Veri Girişinde (data-entry.html)**
```javascript
testDataEntry.setTestData("patent")    // Patent test verisi yükle
testDataEntry.setTestData("trademark") // Marka test verisi yükle
testDataEntry.getFormData()            // Form verilerini JSON olarak al
testDataEntry.resetForm()              // Formu temizle
```

#### 📋 **Portfolio'da (portfolio.html)**
```javascript
testPortfolio.addTestRecord()     // Yeni test kaydı ekle
testPortfolio.exportData()        // Verileri CSV olarak dışa aktar
testPortfolio.getRecords()        // Tüm kayıtları görüntüle
testPortfolio.clearAllRecords()   // Tüm kayıtları sil (dikkatli!)
```

## 🌟 Özellik Listesi

### ✅ **Kimlik Doğrulama**
- 🔐 Güvenli giriş sistemi
- 📱 Responsive login sayfası
- ⚡ Session yönetimi
- 🎯 Demo hesap desteği

### ✅ **Dashboard**
- 📊 Gerçek zamanlı istatistikler
- 📈 IP türlerine göre sayılar
- 🔄 Dinamik veri yenileme
- 🎨 Modern tasarım

### ✅ **Veri Giriş**
- 🏷️ 4 IP türü desteği (Patent, Marka, Telif, Tasarım)
- 👥 Kişi yönetimi sistemi
- 📁 Dosya yükleme (Drag & Drop)
- ⚙️ Dinamik form alanları
- ✅ Gelişmiş form validasyonu

### ✅ **Portfolio Yönetimi**
- 📋 Tablo görünümü
- 🔍 Gelişmiş arama ve filtreleme
- 📊 Anlık istatistikler
- 👁️ Detaylı kayıt görüntüleme
- 📁 CSV dışa aktarma
- 🗑️ Kayıt silme
- 🔄 Dinamik sıralama

## 🔄 Veri Akışı

```
Giriş → Dashboard → Yeni Kayıt → Data Entry → 
Kaydet → Portfolio → Filtrele/Görüntüle → Dashboard (Güncel İstatistikler)
```

## 🌟 Changelog

### **v2.0.0** (Aralık 2024)
- ➕ **Portfolio sayfası eklendi**
- 🔗 **Tam modül entegrasyonu**
- 📊 **Gerçek zamanlı veri senkronizasyonu**
- 🔧 **localStorage hata yönetimi**
- 📱 **Geliştirilmiş responsive tasarım**
- 🎯 **Optimize edilmiş kullanıcı deneyimi**
- 📁 **CSV dışa aktarma özelliği**
- 🔍 **Gelişmiş arama ve filtreleme**

### **v1.0.0** (2024)
- 🔐 Kimlik doğrulama sistemi
- 📊 Temel dashboard
- ➕ Veri giriş modülü
- 📝 Temel dokümantasyon

## 🤝 Katkıda Bulunma

1. **Fork** yapın
2. **Feature branch** oluşturun (`git checkout -b feature/yeni-ozellik`)
3. **Commit** edin (`git commit -am 'Yeni özellik eklendi'`)
4. **Push** edin (`git push origin feature/yeni-ozellik`)
5. **Pull Request** oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Geliştirici:** Kubilay Güzel
- **GitHub:** [@kubilayguzel](https://github.com/kubilayguzel)
- **Proje URL:** https://github.com/kubilayguzel/ip-manager

## 🙏 Teşekkürler

Bu projeyi kullandığınız için teşekkürler! ⭐ **Star** vermeyi unutmayın!

---

**Not:** Bu proje demo amaçlıdır. Gerçek üretim ortamında kullanım için ek güvenlik önlemleri alınmalıdır.