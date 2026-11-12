const BRAWLERS = [
  { id:'plus',      name:'Плюсёнок',            emoji:'➕', rarity:'common',    price:0,   quote:'Плюс — это сила!',                     stats:{atk:4,spd:3,hp:3} },
  { id:'minus',     name:'Минусёнок',           emoji:'➖', rarity:'common',    price:0,   quote:'Минус не прощает ошибок',              stats:{atk:3,spd:4,hp:3} },
  { id:'calc',      name:'Калькулятор',         emoji:'🧮', rarity:'common',    price:50,  quote:'У меня все ответы!',                   stats:{atk:5,spd:4,hp:4} },
  { id:'bug',       name:'Жук-Считалочка',      emoji:'🐞', rarity:'common',    price:60,  quote:'Посчитаю на лапках',                   stats:{atk:4,spd:5,hp:3} },
  { id:'robot',     name:'Робосчитай',          emoji:'🦾', rarity:'rare',      price:100, quote:'Бип-буп! Ответ готов',                 stats:{atk:6,spd:5,hp:5} },
  { id:'digital',   name:'Цифролюб',            emoji:'🔢', rarity:'rare',      price:110, quote:'Цифры — мои друзья',                   stats:{atk:5,spd:6,hp:5} },
  { id:'unicorn',   name:'Единорог-Арифметик',  emoji:'🦄', rarity:'rare',      price:120, quote:'Магия точных чисел',                   stats:{atk:6,spd:6,hp:5} },
  { id:'triangle',  name:'Вершина Треугольник', emoji:'📐', rarity:'epic',      price:200, quote:'Углы прямые — ответ точный',          stats:{atk:7,spd:7,hp:6} },
  { id:'phoenix',   name:'Феникс Сумм',         emoji:'🔥', rarity:'epic',      price:220, quote:'Сгораю от рвения!',                    stats:{atk:8,spd:7,hp:5} },
  { id:'king',      name:'Король Плюс',         emoji:'👑', rarity:'epic',      price:240, quote:'Всё складывается в мою пользу',         stats:{atk:7,spd:6,hp:8} },
  { id:'magister',  name:'Магистр Нуль',        emoji:'🎩', rarity:'legendary', price:400, quote:'Ноль — ещё не конец',                  stats:{atk:9,spd:8,hp:8} },
  { id:'dragon',    name:'Дракон Решений',      emoji:'🐉', rarity:'legendary', price:450, quote:'Я решаю всё!',                         stats:{atk:10,spd:9,hp:9} }
];

const RARITY_LABEL = { common:'Обычный', rare:'Редкий', epic:'Эпический', legendary:'Легендарный' };
const RARITY_MULT  = { common:1, rare:1.2, epic:1.5, legendary:2 };
const STAT_COLOR   = { atk:'linear-gradient(90deg,#ff7a56,#ff3d2e)', spd:'linear-gradient(90deg,#4fb8ff,#2e6bff)', hp:'linear-gradient(90deg,#5fe26a,#16b82c)' };
const STAT_NAME    = { atk:'Атака', spd:'Скорость', hp:'Здоровье' };

const KEY = 'mathBrawl_v1';
const ROUND_LEN = 10;
const PERFECT_BONUS = 25;

const $ = (id) => document.getElementById(id);

let state = loadState();
let level = 'two';
let round = null;

