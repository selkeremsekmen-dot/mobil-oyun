(() => {
  const SIZE = 8, COLORS = ['#f25161', '#42a6ff', '#52d873', '#ffd34d', '#b969ed', '#ff873d'];
  const canvas = document.querySelector('#board'), ctx = canvas.getContext('2d');
  const movesEl = document.querySelector('#moves'), scoreEl = document.querySelector('#score'), targetDot = document.querySelector('#target-dot');
  const hint = document.querySelector('#hint'), modal = document.querySelector('#modal'), modalTitle = document.querySelector('#modal-title'), modalCopy = document.querySelector('#modal-copy');
  let board, moves, score, target, selected = null, pointerStart = null, busy = false, cell = 0;

  function newGame() {
    do { board = Array.from({length: SIZE}, () => Array(SIZE).fill(0).map(() => Math.floor(Math.random() * COLORS.length))); } while (matches().size || !hasMove());
    moves = 25; score = 0; target = Math.floor(Math.random() * COLORS.length); selected = null; busy = false; modal.hidden = true;
    targetDot.style.background = COLORS[target]; updateHud(); draw();
  }
  function updateHud() { movesEl.textContent = moves; scoreEl.textContent = score; }
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
  function resolve() {
    let found = matches();
    while (found.size) {
      found.forEach(key => { const [x, y] = key.split(',').map(Number); if (board[y][x] === target) score++; board[y][x] = -1; });
      for (let x = 0; x < SIZE; x++) { let write = 0; for (let y = 0; y < SIZE; y++) if (board[y][x] >= 0) board[write++][x] = board[y][x]; while (write < SIZE) board[write++][x] = Math.floor(Math.random() * COLORS.length); }
      found = matches();
    }
    if (!hasMove()) { do { for (let y=0;y<SIZE;y++) for (let x=0;x<SIZE;x++) board[y][x]=Math.floor(Math.random()*COLORS.length); } while(matches().size || !hasMove()); }
  }
  function move(a, b) { if (busy || !adjacent(a,b)) return; busy = true; swap(a,b); if (!matches().size) { swap(a,b); hint.textContent = 'Bu hamle eşleşme oluşturmadı.'; busy = false; draw(); return; } moves--; resolve(); updateHud(); draw(); busy = false; if (score >= 20 || moves <= 0) finish(score >= 20); }
  function finish(win) { modalTitle.textContent = win ? 'İksir hazır!' : 'Hamleler bitti'; modalCopy.textContent = win ? `Hedef rengi ${score} kez topladın.` : `Hedefe ${Math.max(0, 20 - score)} parça kaldı.`; modal.hidden = false; }
  function resize() { const rect = canvas.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; canvas.width = rect.width*dpr; canvas.height = rect.height*dpr; ctx.setTransform(dpr,0,0,dpr,0,0); cell=rect.width/SIZE; draw(); }
  function draw() { const w=canvas.clientWidth; ctx.clearRect(0,0,w,w); ctx.fillStyle='#1b1230'; ctx.fillRect(0,0,w,w); for(let y=0;y<SIZE;y++) for(let x=0;x<SIZE;x++){const v=board?.[y]?.[x]; if(v<0)continue; const px=x*cell,py=y*cell,r=cell*.39, cx=px+cell/2,cy=py+cell/2; ctx.globalAlpha=selected&&selected.x===x&&selected.y===y?1:.92; ctx.fillStyle=COLORS[v]; ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffffff44';ctx.beginPath();ctx.arc(cx-r*.32,cy-r*.34,r*.25,0,Math.PI*2);ctx.fill(); if(selected&&selected.x===x&&selected.y===y){ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();}} ctx.globalAlpha=1; }
  function point(e) { const r=canvas.getBoundingClientRect(); return {x:Math.floor((e.clientX-r.left)/cell), y:Math.floor((e.clientY-r.top)/cell)}; }
  canvas.addEventListener('pointerdown', e => { if(busy)return; canvas.setPointerCapture(e.pointerId); pointerStart=point(e); selected=inside(pointerStart.x,pointerStart.y)?pointerStart:null; draw(); });
  canvas.addEventListener('pointerup', e => { if(!pointerStart)return; const end=point(e), dx=end.x-pointerStart.x,dy=end.y-pointerStart.y; const to=Math.abs(dx)>Math.abs(dy)?{x:pointerStart.x+Math.sign(dx),y:pointerStart.y}:{x:pointerStart.x,y:pointerStart.y+Math.sign(dy)}; if(inside(to.x,to.y)&&Math.abs(dx)+Math.abs(dy)>0) move(pointerStart,to); else if(inside(end.x,end.y)&&selected) move(selected,end); pointerStart=null; selected=null; draw(); });
  document.querySelector('#restart').onclick = newGame; document.querySelector('#modal-restart').onclick = newGame; window.addEventListener('resize', resize); newGame(); resize();
})();
