# Web sürümünü oluşturma ve yayınlama

## Gereksinim

Unity Hub içinde Unity `2022.3.62f1` kurulumuna **WebGL Build Support** modülünü ekleyin.

## Build alma

Proje Unity'de açıkken menüden:

`Büyülü Kazan → WebGL Sürümünü Oluştur`

Alternatif olarak Windows'ta `scripts\build-webgl.cmd` dosyasını çalıştırın. Çıktı `WebGLBuild` klasörüne yazılır.

## Yerel test

WebGL dosyaları `file://` ile doğrudan açılamaz. `WebGLBuild` klasörünü yerel bir HTTP sunucusu üzerinden açın veya GitHub Pages'a yayınlayın.
