# Design System & UI Guidelines

## 1. Design Direction

Aplikasi GIS dirancang dengan pendekatan **simple, familiar, dan low cognitive load**.

Target utama pengguna bukan pengguna GIS profesional, sehingga antarmuka harus terasa seperti aplikasi peta sehari-hari, bukan software GIS yang kompleks.

### Design Principles

1. **Simple First**
   Tampilkan hanya fitur yang diperlukan pengguna pada saat itu.

2. **Map as the Main Interface**
   Peta menjadi fokus utama aplikasi.

3. **Familiar Interaction**
   Gunakan pola interaksi yang sudah dikenal seperti Google Maps:

   * Zoom in / zoom out
   * Search location
   * Current location
   * Marker
   * Bottom sheet / panel informasi

4. **Progressive Disclosure**
   Jangan menampilkan seluruh fitur sekaligus. Fitur lanjutan muncul ketika dibutuhkan.

5. **Clear Over Clever**
   Hindari icon atau istilah teknis yang sulit dipahami.

---

# 2. Visual Style

## Overall Style

**Notion-inspired minimalist UI + modern map interface.**

Karakter visual:

* Clean
* Minimal
* Banyak whitespace
* Border tipis
* Rounded corners
* Soft shadow
* Typography sederhana
* Tidak terlalu banyak warna
* Tidak menggunakan gradient berlebihan

UI harus terasa ringan dan tidak membuat pengguna takut mencoba fitur.

---

# 3. Color System

Gunakan pendekatan **60 / 30 / 10**.

| Usage | Color     | Purpose                         |
| ----- | --------- | ------------------------------- |
| 60%   | `#FFFFFF` | Background / surface            |
| 30%   | `#F7F7F5` | Secondary background / panel    |
| 10%   | `#2383E2` | Primary action / selected state |

### Supporting Colors

| Color          | Hex       | Usage                    |
| -------------- | --------- | ------------------------ |
| Text Primary   | `#37352F` | Heading & important text |
| Text Secondary | `#787774` | Description              |
| Border         | `#E9E9E7` | Divider & card border    |
| Success        | `#2E9E5B` | Success status           |
| Warning        | `#D99A00` | Warning                  |
| Error          | `#D44C47` | Error                    |
| Map Water      | `#DCEFF8` | Water                    |
| Map Land       | `#F2F0E9` | Land                     |
| Map Road       | `#FFFFFF` | Road                     |

Warna status hanya digunakan ketika diperlukan, bukan sebagai dekorasi.

---

# 4. Typography

Gunakan font yang sederhana dan mudah dibaca.

### Recommended

**Inter**

Fallback:

```text
Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

### Type Scale

| Element        | Size | Weight |
| -------------- | ---: | -----: |
| Page Title     | 24px |    600 |
| Section Title  | 18px |    600 |
| Card Title     | 16px |    600 |
| Body           | 14px |    400 |
| Secondary Text | 13px |    400 |
| Caption        | 12px |    400 |

Hindari penggunaan terlalu banyak ukuran font dalam satu halaman.

---

# 5. Layout

GIS application menggunakan struktur:

```text
┌─────────────────────────────────────────────┐
│ Header / Search                             │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│                  MAP                        │
│                                             │
│          ● Marker                           │
│                                             │
│                                             │
│                              [+]            │
│                              [-]            │
│                         [◎ Location]         │
│                                             │
├─────────────────────────────────────────────┤
│ Information / Bottom Panel                 │
└─────────────────────────────────────────────┘
```

### Desktop

Gunakan layout:

```text
┌──────────────┬─────────────────────────────┐
│              │                             │
│  Navigation  │            MAP              │
│              │                             │
│              │                             │
│              │                             │
│              │                             │
└──────────────┴─────────────────────────────┘
```

Sidebar tidak boleh terlalu lebar.

Recommended:

```text
Sidebar: 240–280px
Map: Remaining space
```

### Mobile

Map menjadi full screen.

Kontrol dan informasi menggunakan floating panel / bottom sheet.

---

# 6. Navigation

Karena pengguna cukup gaptek, navigasi harus sangat sederhana.

### Recommended Navigation

```text
Dashboard
Peta
Data
Profil
```

Hindari terlalu banyak menu seperti:

```text
Analysis
Spatial Query
Layer Management
Geoprocessing
Raster
Vector
Topology
```

Istilah teknis tersebut hanya boleh muncul pada fitur khusus admin/operator.

---

# 7. Map Interface

Peta adalah komponen utama aplikasi.

### Map Controls

Letakkan kontrol pada posisi yang konsisten:

```text
                 ┌───────────────┐
                 │ Search        │
                 │ 🔍 Cari lokasi │
                 └───────────────┘


                         MAP


                                  ┌───┐
                                  │ + │
                                  ├───┤
                                  │ − │
                                  └───┘

                                  ┌───┐
                                  │ ◎ │
                                  └───┘
