const letters = [
  'А','Б','В','Г','Д','Е',
  'Ё','Ж','З','И','Й','К',
  'Л','М','Н','О','П','Р',
  'С','Т','У','Ф','Х','Ц',
  'Ч','Ш','Щ','Ъ','Ы','Ь',
  'Э','Ю','Я','','',''
];

function generateCipher(text) {
  text = text.toUpperCase().replace(/Ё/g, 'Е');
  let res = '';
  for (const ch of text) {
    const idx = letters.indexOf(ch);
    if (idx === -1) continue;
    const row = Math.floor(idx / 6) + 1;
    const col = (idx % 6) + 1;
    res += row.toString() + col.toString() + ' ';
  }
  return res.trim();
}

const rawQuestions = [
  { q: "В какое время года родился писатель Игорь Михайлович Бондаренко?", a: ["ОСЕНЬ"] },
  { q: "В каком городе родился Игорь Михайлович Бондаренко?", a: ["ТАГАНРОГ", "ГОРОД ТАГАНРОГ", "В ГОРОДЕ ТАГАНРОГЕ", "В ТАГАНРОГЕ"] },
  { q: "Назовите актера, в честь которого мама писателя его назвала?", a: ["ГАРРИ ПИЛЬ"] },
  { q: "В каком возрасте Игорь Михайлович Бондаренко был угнан в Германию?", a: ["ЧЕТЫРНАДЦАТЬ ЛЕТ", "ЧЕТЫРНАДЦАТЬ"] },
  { q: "Назовите лагерь, куда попал в плен Игорь Михайлович Бондаренко?", a: ["СПОРТ-ПАЛАСТ"] },
  { q: "Лагерный номер писателя?", a: ["ЧЕТЫРЕ ТЫСЯЧИ СЕМЬСОТ СЕМЬДЕСЯТ ЧЕТЫРЕ"] },
  { q: "Назовите главную героиню одноименной повести Игоря Михайловича Бондаренко?", a: ["АСТРИД"] },
  { q: "Назовите повесть, которая была включена в список рекомендательной литературы «советским разведчикам»?", a: ["КТО ПРИДЕТ НА МАРИИНЕ"] },
  { q: "В каком литературном журнале работал Игорь Бондаренко?", a: ["ДОН"] },
  { q: "Назовите количество написанных и напечатанных книг Игоря Михайловича Бондаренко?", a: ["ТРИДЦАТЬ ЧЕТЫРЕ"] },
  { q: "Назовите одно из первых независимых издательств России, создателем которого был Игорь Михайлович Бондаренко?", a: ["МАПРЕКОН"] },
  { q: "Количество библиотек Ростовской области, которым присвоено имя Игоря Михайловича Бондаренко?", a: ["ДВЕ"] },
  { q: "Укажите количество конкурсов-номинаций международного фестиваля конкурса «Война. Судьба. Книга. Игорь Бондаренко и Иван Мележ»?", a: ["ШЕСТЬ"] }
];

const questions = rawQuestions.map(item => ({
  question: item.q,
  answer: item.a[0].toUpperCase(),
  altAnswers: item.a.slice(1).map(alt => alt.toUpperCase()),
  cipher: generateCipher(item.a[0])
}));

const polybiusContainer = document.getElementById('polybius-container');
const questionTextEl = document.getElementById('question-text');
const cipherTextEl = document.getElementById('cipher-text');
const answerInput = document.getElementById('answerInput');
const checkBtn = document.getElementById('checkBtn');
const resultDiv = document.getElementById('result');
const prevQuestionBtn = document.getElementById('prevQuestionBtn');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const canvas = document.getElementById('fireworks-canvas');
const ctx = canvas.getContext('2d');
const successMsg = document.getElementById('success-message');

const invitationModal = document.getElementById('invitation-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');

let cw, ch;
let particles = [];
let animationFrameId;
let resultTimeoutId = null;

function resize() {
  cw = window.innerWidth;
  ch = window.innerHeight;
  canvas.width = cw;
  canvas.height = ch;
}
window.addEventListener('resize', resize);
resize();

function createPolybiusSquare() {
  polybiusContainer.innerHTML = '';
  for(let row=1; row<=6; row++) {
    const rowNum = document.createElement('div');
    rowNum.className = 'row-num';
    rowNum.style.gridRow = row + 1;
    rowNum.style.gridColumn = 1;
    rowNum.textContent = row;
    polybiusContainer.appendChild(rowNum);

    for(let col=1; col<=6; col++) {
      const idx = (row - 1) * 6 + (col - 1);
      const ltr = letters[idx] || '';
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.style.gridRow = row + 1;
      cell.style.gridColumn = col + 1;
      if(ltr === '') {
        cell.style.visibility = 'hidden';
        cell.style.pointerEvents = 'none';
      } else {
        cell.textContent = ltr;
      }
      polybiusContainer.appendChild(cell);
    }
  }
  for(let col=1; col<=6; col++) {
    const colNum = document.createElement('div');
    colNum.className = 'col-num';
    colNum.style.gridColumn = col + 1;
    colNum.style.gridRow = 1;
    colNum.textContent = col;
    polybiusContainer.appendChild(colNum);
  }
}

createPolybiusSquare();
addClickListenersToCells();

