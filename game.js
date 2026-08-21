(() => {
  const SIZE = 8;
  const COLORS = ['#f25161', '#42a6ff', '#52d873', '#ffd34d', '#b969ed', '#ff873d'];
  const STORAGE_KEY = 'buyulu-kazan-level-progress-v1';

  const makeLevel = (number, name, moves, targetList) => ({
    number,
    name,
    moves,
    goals: targetList.map(([color, goalName, target]) => ({ color, name: goalName, target }))
  });

  const WORLDS = [
    {
      id: 'snow', name: 'Kar Vadisi', icon: '❄️', theme: 'snow',
      subtitle: 'Buz kristallerini topla, donmuş geçidi aş.',
      levels: [
        makeLevel(1, 'Kırağı Kapısı', 25, [[1, 'Mavi', 12], [2, 'Yeşil', 8], [3, 'Altın', 6]]),
        makeLevel(2, 'Kristal Patika', 24, [[1, 'Mavi', 15], [4, 'Mor', 9], [3, 'Altın', 7]]),
        makeLevel(3, 'Buz Şelalesi', 24, [[2, 'Yeşil', 14], [5, 'Turuncu', 9], [1, 'Mavi', 8]]),
        makeLevel(4, 'Kutup Bahçesi', 23, [[3, 'Altın', 16], [4, 'Mor', 12], [2, 'Yeşil', 8]]),
        makeLevel(5, 'Fırtına Geçidi', 22, [[1, 'Mavi', 18], [2, 'Yeşil', 13], [4, 'Mor', 10]]),
        makeLevel(6, 'Kar Tahtı', 21, [[4, 'Mor', 20], [3, 'Altın', 14], [5, 'Turuncu', 12]])
      ]
    },
    {
      id: 'forest', name: 'Büyülü Orman', icon: '🌲', theme: 'forest',
      subtitle: 'Peri ışıklarını uyandır, ormanın sırrını çöz.',
      levels: [
        makeLevel(1, 'Mantar Yolu', 25, [[2, 'Yeşil', 13], [4, 'Mor', 8], [0, 'Kırmızı', 7]]),
        makeLevel(2, 'Fısıltı Korusu', 24, [[0, 'Kırmızı', 15], [5, 'Turuncu', 10], [2, 'Yeşil', 9]]),
        makeLevel(3, 'Peri Köprüsü', 23, [[4, 'Mor', 17], [1, 'Mavi', 11], [3, 'Altın', 8]]),
        makeLevel(4, 'Ay Işığı', 23, [[1, 'Mavi', 19], [2, 'Yeşil', 14], [5, 'Turuncu', 10]]),
        makeLevel(5, 'Kökler Labirenti', 22, [[0, 'Kırmızı', 20], [4, 'Mor', 15], [3, 'Altın', 11]]),
        makeLevel(6, 'Büyücü Kulesi', 21, [[2, 'Yeşil', 22], [1, 'Mavi', 16], [5, 'Turuncu', 13]])
      ]
    },
    {
      id: 'lava', name: 'Lav Mağaraları', icon: '🌋', theme: 'lava',
      subtitle: 'Kor taşlarını eşleştir, volkanın kalbine ulaş.',
      levels: [
        makeLevel(1, 'Kızıl Yarık', 25, [[0, 'Kırmızı', 13], [5, 'Turuncu', 9], [3, 'Altın', 7]]),
        makeLevel(2, 'Kor Tüneli', 24, [[5, 'Turuncu', 16], [0, 'Kırmızı', 12], [4, 'Mor', 8]]),
        makeLevel(3, 'Lav Şelalesi', 23, [[3, 'Altın', 18], [1, 'Mavi', 10], [5, 'Turuncu', 10]]),
        makeLevel(4, 'Ateş Köprüsü', 22, [[0, 'Kırmızı', 21], [4, 'Mor', 14], [2, 'Yeşil', 9]]),
        makeLevel(5, 'Volkan Kalbi', 21, [[5, 'Turuncu', 22], [3, 'Altın', 16], [0, 'Kırmızı', 13]]),
        makeLevel(6, 'Ejderha Ocağı', 20, [[0, 'Kırmızı', 25], [5, 'Turuncu', 19], [4, 'Mor', 14]])
      ]
    }
  ];

  const canvas = document.querySelector('#board');
  const ctx = canvas.getContext('2d');
  const levelMap = document.querySelector('#level-map');
  const worldList = document.querySelector('#world-list');
  const gameScreen = document.querySelector('#game-screen');
  const mapHome = document.querySelector('#map-home');
  const screenEyebrow = document.querySelector('#screen-eyebrow');
  const screenTitle = document.querySelector('#screen-title');
  const mapProgress = document.querySelector('#map-progress');
  const movesEl = document.querySelector('#moves');
  const goalsEl = document.querySelector('#goals');
  const powerFill = document.querySelector('#power-fill');
  const powerValue = document.querySelector('#power-value');
  const cauldron = document.querySelector('#cauldron');
  const hint = document.querySelector('#hint');
  const modal = document.querySelector('#modal');
  const modalTitle = document.querySelector('#modal-title');
  const modalCopy = document.querySelector('#modal-copy');
  const modalMap = document.querySelector('#modal-map');
  const modalRestart = document.querySelector('#modal-restart');

  let progress = loadProgress();
  let currentWorld = WORLDS[0];
  let currentLevel = currentWorld.levels[0];
  let board, moves, goals, magicPower, selected = null, pointerStart = null, busy = false, cell = 0;
  let activeSwap = null, particles = [], rings = [], shake = 0, lastFrame = performance.now();

  function loadProgress() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return stored && stored.stars && typeof stored.stars === 'object' ? stored : { stars: {} };
    } catch (error) {
      return { stars: {} };
    }
  }

  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (error) { /* Gizli mod veya dolu depolama */ }
  }

  function levelId(world, level) { return `${world.id}-${level.number}`; }
  function starsFor(world, level) { return Number(progress.stars[levelId(world, level)] || 0); }
  function isComplete(world, level) { return starsFor(world, level) > 0; }

  function isUnlocked(worldIndex, levelIndex) {
    if (worldIndex === 0 && levelIndex === 0) return true;
    if (levelIndex > 0) return isComplete(WORLDS[worldIndex], WORLDS[worldIndex].levels[levelIndex - 1]);
    const previousWorld = WORLDS[worldIndex - 1];
    return isComplete(previousWorld, previousWorld.levels[previousWorld.levels.length - 1]);
  }

  function starText(stars) {
    const safeStars = Math.max(0, Math.min(3, stars));
    return '★'.repeat(safeStars) + '☆'.repeat(3 - safeStars);
  }

  function renderLevelMap() {
    const total = WORLDS.reduce((sum, world) => sum + world.levels.length, 0);
    const completed = WORLDS.reduce((sum, world) => sum + world.levels.filter(level => isComplete(world, level)).length, 0);
    mapProgress.textContent = `${completed} / ${total}`;
    worldList.innerHTML = WORLDS.map((world, worldIndex) => {
      const open = world.levels.some((_, levelIndex) => isUnlocked(worldIndex, levelIndex));
      const worldCompleted = world.levels.every(level => isComplete(world, level));
      const state = worldCompleted ? 'Tamamlandı' : open ? 'Açık' : 'Kilitli';
      return `<section class="world-card world-card--${world.theme} ${open ? '' : 'is-locked'}">
        <div class="world-header">
          <div class="world-icon" aria-hidden="true">${world.icon}</div>
          <div class="world-copy"><p class="world-kicker">BÖLÜM ${worldIndex + 1}</p><h2>${world.name}</h2><p>${world.subtitle}</p></div>
          <span class="world-state ${open ? '' : 'locked'}">${state}</span>
        </div>
        <div class="level-grid">${world.levels.map((level, levelIndex) => {
          const unlocked = isUnlocked(worldIndex, levelIndex);
          const stars = starsFor(world, level);
          const classes = [unlocked ? 'available' : 'locked', stars ? 'completed' : ''].filter(Boolean).join(' ');
          const action = unlocked ? `data-world="${worldIndex}" data-level="${levelIndex}"` : 'disabled';
          const aria = unlocked ? `${world.name}, seviye ${level.number}, ${level.name}` : `${world.name}, seviye ${level.number}, kilitli`;
          return `<button class="level-node ${classes}" type="button" ${action} aria-label="${aria}">
            <span class="level-stars ${stars ? '' : 'empty'}" aria-label="${stars} yıldız">${starText(stars)}</span>
            <span class="level-orb">${level.number}</span>
            ${unlocked ? '' : '<span class="level-lock" aria-hidden="true">🔒</span>'}
            <span class="level-name">${level.name}</span>
          </button>`;
        }).join('')}</div>
      </section>`;
    }).join('');
    worldList.querySelectorAll('.level-node[data-world]').forEach(button => {
      button.addEventListener('click', () => startLevel(Number(button.dataset.world), Number(button.dataset.level)));
    });
  }

  function showMap() {
    modal.hidden = true;
    busy = false;
    gameScreen.hidden = true;
    levelMap.hidden = false;
    mapHome.hidden = true;
    screenEyebrow.textContent = 'BÜYÜLÜ KAZAN • SEVİYE HARİTASI';
    screenTitle.textContent = 'Büyülü Kazan';
    renderLevelMap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startLevel(worldIndex, levelIndex) {
    if (!isUnlocked(worldIndex, levelIndex)) return;
    currentWorld = WORLDS[worldIndex];
    currentLevel = currentWorld.levels[levelIndex];
    levelMap.hidden = true;
    gameScreen.hidden = false;
    mapHome.hidden = false;
    screenEyebrow.textContent = `${currentWorld.name.toUpperCase()} • SEVİYE ${currentLevel.number}`;
    screenTitle.textContent = currentLevel.name;
    newGame(currentLevel);
    requestAnimationFrame(resize);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function newGame(level = currentLevel) {
    currentLevel = level;
    do {
      board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0).map(() => Math.floor(Math.random() * COLORS.length)));
    } while (matches().size || !hasMove());
    moves = currentLevel.moves;
    magicPower = 0;
    goals = currentLevel.goals.map(goal => ({ ...goal, collected: 0 }));
    selected = null;
    busy = false;
    modal.hidden = true;
    hint.textContent = 'Bir malzemeyi komşusuna sürükle.';
    cauldron.classList.remove('charging');
    renderGoals();
    updateHud();
    draw();
  }

  function updateHud() {
    movesEl.textContent = `${moves} hamle`;
    const roundedPower = Math.round(magicPower);
    powerFill.style.width = `${roundedPower}%`;
    powerValue.textContent = `${roundedPower}%`;
    goalsEl.querySelectorAll('.goal').forEach((element, index) => {
      const goal = goals[index];
      if (!goal) return;
      element.classList.toggle('done', goal.collected >= goal.target);
      element.querySelector('strong').textContent = `${Math.min(goal.collected, goal.target)}/${goal.target}`;
    });
  }

  function renderGoals() {
    goalsEl.innerHTML = goals.map(goal => `<div class="goal"><i class="goal-dot" style="background:${COLORS[goal.color]};color:${COLORS[goal.color]}"></i><div><span>${goal.name}</span><strong>0/${goal.target}</strong></div></div>`).join('');
  }

  function allGoalsDone() { return goals.every(goal => goal.collected >= goal.target); }
  function inside(x, y) { return x >= 0 && x < SIZE && y >= 0 && y < SIZE; }
  function adjacent(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1; }
  function swap(a, b) { [board[a.y][a.x], board[b.y][b.x]] = [board[b.y][b.x], board[a.y][a.x]]; }

  function matches() {
    const found = new Set();
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (x < SIZE - 2 && board[y][x] === board[y][x + 1] && board[y][x] === board[y][x + 2]) {
        let n = x;
        while (n < SIZE && board[y][n] === board[y][x]) found.add(`${n},${y}`), n++;
      }
      if (y < SIZE - 2 && board[y][x] === board[y + 1][x] && board[y][x] === board[y + 2][x]) {
        let n = y;
        while (n < SIZE && board[n][x] === board[y][x]) found.add(`${x},${n}`), n++;
      }
    }
    return found;
  }

  function hasMove() {
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) for (const d of [[1, 0], [0, 1]]) {
      const b = { x: x + d[0], y: y + d[1] };
      if (!inside(b.x, b.y)) continue;
      const a = { x, y };
      swap(a, b);
      const possible = matches().size > 0;
      swap(a, b);
      if (possible) return true;
    }
    return false;
  }

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  function animateSwap(a, b, duration = 180) {
    activeSwap = { a, b, start: performance.now(), duration };
    return wait(duration).then(() => { activeSwap = null; draw(); });
  }

  function spawnBurst(x, y, color) {
    const px = (x + .5) * cell;
    const py = (y + .5) * cell;
    rings.push({ x: px, y: py, color, age: 0, max: 340 });
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 24 + Math.random() * 56;
      particles.push({ x: px, y: py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 2 + Math.random() * 3, color, age: 0, max: 420 + Math.random() * 180 });
    }
    shake = Math.min(8, shake + 2.2);
  }

  async function resolve() {
    let found = matches();
    while (found.size) {
      found.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const color = board[y][x];
        const goal = goals.find(item => item.color === color);
        if (goal) goal.collected++;
        spawnBurst(x, y, COLORS[color]);
        board[y][x] = -1;
      });
      magicPower = Math.min(100, magicPower + found.size * 3.5);
      updateHud();
      cauldron.classList.remove('charging');
      void cauldron.offsetWidth;
      cauldron.classList.add('charging');
      draw();
      await wait(190);
      for (let x = 0; x < SIZE; x++) {
        let write = 0;
        for (let y = 0; y < SIZE; y++) if (board[y][x] >= 0) board[write++][x] = board[y][x];
        while (write < SIZE) board[write++][x] = Math.floor(Math.random() * COLORS.length);
      }
      draw();
      await wait(130);
      found = matches();
    }
    if (!hasMove()) {
      do {
        for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) board[y][x] = Math.floor(Math.random() * COLORS.length);
      } while (matches().size || !hasMove());
    }
  }

  async function move(a, b) {
    if (busy || !adjacent(a, b)) return;
    busy = true;
    swap(a, b);
    await animateSwap(a, b);
    if (!matches().size) {
      swap(a, b);
      await animateSwap(a, b, 150);
      hint.textContent = 'Bu hamle eşleşme oluşturmadı.';
      busy = false;
      return;
    }
    moves--;
    hint.textContent = 'Güzel eşleşme!';
    await resolve();
    updateHud();
    busy = false;
    if (allGoalsDone() || moves <= 0) finish(allGoalsDone());
  }

  function calculateStars() {
    const ratio = moves / currentLevel.moves;
    return ratio >= .5 ? 3 : ratio >= .25 ? 2 : 1;
  }

  function finish(win) {
    if (win) {
      const stars = calculateStars();
      const id = levelId(currentWorld, currentLevel);
      progress.stars[id] = Math.max(starsFor(currentWorld, currentLevel), stars);
      saveProgress();
      renderLevelMap();
      modalTitle.textContent = `Seviye ${currentLevel.number} tamamlandı!`;
      modalCopy.textContent = `${starText(stars)}  ${currentLevel.name} tamamlandı. Haritada yeni seviye açıldı.`;
    } else {
      modalTitle.textContent = 'Hamleler bitti';
      modalCopy.textContent = 'Kazan henüz dolmadı. Tarif malzemelerini tamamlamak için yeniden dene.';
    }
    modal.hidden = false;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = rect.width / SIZE;
    draw();
  }

  function draw(now = performance.now()) {
    const w = canvas.clientWidth;
    const dt = Math.min(40, now - lastFrame);
    lastFrame = now;
    ctx.clearRect(0, 0, w, w);
    ctx.fillStyle = '#0e222b';
    ctx.fillRect(0, 0, w, w);
    ctx.strokeStyle = '#ffffff0b';
    ctx.lineWidth = 1;
    for (let i = 1; i < SIZE; i++) {
      ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, w); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(w, i * cell); ctx.stroke();
    }
    ctx.save();
    if (shake > .1) { ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake); shake *= .86; }
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const value = board?.[y]?.[x];
      if (value < 0 || value === undefined) continue;
      let drawX = x, drawY = y;
      if (activeSwap) {
        const t = Math.min(1, (now - activeSwap.start) / activeSwap.duration);
        const ease = t * (2 - t);
        const { a, b } = activeSwap;
        if (x === a.x && y === a.y) { drawX = b.x + (a.x - b.x) * ease; drawY = b.y + (a.y - b.y) * ease; }
        if (x === b.x && y === b.y) { drawX = a.x + (b.x - a.x) * ease; drawY = a.y + (b.y - a.y) * ease; }
      }
      const px = (drawX + .5) * cell;
      const py = (drawY + .5) * cell;
      const radius = cell * .39;
      const isSelected = selected && selected.x === x && selected.y === y;
      ctx.globalAlpha = isSelected ? 1 : .94;
      const gradient = ctx.createRadialGradient(px - radius * .35, py - radius * .4, radius * .05, px, py, radius * 1.1);
      gradient.addColorStop(0, '#ffffffcc'); gradient.addColorStop(.18, COLORS[value]); gradient.addColorStop(1, '#00000055');
      ctx.fillStyle = gradient;
      ctx.shadowColor = COLORS[value];
      ctx.shadowBlur = isSelected ? 15 : 5;
      ctx.beginPath(); ctx.arc(px, py, radius, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (isSelected) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(px, py, radius + 4, 0, Math.PI * 2); ctx.stroke(); }
    }
    rings = rings.filter(ring => {
      ring.age += dt;
      const life = 1 - ring.age / ring.max;
      if (life <= 0) return false;
      ctx.globalAlpha = life;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 3 * life;
      ctx.beginPath(); ctx.arc(ring.x, ring.y, cell * .35 + (1 - life) * cell * .55, 0, Math.PI * 2); ctx.stroke();
      return true;
    });
    particles = particles.filter(particle => {
      particle.age += dt;
      const life = 1 - particle.age / particle.max;
      if (life <= 0) return false;
      particle.x += particle.vx * dt / 1000;
      particle.y += particle.vy * dt / 1000;
      particle.vy += 100 * dt / 1000;
      ctx.globalAlpha = life;
      ctx.fillStyle = particle.color;
      ctx.beginPath(); ctx.arc(particle.x, particle.y, particle.size * life, 0, Math.PI * 2); ctx.fill();
      return true;
    });
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function frame(now) { draw(now); requestAnimationFrame(frame); }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: Math.floor((event.clientX - rect.left) / cell), y: Math.floor((event.clientY - rect.top) / cell) };
  }

  canvas.addEventListener('pointerdown', event => {
    if (busy) return;
    canvas.setPointerCapture(event.pointerId);
    pointerStart = point(event);
    selected = inside(pointerStart.x, pointerStart.y) ? pointerStart : null;
    draw();
  });
  canvas.addEventListener('pointerup', event => {
    if (!pointerStart) return;
    const end = point(event);
    const dx = end.x - pointerStart.x;
    const dy = end.y - pointerStart.y;
    const to = Math.abs(dx) > Math.abs(dy)
      ? { x: pointerStart.x + Math.sign(dx), y: pointerStart.y }
      : { x: pointerStart.x, y: pointerStart.y + Math.sign(dy) };
    if (inside(to.x, to.y) && Math.abs(dx) + Math.abs(dy) > 0) move(pointerStart, to);
    else if (inside(end.x, end.y) && selected) move(selected, end);
    pointerStart = null;
    selected = null;
    draw();
  });

  mapHome.addEventListener('click', showMap);
  document.querySelector('#restart').addEventListener('click', () => newGame(currentLevel));
  modalRestart.addEventListener('click', () => newGame(currentLevel));
  modalMap.addEventListener('click', showMap);
  window.addEventListener('resize', resize);
  window.addEventListener('keydown', event => { if (event.key === 'Escape' && !levelMap.hidden) return; if (event.key === 'Escape') showMap(); });

  renderLevelMap();
  levelMap.hidden = false;
  gameScreen.hidden = true;
  requestAnimationFrame(frame);
})();
