// Quiz interactivo para Lauluphine — lógica + sonidos WebAudio
let questions = [];
const defaultQuestions = [
  { q: "¿Qué tiene en común Nemo y el papá de Lau?", choices: ["Son difíciles de encontrar", "Nadie sabe dónde están", "Tema sensible", "No se puede encontrar a ninguno de los dos"], answer: 3, pet: "botton" },
  { q: "Una mujer está embarazada de trillizas niñas, ¿qué tiene?", choices: ["Una linda familia", "Un hogar hermoso y duradero", "Un kit de limpieza", "Muchas deudas"], answer: 2, pet: "bao" },
  { q: "Si se acaba la dictadura de Maduro ahora que fue preso, pasará lo siguiente:", choices: ["Subirá la propina de los rappis", "Ya no venderán dulces en los TransMilenios", "Colombia será un país mejor", "Todas las anteriores"], answer: 3 },
  { q: "En una camioneta viaja un mexicano, un boliviano y un peruano, ¿quién maneja la camioneta?", choices: ["El oficial de migración", "Peruano", "Boliviano", "Mexicano"], answer: 0, pet: "botton" },
  { q: "¿Cuál de estos es un accesorio kawaii perfecto para Lau?", choices: ["Delantal y Ollas", "Lazo rosa y vestidos", "Gafas oscuras", "Tacones"], answer: 0 },
  { q: "Si pudieras describir a Lau en 3 palabras, ¿cuáles serían?", choices: ["Dulce · Única · Especial", "Fuerte · Auténtica · Brillante", "Encantadora · Inteligente · Inolvidable", "Racista · Xenófoba · Uribista"], answer: 3, pet: "bao" },
  { q: "¿Qué haces cuando un epiléptico tiene un ataque mientras está en la bañera?", choices: ["Brindas los primeros auxilios", "Revisas su pulso y su estado de salud", "Echas la ropa y el jabón.", "No sé"], answer: 2 },
  { q: "¿Cuál es la persona que más quiere en este mundo Lau?", choices: ["Leon S. Kennedy", "Sett", "Kayn", "Alexis"], answer: 3 },
  { q: "Si estás en una partida y vas con un jungla que va 0-10 al minuto 8, ¿qué le dirías?", choices: ["Le doy ánimos para que se pueda remontar", "Le escribo manco de mierda y que los negros deben estar en un campo de algodón", "Me quedo callada", "uwu"], answer: 1 },
  { q: "Si pudieras recibir un regalo el día de hoy, ¿qué sería?", choices: ["Iluminador y brillo Dior", "Perfume caro", "Cosplay nuevo", "No más peruanos ni venecos en este mundo"], answer: 3 }
];

let current = 0;
let score = 0;
let huggedAlexis = false;
const total = 10; // fijo en 10 (JSON/archivo controlará el contenido)

// Alexis hug sequence state
let hugCount = 0;
const hugMax = 5;
const hugMsgs = [
  '¡Abrazalo!',
  'Abrazalo un poco más...',
  'Un poco más...',
  'Ya casi...',
  '¡Perfecto! Pulsa para ver tu regalo'
];

// DOM
const qnumEl = document.getElementById('qnum');
const questionEl = document.getElementById('question');
const choicesEl = document.getElementById('choices');
const scoreEl = document.getElementById('score');
const progressEl = document.getElementById('progress');
const feedbackEl = document.getElementById('feedback');
const petMessageEl = document.getElementById('petMessage');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restart');
const resultEl = document.getElementById('result');
const soundToggle = document.getElementById('soundToggle');
const toastsEl = document.getElementById('toasts');
const scorePopup = document.getElementById('scorePopup');
const alexisBtn = document.getElementById('alexisHug');

// WebAudio Kawaii sounds
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
function ensureAudio(){
  if(!audioCtx) audioCtx = new AudioCtx();
}

// Simple soft pluck (for correct)
function playPluck(frequency=880, duration=0.5){
  if(!soundToggle.checked) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0, now);
  // quick pluck envelope
  gain.gain.linearRampToValueAtTime(0.16, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  // subtle filter to make it soft
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1600, now);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration);
}

// soft sad buzzer (for wrong)
function playSoftBuzzer(){
  if(!soundToggle.checked) return;
  ensureAudio();
  const now = audioCtx.currentTime;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(240, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.09, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
  const f = audioCtx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, now);
  o.connect(f); f.connect(g); g.connect(audioCtx.destination);
  o.start(now); o.stop(now + 0.65);
}