```

### Required Controls

Minimal:

* Search
* Zoom in
* Zoom out
* Current location
* Layer toggle jika diperlukan

Jangan menampilkan terlalu banyak kontrol sekaligus.

---

# 8. Search

Search merupakan salah satu fitur utama karena lebih mudah daripada meminta pengguna mencari lokasi secara manual di peta.

### Search UI

```text
┌───────────────────────────────────────┐
│ 🔍  Cari lokasi, desa, atau tempat... │
└───────────────────────────────────────┘
```

Placeholder harus menggunakan bahasa natural.

Hindari:

```text
Search spatial entity
```

Gunakan:

```text
Cari lokasi, desa, atau tempat...
```

### Search Result

```text
┌───────────────────────────────────────┐
│ 🔍 Sungai Andai                       │
├───────────────────────────────────────┤
│ 📍 Sungai Andai                       │
│    Banjarmasin Utara                  │
├───────────────────────────────────────┤
│ 📍 Kelurahan Sungai Andai             │
│    Banjarmasin                        │
└───────────────────────────────────────┘
```

---

# 9. Marker

Marker harus mudah dikenali.

Gunakan:

* Primary color
* Simple icon
* Label ketika diperlukan

Contoh:

```text
        ●
       / \
      /   \
     📍
```

Jangan menggunakan marker dengan bentuk atau warna terlalu kompleks.

### Marker State

**Default**

```text
●
```

**Selected**

```text
     ●
    / \
   /   \
```

Selected marker dapat menggunakan ukuran sedikit lebih besar atau shadow.

---

# 10. Location Information

Ketika pengguna memilih marker, tampilkan informasi dalam card.

### Desktop

```text
┌────────────────────────────────────┐
│ Sungai Andai                       │
│                                    │
│ Kelurahan                          │
│ Sungai Andai                       │
│                                    │
│ Kecamatan                          │
│ Banjarmasin Utara                  │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ Lihat detail                   │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

### Mobile

Gunakan bottom sheet:

```text
────────────────────────────

Sungai Andai

Kelurahan
Sungai Andai

Kecamatan
Banjarmasin Utara

[ Lihat Detail ]

────────────────────────────
```

---

# 11. Layer

Layer harus dibuat sesederhana mungkin.

Jangan menampilkan GIS terminology jika tidak diperlukan.

### Bad

```text
☐ Administrative Boundary
☐ Road Network
☐ POI
☐ Raster
☐ Vector
☐ Polygon
```

### Better

```text
Pilih informasi yang ingin ditampilkan

☑ Batas wilayah
☐ Jalan
☐ Fasilitas umum
☐ Tempat penting
```

Gunakan bahasa yang dimengerti pengguna umum.

---

# 12. Layer Panel

Gunakan floating panel atau popover.

```text
┌─────────────────────────────┐
│ Tampilan Peta               │
│                             │
│ ☑ Batas wilayah             │
│ ☐ Jalan                     │
│ ☐ Fasilitas umum            │
│ ☐ Tempat penting            │
│                             │
│        [Tutup]              │
└─────────────────────────────┘
```

Jangan membuat pengguna harus membuka halaman baru hanya untuk mengubah layer.

---

# 13. Button

Button menggunakan bentuk sederhana dengan radius:

```text
6–8px
```

### Primary

```text
┌────────────────────┐
│    Lihat Detail    │
└────────────────────┘
```

### Secondary

```text
┌────────────────────┐
│      Batal         │
└────────────────────┘
```

### Icon Button

Digunakan untuk fungsi yang sudah familiar:

```text
[ + ]
[ − ]
[ ◎ ]
[ ⚙ ]
```

Icon button wajib memiliki tooltip atau label pada konteks yang memungkinkan.

---

# 14. Card

Gunakan card secara minimal.

```text
┌─────────────────────────────┐
│ Nama Lokasi                 │
│                             │
│ Deskripsi singkat lokasi.   │
│                             │
│ Lihat detail →              │
└─────────────────────────────┘
```

### Card Style

```text
Background: #FFFFFF
Border: 1px solid #E9E9E7
Radius: 8px
Shadow: subtle
Padding: 16px
```

Hindari card yang terlalu banyak dalam satu halaman.

---

# 15. Form

Form harus menggunakan bahasa sederhana.

### Example

```text
Nama Wilayah

[ Masukkan nama wilayah ]

Kecamatan

[ Pilih kecamatan        ▼ ]

Deskripsi

[ Masukkan deskripsi... ]

                [ Simpan ]
```

