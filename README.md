# PADYEZD* — Bağlama İzləmə və İdarəetmə Sistemi

Çindən Azərbaycana sifarişlə gətirilən məhsulların real xəritə üzərində izlənməsi və idarə edilməsi üçün minimalist, lüks "streetwear" dizaynlı tətbiq.

---

## 🚀 Əsas Bölmələr

1. **Müştəri Portalı (`index.html`)**
   - Müştərilər üçün axtarış və izləmə səhifəsi.
   - İzləmə kodu (məs: `TRK-8820491`) və ya bağlama nömrəsi ilə axtarış.
   - Göstərilən məlumatlar:
     - Məhsulun adı və şəkli/kateqoriyası
     - Sifariş tarixi
     - Satış qiyməti (AZN)
     - Sifarişçinin adı və əlaqə nömrəsi
     - **Real Xəritə İzi:** Çin və Azərbaycanın real coğrafi xəritə sərhədləri üzərində 6 rəsmi mərhələ.
   - Admin məlumatları, xərclər və ya gəlirlər müştəriyə göstərilmir.

2. **Admin Paneli (`admin.html`)**
   - Parol ilə qorunan xüsusi idarəetmə mühiti.
   - **Standart PİN/Parol:** `padyezd2026`
   - Bütün sifarişlərin siyahısı, axtarış və filtrləmə.
   - Sifariş yaratma, redaktə etmə və silmə.
   - Mərhələni 1 kliklə növbəti mərhələyə keçirmə və ya siyahıdan birbaşa seçmə.
   - Maliyyə analitikası (ümumi dövriyyə, xalis gəlir, xərclər).
   - Supabase bulud verilənlər bazası ilə sinxronizasiya (offline rejimdə LocalStorage ehtiyatı).

---

## 📍 Tələb Olunan 6 Dəqiq Mərhələ

Xəritə və sistem üzrə yalnız bu 6 mərhələ istifadə olunur:
1. `sifaris verilib` (Çin)
2. `xarici anbar` (Çin anbarı)
3. `azerbaycana gonderilib` (Beynəlxalq tranzit)
4. `baki kargo terminali` (Bakı)
5. `gomruk yoxlanisindadir` (Bakı gömrüyü)
6. `tehvil menteqesindedi` (Təhvil məntəqəsi)

---

## ☁️ Supabase Quraşdırılması

Layihədəki `supabase_schema.sql` faylını Supabase panelinizin **SQL Editor** bölməsində icra edin.
Daha sonra `index.html` və `admin.html` fayllarında `SUPABASE_CONFIG` hissəsinə öz URL və Anon Key-inizi daxil edin:

```javascript
const SUPABASE_CONFIG = {
  url: "https://YOUR_SUPABASE_PROJECT.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY"
};
```

---

## 🌐 Rəsmi Sosial Şəbəkələr

- **Telegram:** [t.me/padyezdshop](https://t.me/padyezdshop)
- **Instagram:** [@padyezdshop](https://www.instagram.com/padyezdshop)
- **TikTok:** [@padyezd](https://www.tiktok.com/@padyezd)