// tiny celebratory sequence (finish)
function playCelebrate(){
  if(!soundToggle.checked) return;
  ensureAudio();
  // arpeggio of plucks
  const freqs = [880, 1046, 1318];
  freqs.forEach((f,i) => setTimeout(()=> playPluck(f, 0.35), i * 140));
}

// Toasts and helpers
function showToast(text, pet='both', type='info', timeout=2800){
  const t = document.createElement('div');
  t.className = `toast ${type} ${pet==='botton' ? 'pet-botton' : pet==='bao' ? 'pet-bao' : ''}`.trim();
  const img = document.createElement('img'); img.src = (pet==='botton') ? 'assets/img/botton.jpg' : (pet==='bao') ? 'assets/img/bao.jpg' : 'assets/img/botton.jpg'; img.alt = pet;
  const txt = document.createElement('div'); txt.innerHTML = `<strong>${text}</strong>`;
  t.appendChild(img); t.appendChild(txt);
  if(toastsEl) toastsEl.appendChild(t);
  setTimeout(()=>{ t.style.animation = 'toastOut .35s forwards'; setTimeout(()=> t.remove(), 350); }, timeout);
}

function showScorePopup(){
  if(!scorePopup) return;
  scorePopup.textContent = `Puntaje: ${score} / ${total}`;
  scorePopup.classList.remove('show'); void scorePopup.offsetWidth; scorePopup.classList.add('show');
  setTimeout(()=>{ scorePopup.classList.remove('show'); }, 1200);
}

function updateProgressFill(){
  const segs = progressEl.children;
  for(let i=0;i<segs.length;i++){
    if(i < score) segs[i].classList.add('filled'); else segs[i].classList.remove('filled');
  }
}

function renderQuestion(){
  const q = questions[current];
  qnumEl.textContent = `Pregunta ${current+1} / ${total}`;
  questionEl.textContent = q.q;
  choicesEl.innerHTML = '';
  feedbackEl.textContent = '';
  petMessageEl.textContent = (q.pet === 'botton') ? 'Botton menea la cola: ¡Tú puedes! 🐶' : (q.pet === 'bao') ? 'Bao te trae una semillita de la suerte 🌰' : 'Botton y Bao te desean suerte 💕';
  nextBtn.disabled = true;

  q.choices.forEach((choiceText, i) => {
    const b = document.createElement('button');
    b.className = 'choice';
    b.setAttribute('role','listitem');
    b.innerHTML = `<span style="width:20px; text-align:center;">${String.fromCharCode(65+i)}</span> ${choiceText}`;
    b.onclick = () => selectAnswer(b, i);
    b.onkeydown = (e) => { if(e.key === 'Enter') selectAnswer(b, i); };
    choicesEl.appendChild(b);
  });

  resultEl.style.display = 'none';
  window.onkeydown = (e) => {
    if (e.key >= '1' && e.key <= '4') {
      const idx = parseInt(e.key,10)-1;
      const btn = choicesEl.children[idx];
      if(btn && !btn.classList.contains('disabled')) btn.click();
    }
  };
}

function selectAnswer(btn, chosenIndex){
  if(btn.classList.contains('disabled')) return;
  const q = questions[current];
  Array.from(choicesEl.children).forEach((c, i) => { c.classList.add('disabled'); c.style.pointerEvents = 'none'; if(i === q.answer) c.classList.add('correct'); });

  if(chosenIndex === q.answer){
    score += 1; scoreEl.textContent = score; feedbackEl.textContent = '¡Correcto! ✨'; btn.classList.add('correct'); playPluck(780 + Math.random()*220, 0.5);
    showToast('¡Correcto! ¡Buen trabajo! ✨', q.pet || 'both', 'success');
    showCorrectParticles();
  } else {
    feedbackEl.textContent = `¡Uy! La respuesta era "${q.choices[q.answer]}" ❣️`;
    btn.classList.add('wrong'); playSoftBuzzer();
    showToast((q.pet === 'botton') ? 'Botton: ¡Sigue intentándolo, eres genial! 🐶' : (q.pet === 'bao') ? 'Bao: ¡Tú puedes la próxima! 🌰' : '¡Sigue intentándolo! 💕', q.pet || 'both', 'encourage');
    showWrongParticles();
  }

  updateProgressFill();
  // no per-answer popup while playing — removed per user request
  nextBtn.disabled = false;
  if(current === total - 1) nextBtn.textContent = 'Ver resultado'; else nextBtn.textContent = 'Siguiente';
} 

