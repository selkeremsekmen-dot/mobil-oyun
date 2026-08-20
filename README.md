# Büyülü Kazan

Unity ile geliştirilen, iksir malzemelerini eşleştirme temalı mobil Match-3 prototipi.

## İlk oynanabilir sürüm

- 8x8 oyun tahtası ve 6 farklı iksir malzemesi
- Dokunup sürükleyerek komşu parçaları değiştirme
- Yatay/dikey 3+ eşleşmeleri bulma
- Geçersiz hamleyi geri alma
- Parçaları temizleme, yer çekimi, yeniden doldurma ve zincirleme eşleşmeler
- Hamle sınırı ve renk bazlı bölüm hedefi
- Kazanma, kaybetme ve yeniden başlatma ekranı
- Başlangıçta hazır eşleşme ve olası hamlesiz tahta oluşmasını engelleme
- Geçerli hamlede yumuşak parça kayması, geçersiz hamlede geri sekme
- Eşleşmelerde renkli parçacık patlaması, parlama halkası ve hafif ekran sarsıntısı

## Çalıştırma

1. Projeyi Unity Hub üzerinden Unity 2022.3 LTS veya daha yeni bir sürümle açın.
2. Unity boş bir sahne açsa bile Play düğmesine basın. Oyun, `GameBootstrap` tarafından otomatik kurulur.
3. Bir parçayı yatay veya dikey komşusuna sürükleyin.

Prototip harici görsel dosyaya ihtiyaç duymaz; renkli parçalar çalışma anında üretilir. Böylece depo klonlandıktan sonra doğrudan denenebilir.

Web prototipinde aynı hareket ve patlama efektleri `docs/game.js` içinde harici kütüphane olmadan çizilir. GitHub Pages sürümü doğrudan tarayıcıda oynanabilir.

## Sonraki adımlar

GitHub'daki **İlk Oynanabilir Sürüm** milestone'u altında bölüm verileri, özel parçalar, engeller, ses/titreşim ve mobil paketleme işleri takip edilir.