function addClickListenersToCells() {
  const cells = document.querySelectorAll('#polybius-container .cell');
  cells.forEach(cell => {
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', () => {
      const letter = cell.textContent.trim();
      if (letter) {
        answerInput.value += letter;
        answerInput.focus();
      }
    });
  });
}

answerInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    checkBtn.click();
  }
});

let currentIndex = 0;

function loadQuestion(index) {
  if (questions.length === 0) {
    questionTextEl.textContent = "Вопросы не загружены.";
    cipherTextEl.textContent = "";
    answerInput.disabled = true;
    checkBtn.disabled = true;
    prevQuestionBtn.disabled = true;
    nextQuestionBtn.disabled = true;
    return;
  }

  currentIndex = (index + questions.length) % questions.length;
  const q = questions[currentIndex];

  questionTextEl.textContent = q.question;
  cipherTextEl.textContent = q.cipher ? `Подсказка (шифр): ${q.cipher}` : '';
  answerInput.value = '';
  resultDiv.textContent = '';
  successMsg.style.display = 'none';

  answerInput.disabled = false;
  checkBtn.disabled = false;
  prevQuestionBtn.disabled = false;
  nextQuestionBtn.disabled = false;
}

loadQuestion(currentIndex);

prevQuestionBtn.onclick = () => {
  loadQuestion(currentIndex - 1);
};

nextQuestionBtn.onclick = () => {
  loadQuestion(currentIndex + 1);
};

checkBtn.onclick = () => {
  let userAnswer = answerInput.value.toUpperCase().trim().replace(/\s+/g, ' ');
  if (!questions.length) return;

  const currentQuestion = questions[currentIndex];
  const correctAnswers = [currentQuestion.answer, ...currentQuestion.altAnswers].map(ans =>
    ans.toUpperCase().trim().replace(/\s+/g, ' ')
  );

  if (userAnswer === '') {
    showResult("Пожалуйста, введите ответ.", false);
    return;
  }

  const isCorrect = correctAnswers.includes(userAnswer);

  if (isCorrect) {
    showResult("Верно!", true);
    startFireworks();

    const lastQuestionText = "Укажите количество конкурсов-номинаций международного фестиваля конкурса «Война. Судьба. Книга. Игорь Бондаренко и Иван Мележ»?";

    if (currentQuestion.question === lastQuestionText) {
      setTimeout(() => {
        showInvitationModal();

        answerInput.disabled = true;
        checkBtn.disabled = true;
        prevQuestionBtn.disabled = true;
        nextQuestionBtn.disabled = true;
      }, 1200);
    } else {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) nextIndex = 0;
      setTimeout(() => loadQuestion(nextIndex), 1200);
    }
  } else {
    showResult("Неверно", false);
  }
};

function showResult(message, isCorrect) {
  if (resultTimeoutId) {
    clearTimeout(resultTimeoutId);
    resultTimeoutId = null;
  }

  resultDiv.textContent = message;
  resultDiv.style.color = isCorrect ? "#218838" : "#c82333";

  if (isCorrect) {
    successMsg.style.display = 'block';

    resultTimeoutId = setTimeout(() => {
      resultDiv.textContent = '';
      successMsg.style.display = 'none';
      resultTimeoutId = null;
    }, 3000);
  } else {
    successMsg.style.display = 'none';
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 2 + 1;
    this.speed = Math.random() * 5 + 2;
    this.angle = Math.random() * 2 * Math.PI;
    this.gravity = 0.05;
    this.alpha = 1;
    this.decay = Math.random() * 0.015 + 0.01;
    this.vx = Math.cos(this.angle) * this.speed;
    this.vy = Math.sin(this.angle) * this.speed;
  }
  update() {
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= this.decay;
  }
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function randomColor() {
  const colors = [
    '#ff3f3f', '#ff9f3f', '#fff53f', '#3fff7f',
    '#3fffff', '#3f3fff', '#9f3fff', '#ff3fff'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createFirework() {
  const x = Math.random() * cw * 0.8 + cw * 0.1;
  const y = Math.random() * ch * 0.5 + ch * 0.1;
  const count = 50 + Math.floor(Math.random() * 30);
  for(let i=0; i<count; i++) {
    particles.push(new Particle(x, y, randomColor()));
  }
}

function animate() {
  ctx.clearRect(0, 0, cw, ch);
  particles.forEach((p, i) => {
    p.update();
    if(p.alpha <= 0) {
      particles.splice(i, 1);
    } else {
      p.draw(ctx);
    }
  });
  animationFrameId = requestAnimationFrame(animate);
}

function startFireworks() {
  canvas.style.display = 'block';
  successMsg.style.display = 'block';
  let fireworksCount = 8;
  let interval = setInterval(() => {
    createFirework();
    fireworksCount--;
    if(fireworksCount <= 0) {
      clearInterval(interval);
      setTimeout(() => {
        canvas.style.display = 'none';
        particles = [];
        cancelAnimationFrame(animationFrameId);
      }, 5000);
    }
  }, 400);
  animate();
}

function showInvitationModal() {
  invitationModal.style.display = 'flex';
  modalCloseBtn.focus();
  document.body.style.overflow = 'hidden';
}

function hideInvitationModal() {
  invitationModal.style.display = 'none';
  document.body.style.overflow = '';
  answerInput.focus();
}

modalCloseBtn.addEventListener('click', hideInvitationModal);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && invitationModal.style.display === 'flex') {
    hideInvitationModal();
  }
});