function defaultState(){ return { coins:20, owned:['plus','minus'], selected:'plus', best:0 }; }
function loadState(){
  try{
    const raw = localStorage.getItem(KEY);
    if(!raw) return defaultState();
    const s = JSON.parse(raw);
    s.owned = Array.isArray(s.owned) ? s.owned : ['plus','minus'];
    if(!s.coins || isNaN(s.coins)) s.coins = 20;
    if(!s.owned.includes('plus')) s.owned.push('plus');
    if(!s.owned.includes('minus')) s.owned.push('minus');
    if(!s.owned.includes(s.selected)) s.selected = 'plus';
    return s;
  }catch(e){ return defaultState(); }
}
function saveState(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

function brawlerById(id){ return BRAWLERS.find(b=>b.id===id); }
function selectedBrawler(){ return brawlerById(state.selected) || BRAWLERS[0]; }
function currentMult(){ return RARITY_MULT[selectedBrawler().rarity]; }

function randint(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=randint(0,i); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

function genProblem(lvl){
  let a, b, op, ans, extra = [];
  if(lvl === 'two'){
    if(Math.random() < 0.5){ op='+'; a=randint(12,80); b=randint(10,99-a); }
    else                 { op='-'; a=randint(35,99); b=randint(10,a-10); }
  } else if(lvl === 'mult'){
    op='×'; a=randint(2,9); b=randint(2,9);
    ans = a*b;
    extra = [a+b, (a+1)*b, (a-1)*b, a*(b+1), a*(b-1)].filter(v=>v>0 && v!==ans);
  } else {
    if(Math.random() < 0.5){ op='+'; a=randint(150,700); b=randint(150,999-a); }
    else                 { op='-'; a=randint(400,999); b=randint(150,a-150); }
  }
  if(ans === undefined) ans = op === '+' ? a+b : a-b;
  return { text:`${a} ${op} ${b}`, ans, opts:genOptions(ans, extra) };
}

function genOptions(ans, extra){
  const set = new Set([ans]);
  const pool = new Set();
  (extra || []).forEach(v=>{ if(v >= 0 && v !== ans) pool.add(v); });
  [1,-1,10,-10,100,-100,2,-2,11,-11,9,-9].forEach(d=>{ const v=ans+d; if(v >= 0 && v !== ans) pool.add(v); });
  while(set.size < 4){
    let v;
    if(pool.size){
      const arr=[...pool];
      v = arr[randint(0,arr.length-1)];
      pool.delete(v);
    } else {
      v = randint(1, ans+30);
    }
    if(!set.has(v)) set.add(v);
  }
  return shuffle([...set]);
}

function gainForAnswer(){
  const base = round.level === 'two' ? 5 : (round.level === 'three' ? 8 : 6);
  let gain = Math.round(base * currentMult());
  if(round.streak >= 2) gain += Math.min(round.streak - 1, 8);
  return gain;
}

/* ---------- Audio ---------- */
let audioCtx = null;
function tone(freq, t, dur, type, vol){
  try{
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type || 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol || 0.2, audioCtx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + dur + 0.02);
  }catch(e){}
}
function sndCorrect(){ tone(659,0,.12); tone(784,.09,.12); tone(988,.18,.18); }
function sndWrong(){ tone(233,0,.2,'sawtooth',.09); tone(175,.13,.25,'sawtooth',.07); }
function sndCoin(){ tone(1318,0,.06,'square',.07); tone(1760,.05,.1,'square',.07); }
function sndBuy(){ tone(523,0,.1); tone(659,.08,.1); tone(784,.16,.16); }
function sndWin(){ tone(523,0,.12); tone(659,.12,.12); tone(784,.24,.12); tone(1046,.36,.3); }
function sndFizzle(){ tone(440,0,.1); tone(330,.1,.14); }

/* ---------- Toast & burst ---------- */
let toastTimer = null;
function toast(msg, ms){
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ t.hidden = true; }, ms || 2200);
}
function coinBurst(){
  const c = $('coinburst');
  c.hidden = false;
  c.style.animation = 'none'; void c.offsetWidth; c.style.animation = '';
  setTimeout(()=>{ c.hidden = true; }, 850);
}

/* ---------- Header coins ---------- */
function renderCoins(){
  $('coinCount').textContent = state.coins;
}
function addCoins(n){
  state.coins += n;
  renderCoins();
  const box = $('coinbox');
  box.classList.remove('pulse'); void box.offsetWidth; box.classList.add('pulse');
  saveState();
}

