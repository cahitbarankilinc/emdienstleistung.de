# EM Dienstleistung — Cinematic Scroll Landing Page

Sinematik, scroll ile yönetilen tek-sayfa landing page. Girişte logo-reveal intro
videosu oynar; ardından müşteri aşağı kaydırdıkça full-screen video arka planlar
**crossfade** ile akar (sahne sert değişmez), önde marka kırmızısı temalı Almanca
metinler **yönlü animasyonlarla** (soldan/sağdan/yukarı/zoom) belirir, yana kayan
bir marquee ve parallax ile premium bir his verir.

## Çalıştırma
```bash
python3 -m http.server 8000 --directory site
# tarayıcı: http://localhost:8000
```
İnternet gerekir (GSAP, ScrollTrigger, Lenis CDN'den).

## Teknoloji
- **GSAP + ScrollTrigger** — crossfade, parallax, yönlü reveal, marquee
- **Lenis** — pürüzsüz scroll (mobilde native touch)
- Bağımlılık/derleme yok; saf HTML/CSS/JS

## Akış (9 sahne + intro)
0. **Intro** — logo-reveal (`giris.mp4`), "Überspringen" atla butonu
1. **Hero** — Sauberkeit auf höchstem Niveau
2. **Unsere Leistungen** — holografik hizmet showcase'i (`verschiedene Services.mp4`,
   ikinci yarısı ağır çekim) + 6 hizmet kartı (zigzag soldan/sağdan giriş)
3. **Klarheit / Präzision** — cam silme (wipe)
4. **Praxisreinigung** · 5. **Trockeneisreinigung** (`eistrocken.mp4` — gerçek teknisyen)
6. **Fenster- & Glasreinigung** (yüksekte cam temizleyen teknisyen)
7. **Büro & Bauendreinigung** · 8. **Wohnungs- & Hausreinigung** + 3 değer
9. **CTA** — ★ Faire-Preis-Garantie rozeti, büyük başlık, iletişim, kostenloses Angebot

## Videolar
- **Kullanıcı videoları:** `giris.mp4` → intro · `eistrocken.mp4` → Trockeneis ·
  `verschiedene Services.mp4` → Leistungen (2. yarı 0.5x ağır çekim)
- **AI üretilen (Higgsfield):** referans görseller Nano Banana Pro (2K) →
  video Seedance 2.0 (1080p) + Kling 3.0 pro (hero & CTA, Seedance'ın NSFW filtresi
  bu sıcak iç mekânları yanlış işaretlediği için)
- Hepsi sessiz, web-optimize H.264 (`-movflags +faststart`), `assets/video/scene/`

## Mobil
- Tüm bölümler stack, tam-genişlik butonlar, uygun tipografi (375px'e kadar test edildi)
- Aktif sahne ± komşusu oynatılır (akıcı crossfade, performans dengesi)
- `prefers-reduced-motion` desteklenir

## İletişim
Herr Mese +49 173 6519200 · Frau Mese +49 176 20566632 ·
em_dienstleistungen@web.de · Brucknerstr. 4, 85057 Ingolstadt
