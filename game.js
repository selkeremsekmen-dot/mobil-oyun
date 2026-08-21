(() => {
  const SIZE = 8, COLORS = ['#f25161', '#42a6ff', '#52d873', '#ffd34d', '#b969ed', '#ff873d'];
  const canvas = document.querySelector('#board'), ctx = canvas.getContext('2d');
  const movesEl = document.querySelector('#moves'), goalsEl = document.querySelector('#goals'), powerFill = document.querySelector('#power-fill'), powerValue = document.querySelector('#power-value'), cauldron = document.querySelector('#cauldron');
  const hint = document.querySelector('#hint'), modal = document.querySelector('#modal'), modalTitle = document.querySelector('#modal-title'), modalCopy = document.querySelector('#modal-copy');
  let board, moves, goals, magicPower, selected = null, pointerStart = null, busy = false, cell = 0;
  let activeSwap = null, particles = [], rings = [], shake = 0, lastFrame = performance.now();

  function newGame() {
    do { board = Array.from({length: SIZE}, () => Array(SIZE).fill(0).map(() => Math.floor(Math.random() * COLORS.length))); } while (matches().size || !hasMove());
    moves = 25; magicPower = 0; goals = [{ color: 1, name: 'Mavi', target: 15, collected: 0 }, { color: 4, name: 'Mor', target: 10, collected: 0 }, { color: 2, name: 'Yeşil', target: 5, collected: 0 }]; selected = null; busy = false; modal.hidden = true;
    cauldron.classList.remove('charging'); renderGoals(); updateHud(); draw();
  }
  function updateHud() {
    movesEl.textContent = `${moves} hamle`;
    const roundedPower = Math.round(magicPower);
    powerFill.style.width = `${roundedPower}%`; powerValue.textContent = `${roundedPower}%`;
    goalsEl.querySelectorAll('.goal').forEach((element, index) => { const goal = goals[index]; element.classList.toggle('done', goal.collected >= goal.target); element.querySelector('strong').textContent = `${Math.min(goal.collected, goal.target)}/${goal.target}`; });
  }
  function renderGoals() { goalsEl.innerHTML = goals.map(goal => `<div class="goal"><i class="goal-dot" style="background:${COLORS[goal.color]};color:${COLORS[goal.color]}"></i><div><span>${goal.name}</span><strong>0/${goal.target}</strong></div></div>`).join(''); }
  function allGoalsDone() { return goals.every(goal => goal.collected >= goal.target); }
  function inside(x, y) { return x >= 0 && x < SIZE && y >= 0 && y < SIZE; }
  function adjacent(a, b) { return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1; }
  function swap(a, b) { [board[a.y][a.x], board[b.y][b.x]] = [board[b.y][b.x], board[a.y][a.x]]; }
  function matches() {
    const found = new Set();
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      if (x < SIZE - 2 && board[y][x] === board[y][x + 1] && board[y][x] === board[y][x + 2]) { let n = x; while (n < SIZE && board[y][n] === board[y][x]) found.add(`${n},${y}`), n++; }
      if (y < SIZE - 2 && board[y][x] === board[y + 1][x] && board[y][x] === board[y + 2][x]) { let n = y; while (n < SIZE && board[n][x] === board[y][x]) found.add(`${x},${n}`), n++; }
    }
    return found;
  }
  function hasMove() { for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) for (const d of [[1,0],[0,1]]) { const b = {x:x+d[0], y:y+d[1]}; if (inside(b.x,b.y)) { const a={x,y}; swap(a,b); const ok = matches().size > 0; swap(a,b); if (ok) return true; } } return false; }
  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
  function animateSwap(a, b, duration = 180) {
    activeSwap = { a, b, start: performance.now(), duration };
    return wait(duration).then(() => { activeSwap = null; draw(); });
  }
  function spawnBurst(x, y, color) {
    const px = (x + .5) * cell, py = (y + .5) * cell;
    rings.push({ x: px, y: py, color, age: 0, max: 340 });
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2, speed = 24 + Math.random() * 56;
      particles.push({ x: px, y: py, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size: 2 + Math.random() * 3, color, age: 0, max: 420 + Math.random() * 180 });
    }
    shake = Math.min(8, shake + 2.2);
  }
  async function resolve() {
    let found = matches();
    while (found.size) {
      found.forEach(key => {
        const [x, y] = key.split(',').map(Number), color = board[y][x];
        const goal = goals.find(item => item.color === color);
        if (goal) goal.collected++;
        spawnBurst(x, y, COLORS[color]);
        board[y][x] = -1;
      });
      magicPower = Math.min(100, magicPower + found.size * 3.5);
      updateHud(); cauldron.classList.remove('charging'); void cauldron.offsetWidth; cauldron.classList.add('charging'); draw();
      await wait(190);
      for (let x = 0; x < SIZE; x++) { let write = 0; for (let y = 0; y < SIZE; y++) if (board[y][x] >= 0) board[write++][x] = board[y][x]; while (write < SIZE) board[write++][x] = Math.floor(Math.random() * COLORS.length); }
      draw();
      await wait(130);
      found = matches();
    }
    if (!hasMove()) { do { for (let y=0;y<SIZE;y++) for (let x=0;x<SIZE;x++) board[y][x]=Math.floor(Math.random()*COLORS.length); } while(matches().size || !hasMove()); }
  }
  async function move(a, b) {
    if (busy || !adjacent(a,b)) return;
    busy = true;
    swap(a,b);
    await animateSwap(a,b);
    if (!matches().size) {
      swap(a,b);
      await animateSwap(a,b, 150);
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
  function finish(win) { modalTitle.textContent = win ? 'Yeni İksir Keşfedildi!' : 'Hamleler bitti'; modalCopy.textContent = win ? 'Görünmezlik İksiri kazana hazırlandı. Üç yıldızlık bir sonuç için daha az hamle deneyebilirsin.' : 'Kazan henüz dolmadı. Tarif malzemelerini tamamlamak için yeniden dene.'; modal.hidden = false; }
  function resize() { const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; canvas.width = rect.width*dpr; canvas.height = rect.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); cell=rect.width/SIZE; draw(); }
  function draw(now = performance.now()) {
    const w = canvas.clientWidth, dt = Math.min(40, now - lastFrame); lastFrame = now;
    ctx.clearRect(0,0,w,w); ctx.fillStyle='#0e222b'; ctx.fillRect(0,0,w,w);
    ctx.strokeStyle='#ffffff0b'; ctx.lineWidth=1;
    for (let i=1; i<SIZE; i++) { ctx.beginPath(); ctx.moveTo(i*cell,0); ctx.lineTo(i*cell,w); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,i*cell); ctx.lineTo(w,i*cell); ctx.stroke(); }
    ctx.save();
    if (shake > .1) { ctx.translate((Math.random()-.5)*shake, (Math.random()-.5)*shake); shake *= .86; }
    for (let y=0; y<SIZE; y++) for (let x=0; x<SIZE; x++) {
      const v = board?.[y]?.[x]; if (v < 0) continue;
      let drawX = x, drawY = y;
      if (activeSwap) {
        const t = Math.min(1, (now - activeSwap.start) / activeSwap.duration), ease = t * (2 - t);
        const {a,b} = activeSwap;
        if (x === a.x && y === a.y) { drawX = b.x + (a.x-b.x)*ease; drawY = b.y + (a.y-b.y)*ease; }
        if (x === b.x && y === b.y) { drawX = a.x + (b.x-a.x)*ease; drawY = a.y + (b.y-a.y)*ease; }
      }
      const px = (drawX + .5)*cell, py = (drawY + .5)*cell, r = cell*.39;
      ctx.globalAlpha = selected&&selected.x===x&&selected.y===y ? 1 : .94;
      const gradient = ctx.createRadialGradient(px-r*.35, py-r*.4, r*.05, px, py, r*1.1);
      gradient.addColorStop(0, '#ffffffcc'); gradient.addColorStop(.18, COLORS[v]); gradient.addColorStop(1, '#00000055');
      ctx.fillStyle = gradient; ctx.shadowColor = COLORS[v]; ctx.shadowBlur = selected&&selected.x===x&&selected.y===y ? 15 : 5;
      ctx.beginPath(); ctx.arc(px,py,r,0,Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
      if (selected&&selected.x===x&&selected.y===y) { ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(px,py,r+4,0,Math.PI*2); ctx.stroke(); }
    }
    rings = rings.filter(ring => { ring.age += dt; const life = 1-ring.age/ring.max; if (life <= 0) return false; ctx.globalAlpha = life; ctx.strokeStyle=ring.color; ctx.lineWidth=3*life; ctx.beginPath(); ctx.arc(ring.x,ring.y,cell*.35+(1-life)*cell*.55,0,Math.PI*2); ctx.stroke(); return true; });
    particles = particles.filter(p => { p.age += dt; const life=1-p.age/p.max; if(life<=0)return false; p.x += p.vx*dt/1000; p.y += p.vy*dt/1000; p.vy += 100*dt/1000; ctx.globalAlpha=life; ctx.fillStyle=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size*life,0,Math.PI*2); ctx.fill(); return true; });
    ctx.globalAlpha=1; ctx.restore();
  }
  function frame(now) { draw(now); requestAnimationFrame(frame); }
  function point(e) { const r=canvas.getBoundingClientRect(); return {x:Math.floor((e.clientX-r.left)/cell), y:Math.floor((e.clientY-r.top)/cell)}; }
  canvas.addEventListener('pointerdown', e => { if(busy)return; canvas.setPointerCapture(e.pointerId); pointerStart=point(e); selected=inside(pointerStart.x,pointerStart.y)?pointerStart:null; draw(); });
  canvas.addEventListener('pointerup', e => { if(!pointerStart)return; const end=point(e), dx=end.x-pointerStart.x,dy=end.y-pointerStart.y; const to=Math.abs(dx)>Math.abs(dy)?{x:pointerStart.x+Math.sign(dx),y:pointerStart.y}:{x:pointerStart.x,y:pointerStart.y+Math.sign(dy)}; if(inside(to.x,to.y)&&Math.abs(dx)+Math.abs(dy)>0) move(pointerStart,to); else if(inside(end.x,end.y)&&selected) move(selected,end); pointerStart=null; selected=null; draw(); });
  document.querySelector('#restart').onclick = newGame; document.querySelector('#modal-restart').onclick = newGame; window.addEventListener('resize', resize); newGame(); resize(); requestAnimationFrame(frame);
})();