/* ---------- Brawler shop ---------- */
function statRow(key, val){
  return `<div class="stat">
    <b>${STAT_NAME[key]}</b>
    <div class="statbar"><i style="width:${val*10}%;background:${STAT_COLOR[key]}"></i></div>
  </div>`;
}
function renderShop(){
  const grid = $('brawlerGrid');
  grid.innerHTML = BRAWLERS.map(b=>{
    const owned = state.owned.includes(b.id);
    const selected = state.selected === b.id;
    const affordable = state.coins >= b.price;
    let btn;
    if(!owned){
      btn = `<button class="buy" ${affordable?'':'disabled'} onclick="buyBrawler('${b.id}')">Купить</button>`;
    } else if(selected){
      btn = `<button class="buy is-selected" onclick='return false'>✓ В игре</button>`;
    } else {
      btn = `<button class="buy ownedbtn" onclick="selectBrawler('${b.id}')">Выбрать</button>`;
    }
    return `<div class="brawler ${owned?'owned':''} ${selected?'selected':''}" data-id="${b.id}">
      <div class="brawler-face c-${b.rarity}">${b.emoji}</div>
      <span class="rarity-badge badge-${b.rarity}">${RARITY_LABEL[b.rarity]}</span>
      <h3>${b.name}</h3>
      <p class="quote">«${b.quote}»</p>
      <div class="stats">
        ${statRow('atk',b.stats.atk)}
        ${statRow('spd',b.stats.spd)}
        ${statRow('hp',b.stats.hp)}
      </div>
      <div class="bonus">Бонус монет ×${RARITY_MULT[b.rarity]}</div>
      ${owned ? '' : `<div class="price">🪙 ${b.price}</div>`}
      ${btn}
    </div>`;
  }).join('');
  renderTeam();
}
function renderTeam(){
  const wrap = $('teamlineFighters');
  const owned = BRAWLERS.filter(b=>state.owned.includes(b.id));
  if(!owned.length){ wrap.innerHTML = '<span style="color:#cdc0f5">Твоя команда пуста. Купи бойца!</span>'; return; }
  wrap.innerHTML = owned.map(b=>`
    <button class="mini-fighter ${state.selected===b.id?'mini-sel':''}" title="${b.name}"
      onclick="selectBrawler('${b.id}')" style="background:${'linear-gradient(135deg,#8a4bff,#4b1fb0)'}">
      <span>${b.emoji}</span>
      <i>×${RARITY_MULT[b.rarity]}</i>
    </button>`).join('');
}
function buyBrawler(id){
  const b = brawlerById(id);
  if(!b || state.owned.includes(id)) return;
  if(state.coins < b.price){ toast('Не хватает монет! Играй и зарабатывай.'); sndFizzle(); return; }
  state.coins -= b.price;
  state.owned.push(id);
  state.selected = id;
  saveState();
  renderCoins(); renderShop();
  sndBuy();
  coinBurst();
  toast(`Боец «${b.name}» в твоей команде! Бонус ×${RARITY_MULT[b.rarity]}` );
}
function selectBrawler(id){
  if(!state.owned.includes(id)) return;
  state.selected = id;
  saveState();
  renderShop();
  sndCoin();
  setMascot();
  toast(`${brawlerById(id).name} выходит на арену!`);
}

function setMascot(){
  const b = selectedBrawler();
  const emptyM = $('mascotEmpty');
  if(emptyM){ emptyM.textContent = b.emoji; emptyM.style.background = `linear-gradient(135deg,#8a4bff,#4b1fb0)`; }
}

/* ---------- Level buttons ---------- */
function renderLevel(){
  document.querySelectorAll('.lvl').forEach(btn=>{
    btn.classList.toggle('lvl-active', btn.dataset.level === level);
  });
}

/* ---------- Game ---------- */
const arena = $('arena');
const emptyTemplate = $('arenaEmpty').cloneNode(true);
$('arenaEmpty').remove();