Gunakan label yang jelas.

Jangan hanya menggunakan placeholder sebagai label.

---

# 16. User Persona: Pengguna Awam

## Persona

**Nama:** Pengguna Umum

**Kemampuan Teknologi:** Dasar

**Pengalaman GIS:** Rendah / tidak ada

### Characteristics

* Terbiasa menggunakan smartphone
* Mengenal Google Maps
* Tidak memahami istilah GIS
* Tidak terbiasa dengan layer
* Tidak memahami koordinat
* Lebih nyaman dengan tombol dan bahasa sederhana
* Cenderung takut melakukan kesalahan

### User Goals

Pengguna ingin:

1. Menemukan lokasi.
2. Melihat informasi suatu wilayah.
3. Mengetahui posisi suatu objek.
4. Melihat data pada peta.
5. Mendapatkan informasi tanpa harus memahami GIS.

---

# 17. UX Rules for Non-Technical Users

### Rule 1 — Gunakan Bahasa Natural

Jangan:

> Input koordinat geografis

Gunakan:

> Masukkan lokasi

---

### Rule 2 — Jangan Memaksa Pengguna Memahami Peta

Jika memungkinkan, berikan:

```text
Cari lokasi
      ↓
Pilih hasil
      ↓
Peta otomatis menuju lokasi
      ↓
Informasi ditampilkan
```

---

### Rule 3 — Hindari Empty State yang Membingungkan

Jangan:

> No data found.

Gunakan:

> Lokasi tidak ditemukan.
> Coba gunakan nama lokasi lain.

---

### Rule 4 — Berikan Feedback

Setelah pengguna melakukan aksi:

```text
✓ Lokasi berhasil disimpan
```

atau:

```text
✓ Data berhasil diperbarui
```

---

### Rule 5 — Jangan Membuat Pengguna Takut

Untuk aksi yang aman:

```text
Simpan Lokasi
```

Untuk aksi yang berisiko:

```text
Hapus Lokasi

Data yang dihapus tidak dapat dikembalikan.

[ Batal ] [ Hapus ]
```

---

# 18. Empty State

Gunakan empty state yang sederhana.

```text
          📍

Belum ada lokasi

Belum ada data lokasi yang tersedia.

[ Tambah Lokasi ]
```

Jangan menggunakan ilustrasi besar yang mengambil banyak ruang.

---

# 19. Loading State

Gunakan skeleton atau spinner sederhana.

Contoh:

```text
┌─────────────────────────────┐
│ ███████████████             │
│ ██████████                  │
│                             │
│ ███████████████████         │
└─────────────────────────────┘
```

Untuk peta:

```text
Memuat peta...
```

---

# 20. Error State

Error harus menjelaskan masalah dan tindakan yang dapat dilakukan.

### Bad

```text
Error 500
```

### Better

```text
Peta tidak dapat dimuat

Periksa koneksi internet Anda
kemudian coba lagi.

[ Coba Lagi ]
```

---

# 21. Accessibility

Karena target pengguna memiliki kemampuan teknologi yang beragam:

* Gunakan kontras warna yang cukup.
* Jangan bergantung hanya pada warna.
* Gunakan icon + text untuk fungsi penting.
* Ukuran tombol minimal sekitar 40–44px.
* Gunakan font minimal 14px untuk body.
* Hindari teks terlalu kecil.
* Pastikan area klik cukup besar.

---

# 22. Responsive Behavior

### Desktop

```text
Sidebar + Map
```

### Tablet

```text
Compact Sidebar + Map
```

### Mobile

```text
Full Map
+
Floating Controls
+
Bottom Sheet
```

Informasi detail tidak boleh mengambil seluruh layar secara permanen.

---

# 23. Recommended Component Structure

```text
App
├── Navigation
├── Header
│   └── Search
│
├── Map
│   ├── MapControls
│   │   ├── ZoomControl
│   │   ├── LocationControl
│   │   └── LayerControl
│   │
│   ├── Markers
│   └── MapPopup
│
├── InformationPanel
│
└── BottomSheet
```

---

# 24. Design Philosophy

> **"Users should understand what to do without needing to understand GIS."**

Aplikasi bukan dirancang untuk menunjukkan seberapa banyak fitur GIS yang tersedia.

Aplikasi dirancang agar pengguna dapat mencapai tujuannya dengan langkah sesedikit mungkin.

Prioritas UX:

```text
Understand
    ↓
Find
    ↓
Select
    ↓
View Information
    ↓
Take Action
```

Bukan:

```text
Configure
    ↓
Select Layer
    ↓
Configure Spatial Data
    ↓
Configure Projection
    ↓
Analyze
```

Untuk pengguna awam, **kesederhanaan adalah fitur utama.**