nextBtn.addEventListener('click', () => {
  if(current < total - 1){ current += 1; renderQuestion(); } else { showResults(); }
});

restartBtn.addEventListener('click', () => {
  current = 0; score = 0; huggedAlexis = false; hugCount = 0; Array.from(progressEl.children).forEach(s => s.classList.remove('filled'));
  scoreEl.textContent = score; restartBtn.style.display = 'none'; nextBtn.style.display = 'inline-block'; nextBtn.disabled = false;
  // ocultar Alexis y modales si estaban visibles
  if(alexisBtn){ alexisBtn.classList.add('hidden'); alexisBtn.classList.remove('visible'); alexisBtn.classList.remove('center'); alexisBtn.setAttribute('aria-hidden','true'); const prompt = document.getElementById('alexisPrompt'); if(prompt) prompt.style.display='none'; }
  const modal = document.getElementById('alexisModal'); if(modal) modal.setAttribute('aria-hidden','true');
  const overlay = document.getElementById('winOverlay'); if(overlay){ overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true'); const pets = overlay.querySelectorAll('.win-pet'); pets.forEach(el=> el.classList.remove('celebrate')); }
  renderQuestion();
});

// Alexis hug sequence (aparece solo al final)
alexisBtn && alexisBtn.addEventListener('click', () => {
  if(!alexisBtn.classList.contains('visible')) return; // activo solo cuando visible en el final
  if(hugCount >= hugMax) return;
  hugCount++;
  const msg = hugMsgs[hugCount-1] || 'Gracias 😊';
  showToast(msg, 'both', 'encourage');
  playPluck(820 + Math.random()*160, 0.2);
  // pequeña lluvia de corazones
  for(let i=0;i<4;i++){ const h = document.createElement('div'); h.textContent='💖'; h.style.position='fixed'; h.style.left = `${45 + Math.random()*10}%`; h.style.top = `${25 + Math.random()*20}%`; h.style.fontSize = `${10 + Math.random()*20}px`; h.style.opacity = '0.95'; h.style.transition='all 900ms ease'; document.body.appendChild(h); setTimeout(()=>{ h.style.top = `${55 + Math.random()*30}%`; h.style.opacity='0'; }, 60*i); setTimeout(()=> h.remove(), 1100); }
  // actualizar etiqueta
  const label = alexisBtn.querySelector('.alexis-label');
  if(label) label.textContent = (hugCount < hugMax) ? `Abrazalo (${hugCount}/${hugMax})` : '¡Ver regalo!';
  // si llega al máximo, cerrar alerta de puntaje, actualizar puntaje a completo y mostrar modal regalo
  if(hugCount >= hugMax){
    huggedAlexis = true;
    score = total; scoreEl.textContent = score; updateProgressFill();
    if(scorePopup) scorePopup.classList.remove('show');
    // hide the Alexis help alert/button now that the hug sequence is complete
    if(alexisBtn){ alexisBtn.classList.add('hidden'); alexisBtn.classList.remove('visible','center'); alexisBtn.setAttribute('aria-hidden','true'); const prompt = document.getElementById('alexisPrompt'); if(prompt) prompt.style.display='none'; }
    // update modal score display so player sees 10/10 when modal opens
    const modal = document.getElementById('alexisModal'); if(modal){ const ms = modal.querySelector('#alexisModalScore'); if(ms) ms.textContent = `Puntaje: ${score} / ${total}`; }
    setTimeout(()=> showAlexisModal(), 500);
  }
});

// Mostrar modal de Alexis
function showAlexisModal(){
  const modal = document.getElementById('alexisModal');
  if(!modal) return;
  modal.setAttribute('aria-hidden','false');
  showToast('Alexis te quiere mucho 💖', 'both', 'success', 2600);
}

// Manejo del regalo (abrir)
const giftBtn = document.getElementById('giftBtn');
giftBtn && giftBtn.addEventListener('click', ()=>{
  const modal = document.getElementById('alexisModal'); if(modal) modal.setAttribute('aria-hidden','true');
  huggedAlexis = true;
  // actualizar puntaje a total y mostrar overlay gigante
  score = total; scoreEl.textContent = score; updateProgressFill();
  playCelebrate(); bigConfetti();
  const overlay = document.getElementById('winOverlay');
  if(overlay){
    // set the win overlay score and custom message
    const ws = overlay.querySelector('#winScore'); if(ws) ws.textContent = `Puntaje: ${score} / ${total}`;
    const wm = overlay.querySelector('#winMsg'); if(wm) wm.innerHTML = 'De parte de Alexis, Botton y Bao:<br>Gracias por compartir este momento con nosotros.<br>Eres una persona única, especial y muy valiosa.<br>Mereces amor, sonrisas y que la vida te consienta un poquito más cada día.<br>Te queremos mucho 🐶🐹💗';
    overlay.classList.add('show'); overlay.setAttribute('aria-hidden','false'); const pets = overlay.querySelectorAll('.win-pet'); pets.forEach(el=> el.classList.add('celebrate')); petVictoryAnimation();
  }
  showToast('¡Alexis te regaló todos los puntos! 🎁', 'both', 'success');
});

// Cerrar overlay de victoria
const closeWin = document.getElementById('closeWin');
closeWin && closeWin.addEventListener('click', ()=>{
  const overlay = document.getElementById('winOverlay');
  if(overlay){ overlay.classList.remove('show'); overlay.setAttribute('aria-hidden','true'); const pets = overlay.querySelectorAll('.win-pet'); pets.forEach(el=> el.classList.remove('celebrate')); }
});

function showResults(){
  document.getElementById('card').scrollIntoView({behavior:'smooth'});
  let finalScore = score; let extraMsg = '';
  if(huggedAlexis && score < total){ finalScore = total; extraMsg = '¡Sorpresa! Alexis te regaló todos los puntos 🎁'; score = finalScore; scoreEl.textContent = score; updateProgressFill(); playCelebrate(); }

  let msg = '';
  if(finalScore >= 9) msg = `¡Perfecto, Lauluphine! 🌟 Obtuviste ${finalScore}/${total}. ¡Eres una estrella kawaii!`;
  else if (finalScore >= 6) msg = `¡Bravo! 😍 ${finalScore}/${total}. ¡Qué dulce eres!`;
  else msg = `¡Qué ternura! 💕 ${finalScore}/${total}. Un poquito más y será perfecto.`;

  if(extraMsg) msg = `${extraMsg}<br>${msg}`;

  resultEl.innerHTML = `<div class="sparkles">✨</div><div style="margin-top:8px; font-weight:700">${msg}</div><div style="margin-top:10px; color:var(--muted)">Botton y Bao están orgullosos de ti 🐶🐹</div>`;
  resultEl.style.display = 'block'; nextBtn.style.display = 'none'; restartBtn.style.display = 'inline-block';
  if(!extraMsg) playCelebrate();
  confettiHearts();

  // Mostrar la opción de abrazar a Alexis SOLO al final (si no está ya regalada)
  setTimeout(()=>{
    if(!huggedAlexis){
      const prompt = document.getElementById('alexisPrompt');
      if(alexisBtn){ alexisBtn.classList.remove('hidden'); alexisBtn.classList.add('visible','center'); alexisBtn.setAttribute('aria-hidden','false'); }
      if(prompt){ prompt.style.display='block'; prompt.textContent = '¿Quieres una ayuda? ¡Abrazalo!'; }
      showToast('¿Quieres una ayuda? Abrazalo para una sorpresa 💝', 'both', 'encourage', 3000);
      hugCount = 0;
      const label = alexisBtn && alexisBtn.querySelector('.alexis-label'); if(label) label.textContent = 'Abrazar a Alexis';
    }
  }, 600);
}

function confettiHearts(){
  for(let i=0;i<10;i++){
    const h = document.createElement('div'); h.textContent = '💖'; h.style.position = 'fixed'; h.style.left = `${20 + Math.random()*80}%`; h.style.top = `${10 + Math.random()*30}%`;
    h.style.fontSize = `${12 + Math.random()*28}px`; h.style.opacity = 0.9; h.style.transform = `translateY(-10px) rotate(${Math.random()*60-30}deg)`; h.style.transition = 'all 2.2s ease'; document.body.appendChild(h);
    setTimeout(()=> { h.style.top = `${70 + Math.random()*20}%`; h.style.opacity = 0; }, 80 * i);
    setTimeout(()=> { h.remove(); }, 2600);
  }
}

function bigConfetti(){ // versión más grande y colorida para la victoria
  const emojis = ['💖','✨','🌸','🎉','🎊'];
  for(let i=0;i<30;i++){
    const c = document.createElement('div'); c.textContent = emojis[Math.floor(Math.random()*emojis.length)]; c.style.position = 'fixed'; c.style.left = `${Math.random()*100}%`; c.style.top = `${-10 + Math.random()*10}%`;
    c.style.fontSize = `${12 + Math.random()*44}px`; c.style.opacity = 0.95; c.style.transition = `all ${1200 + Math.random()*1400}ms ease`;
    document.body.appendChild(c);
    setTimeout(()=>{ c.style.top = `${70 + Math.random()*30}%`; c.style.opacity = 0; }, 40 * i);
    setTimeout(()=> c.remove(), 2600 + Math.random()*1200);
  }
}

// Particle helpers for correct/wrong answers
function showCorrectParticles(){
  for(let i=0;i<16;i++){
    const p = document.createElement('div'); p.className = 'particle heart'; p.textContent = '💖';
    p.style.left = `${10 + Math.random()*80}%`; p.style.top = `${40 + Math.random()*30}%`; p.style.fontSize = `${14 + Math.random()*26}px`;
    p.style.setProperty('--tx', `${Math.random()*80-40}px`);
    document.body.appendChild(p);
    setTimeout(()=> p.remove(), 1700 + Math.random()*800);
  }
}

function showWrongParticles(){
  for(let i=0;i<12;i++){
    const p = document.createElement('div'); p.className = 'particle sad'; p.textContent = '😢';
    p.style.left = `${10 + Math.random()*80}%`; p.style.top = `${40 + Math.random()*30}%`; p.style.fontSize = `${14 + Math.random()*26}px`;
    p.style.setProperty('--tx', `${Math.random()*80-40}px`);
    document.body.appendChild(p);
    setTimeout(()=> p.remove(), 1400 + Math.random()*800);
  }
}

function petVictoryAnimation(){
  const overlay = document.getElementById('winOverlay');
  if(!overlay) return;
  const wraps = overlay.querySelectorAll('.win-pet-wrap');
  wraps.forEach((wrap,i)=>{
    for(let j=0;j<6;j++){
      const s = document.createElement('div'); s.className='particle heart'; s.textContent='✨';
      s.style.left = `${50 + (i===0?-1:1)*10 + Math.random()*10}%`; s.style.top = `${40 + Math.random()*12}%`; s.style.fontSize = `${8 + Math.random()*18}px`;
      s.style.setProperty('--tx', `${Math.random()*60-30}px`);
      document.body.appendChild(s); setTimeout(()=> s.remove(), 1600 + Math.random()*900);
    }
  });
}

// Inicializar: cargar preguntas desde JSON si hay, sino usar defaults
(function init(){
  fetch('assets/questions.json').then(r => r.json()).then(data => { questions = data.slice(0,10); }).catch(()=> { questions = defaultQuestions.slice(0,10); }).finally(()=>{
    // ensure progress has exactly 10 segments
    const extra = 10 - progressEl.children.length;
    if(extra > 0){ for(let i=0;i<extra;i++){ const seg = document.createElement('div'); seg.className='seg'; progressEl.appendChild(seg); } }
    updateProgressFill();
    // Wait for player to start — show intro until start pressed
    const intro = document.getElementById('introOverlay');
    const startBtn = document.getElementById('startBtn');
    if(startBtn && intro){
      startBtn.addEventListener('click', ()=>{
        // small start celebration: pop and float pets, spawn some sparkles
        const petsWrap = intro.querySelector('.intro-pets');
        if(petsWrap){
          petsWrap.classList.add('start-celebrate');
          const pets = petsWrap.querySelectorAll('.intro-pet');
          pets.forEach((p,i)=>{ p.classList.add('pop'); p.style.animationDelay = `${i*120}ms`; });
        }
        // spawn sparkles/hearts
        for(let i=0;i<12;i++){ const p = document.createElement('div'); p.className='particle heart'; p.textContent='✨'; p.style.left = `${40 + Math.random()*20}%`; p.style.top = `${45 + Math.random()*10}%`; p.style.fontSize = `${8 + Math.random()*24}px`; document.body.appendChild(p); setTimeout(()=> p.remove(), 1400 + Math.random()*900); }
        // hide intro after animation
        setTimeout(()=>{ intro.classList.add('hidden'); intro.style.display = 'none'; renderQuestion(); }, 720);
      });
    } else {
      // fallback
      renderQuestion();
    }
  });
})();