function showIdle(){
  arena.innerHTML = '';
  arena.appendChild(emptyTemplate.cloneNode(true));
  setMascot();
}
function startRound(){
  if(round) return;
  round = { level, index:0, correct:0, streak:0, bestStreak:0, earned:0, locked:false };
  $('arenaResult').hidden = true;
  arena.innerHTML = `
    <div class="round-top">
      <div class="round-info">
        <div class="round-hud" id="qCount">Вопрос 1 / 10</div>
        <div class="round-hud" id="roundCoin">🪙 +0</div>
      </div>
      <button class="quit-round" id="quitRound" title="Завершить раунд">✕</button>
      <div class="progress" id="progress"></div>
    </div>
    <div class="mascot-row" id="mascotRow">
      <div class="mascot-small" id="mascotSmall"></div>
      <div class="problem" id="problem"></div>
    </div>
    <div class="answers" id="answers"></div>
    <div class="feedback" id="feedback"></div>`;
  $('quitRound').addEventListener('click', ()=>{ if(round && !round.locked) endRound(true); });
  round.cur = genProblem(round.level);
  renderQuestion();
  sndCoin();
}
function renderQuestion(){
  if(!round) return;
  round.locked = false;
  const p = round.cur;
  $('qCount').textContent = `Вопрос ${round.index+1} / ${ROUND_LEN}`;
  $('roundCoin').textContent = `🪙 +${round.earned}`;
  $('problem').textContent = `${p.text} = ?`;
  $('feedback').innerHTML = '';
  const an = $('answers');
  an.innerHTML = '';
  p.opts.forEach(v=>{
    const b = document.createElement('button');
    b.className = 'answer';
    b.textContent = v;
    b.dataset.val = v;
    b.addEventListener('click', ()=>onAnswer(v,b));
    an.appendChild(b);
  });
  const m = $('mascotSmall');
  m.textContent = selectedBrawler().emoji;
  m.style.background = `linear-gradient(135deg,#${gt(selectedBrawler().rarity)[0]},#${gt(selectedBrawler().rarity)[1]})`;
  renderProgress();
  renderStats();
  window.scrollTo({ top:$('game').offsetTop - 80, behavior:'smooth' });
}
function gt(r){
  return { common:['5fe26a','16b82c'], rare:['5ea9ff','2e6bff'], epic:['b44aff','7300c9'], legendary:['ffd54a','ff9d00'] }[r];
}
function renderProgress(){
  const pr = $('progress');
  if(!pr) return;
  pr.innerHTML = '';
  for(let i=0;i<ROUND_LEN;i++){
    const d = document.createElement('div');
    d.className = 'prog-dot';
    if(i < round.index) d.classList.add(round._res[i] ? 'ok' : 'bad');
    pr.appendChild(d);
  }
}
function renderStats(){
  const s = $('arenaStats');
  s.innerHTML = `
    <div class="statpill">Правильно: <b>${round.correct}</b></div>
    <div class="statpill">Серия: <b>${round.streak} 🔥</b></div>
    <div class="statpill">Заработано: <b>${round.earned} 🪙</b></div>`;
}
function onAnswer(val, btn){
  if(!round || round.locked) return;
  round.locked = true;
  const p = round.cur;
  document.querySelectorAll('.answer').forEach(x=>x.disabled=true);
  const correctBtn = [...document.querySelectorAll('.answer')].find(x=>+x.dataset.val === p.ans);
  const row = $('mascotRow');
  const fb = $('feedback');
  if(val === p.ans){
    btn.classList.add('ok');
    round.correct++; round.streak++;
    round.bestStreak = Math.max(round.bestStreak, round.streak);
    const g = gainForAnswer();
    round.earned += g;
    row.classList.add('won');
    fb.innerHTML = `<span class="good">Верно! +${g} 🪙${round.streak>=3?` · серия ×${round.streak} 🔥`:''}</span>`;
    sndCorrect();
    addCoins(g);
    coinBurst();
  } else {
    btn.classList.add('bad');
    if(correctBtn) correctBtn.classList.add('ok');
    round.streak = 0;
    row.classList.add('battling');
    fb.innerHTML = `<span class="bad">Ой! Правильный ответ — ${p.ans}</span>`;
    sndWrong();
  }
  round._res = round._res || [];
  round._res.push(val === p.ans);
  setTimeout(()=>{
    row.classList.remove('won','battling');
    round.index++;
    if(round.index >= ROUND_LEN){ endRound(false); }
    else { round.cur = genProblem(round.level); renderQuestion(); }
  }, 950);
}
function endRound(quit){
  const perfect = !quit && round.correct === ROUND_LEN;
  if(perfect){ round.earned += PERFECT_BONUS; }

  state.best = Math.max(state.best, round.correct);
  saveState();

  const r = round;
  round = null;

  $('resultTitle').textContent = quit ? 'Раунд завершён' : (perfect ? 'Идеальный раунд! 🌟' : 'Раунд пройден!');
  $('resultCorrect').textContent = `${r.correct} из ${ROUND_LEN}`;
  $('resultStreak').textContent = r.bestStreak;
  $('resultCoins').textContent = r.earned;
  $('arenaResult').hidden = false;
  showIdle();
  renderStatsClean();

  if(perfect){ sndWin(); toast(`Идеально! Бонус +${PERFECT_BONUS} 🪙`); }
  else if(quit && !r.correct){ toast('Ни одного ответа... Попробуй ещё раз!'); }
  else { sndCoin(); toast(`Раунд окончен: +${r.earned} 🪙`); }
  window.scrollTo({ top:$('game').offsetTop - 110, behavior:'smooth' });
}
function renderStatsClean(){
  $('arenaStats').innerHTML = '';
}

/* ---------- Init ---------- */
$('startRound').addEventListener('click', startRound);
$('againBtn').addEventListener('click', ()=>{
  $('arenaResult').hidden = true;
  startRound();
});
document.querySelectorAll('.lvl').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    if(round){ toast('Раунд уже идёт — закончи его!'); return; }
    level = btn.dataset.level;
    renderLevel();
  });
});

renderCoins();
renderLevel();
renderShop();
showIdle();