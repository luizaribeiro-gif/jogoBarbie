
// ===== Configuração =====
let W = 900;                               // largura se ajusta à tela (ver ajustarTela)
const H = 450, CHAO = 370;                 // altura fixa; chão: y = 370
const GRAVIDADE = 2400, VELOCIDADE_PULO = -820;
const TEMPO_JOGO = 60;
const JOGADORA = { x: 110, w: 90, h: 110 };
const OBSTACULO = { w: 70, h: 70 };

// ===== Elementos =====
const $ = (id) => document.getElementById(id);

const telaFundo = $('fundo');
const ctx = telaFundo.getContext('2d');

const elementoJogadora = $('jogadora');
const elementoObstaculo = $('obstaculo');
const elementoRecompensa = $('recompensa');

const elementoTempo = $('tempo');
const elementoPontuacao = $('pontuacao');

const telaInicio = $('tela-inicio');
const telaFim = $('tela-fim');
const telaVitoria = $('tela-vitoria');

// Fallback se alguma imagem não existir
[elementoJogadora, elementoObstaculo].forEach((imagem) => {
  imagem.addEventListener('error', () => {
    imagem.classList.add('faltando');
    imagem.removeAttribute('src');
  });
});

$('imagem-fim').addEventListener('error', () => {
  $('imagem-fim').classList.add('oculto');
  $('texto-fim').classList.remove('oculto');
});

$('imagem-derrota').addEventListener('error', () => {
  $('imagem-derrota').classList.add('oculto');
});

// ===== Estado =====
let estado = 'inicio';
let ultimo = 0, tempoRestante, pontuacao, velocidade;
let posicaoY, velocidadeY, noChao;
let posicaoObstaculo, posicaoRecompensaX, posicaoRecompensaY;
let rolagemCeu, rolagemDistante, rolagemMedia, rolagemProxima;

function reiniciar() {
  tempoRestante = TEMPO_JOGO;
  pontuacao = 0;
  velocidade = 330;

  posicaoY = CHAO - JOGADORA.h;
  velocidadeY = 0;
  noChao = true;

  posicaoObstaculo = W + 300;
  criarRecompensa(W + 150);

  rolagemCeu = rolagemDistante = rolagemMedia = rolagemProxima = 0;

  elementoJogadora.src = 'barbie.gif';
  elementoJogadora.classList.remove('faltando');

  atualizarPainel();
  desenhar();
}

function criarRecompensa(inicioX) {
  posicaoRecompensaX = inicioX + Math.random() * 300;
  posicaoRecompensaY = CHAO - 150 - Math.random() * 110;
}

function iniciar() {
  reiniciar();

  telaInicio.classList.add('oculto');
  telaFim.classList.add('oculto');
  telaVitoria.classList.add('oculto');

  estado = 'jogando';
  ultimo = performance.now();

  requestAnimationFrame(loop);
}

function pular() {
  if (estado === 'jogando' && noChao) {
    velocidadeY = VELOCIDADE_PULO;
    noChao = false;
  }
}

// ===== Loop =====
function loop(agora) {
  if (estado !== 'jogando') return;

  const dt = Math.min((agora - ultimo) / 1000, 0.05);
  ultimo = agora;

  atualizar(dt);
  desenhar();

  if (estado === 'jogando') requestAnimationFrame(loop);
}

function atualizar(dt) {
  // tempo
  tempoRestante -= dt;
  velocidade = 330 + (TEMPO_JOGO - tempoRestante) * 4;

  if (tempoRestante <= 0) {
    tempoRestante = 0;
    atualizarPainel();
    return finalizarJogo(true);
  }

  // pulo
  velocidadeY += GRAVIDADE * dt;
  posicaoY += velocidadeY * dt;

  if (posicaoY >= CHAO - JOGADORA.h) {
    posicaoY = CHAO - JOGADORA.h;
    velocidadeY = 0;
    noChao = true;
  }

  // obstáculo
  posicaoObstaculo -= velocidade * dt;

  if (posicaoObstaculo < -OBSTACULO.w) {
    posicaoObstaculo = W + 250 + Math.random() * 450;
  }

  // recompensa
  posicaoRecompensaX -= (velocidade * 0.8) * dt;

  if (posicaoRecompensaX < -50) {
    criarRecompensa(W + 100);
  }

  // parallax
  rolagemCeu += 8 * dt;
  rolagemDistante += 25 * dt;
  rolagemMedia += 70 * dt;
  rolagemProxima += velocidade * dt;

  // colisões
  const caixaJogadora = {
    x: JOGADORA.x + 18,
    y: posicaoY + 12,
    w: JOGADORA.w - 36,
    h: JOGADORA.h - 14
  };

  const caixaObstaculo = {
    x: posicaoObstaculo + 8,
    y: CHAO - OBSTACULO.h + 8,
    w: OBSTACULO.w - 16,
    h: OBSTACULO.h - 8
  };

  const caixaRecompensa = {
    x: posicaoRecompensaX,
    y: posicaoRecompensaY,
    w: 44,
    h: 44
  };

  if (colidiu(caixaJogadora, caixaObstaculo)) {
    return finalizarJogo(false);
  }

  if (colidiu(caixaJogadora, caixaRecompensa)) {
    pontuacao += 10;
    criarRecompensa(W + 150);
  }

  atualizarPainel();
}

function colidiu(a, b) {
  return a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y;
}

function finalizarJogo(venceu) {
  estado = venceu ? 'vitoria' : 'fim';

  if (venceu) {
    $('pontuacao-vitoria').textContent = pontuacao;
    telaVitoria.classList.remove('oculto');
  } else {
    elementoJogadora.src = 'perdeu.gif';
    $('pontuacao-final').textContent = pontuacao;
    telaFim.classList.remove('oculto');
  }
}

function atualizarPainel() {
  elementoTempo.textContent = Math.ceil(tempoRestante);
  elementoPontuacao.textContent = pontuacao;
}

// ===== Desenho =====
function desenhar() {
  desenharFundo();

  elementoJogadora.style.transform =
    `translate(${JOGADORA.x}px, ${posicaoY}px)`;

  elementoObstaculo.style.transform =
    `translate(${posicaoObstaculo}px, ${CHAO - OBSTACULO.h}px)`;

  elementoRecompensa.style.transform =
    `translate(${posicaoRecompensaX}px, ${posicaoRecompensaY}px)`;
}

function desenharFundo() {
  // céu
  const g = ctx.createLinearGradient(0, 0, 0, 260);
  g.addColorStop(0, '#6ec6ff');
  g.addColorStop(1, '#ffe9c7');

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // sol
  ctx.fillStyle = '#fff3a0';
  ctx.beginPath();
  ctx.arc(760, 90, 46, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd84d';
  ctx.beginPath();
  ctx.arc(760, 90, 34, 0, Math.PI * 2);
  ctx.fill();

  // nuvens
  for (let i = 0; i < 4; i++) {
    const cx = ((i * 260 - rolagemCeu * 10) % (W + 200) + (W + 200)) % (W + 200) - 100;
    nuvem(cx, 60 + (i % 2) * 45, 0.9 + (i % 3) * 0.2);
  }

  // mar distante
  ctx.fillStyle = '#3fa7d6';
  ctx.fillRect(0, 235, W, 70);

  ondas(245, '#7cc8ec', rolagemDistante * 2, 6, 60);

  // palmeiras
  const bloco = 450;

  for (let x = -((rolagemMedia) % bloco) - bloco; x < W + bloco; x += bloco) {
    palmeira(x + 120, CHAO - 6, 120, 1);
    palmeira(x + 340, CHAO - 6, 90, -1);
  }

  // mar próximo
  ctx.fillStyle = '#1f8fc7';
  ctx.fillRect(0, 300, W, 75);

  ondas(315, '#ffffff99', rolagemMedia * 1.5, 5, 40);
  ondas(345, '#ffffff66', rolagemMedia * 2, 5, 55);

  // areia
  ctx.fillStyle = '#f4d58d';
  ctx.fillRect(0, CHAO, W, H - CHAO);

  ctx.fillStyle = '#e8c070';
  ctx.fillRect(0, CHAO, W, 5);

  ctx.fillStyle = '#d9ae5c';

  for (let x = -((rolagemProxima) % 120) - 120; x < W + 120; x += 120) {
    ctx.beginPath();
    ctx.arc(x + 30, CHAO + 30, 4, 0, 7);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 85, CHAO + 55, 3, 0, 7);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 60, CHAO + 72, 5, 0, 7);
    ctx.fill();
  }
}

function nuvem(x, y, s) {
  ctx.fillStyle = '#ffffffdd';
  ctx.beginPath();

  ctx.arc(x, y, 22 * s, 0, 7);
  ctx.arc(x + 25 * s, y - 10 * s, 28 * s, 0, 7);
  ctx.arc(x + 55 * s, y, 22 * s, 0, 7);

  ctx.fill();
}

function ondas(y, cor, deslocamento, amplitude, comprimento) {
  ctx.strokeStyle = cor;
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let x = 0; x <= W; x += 6) {
    const yy = y + Math.sin((x + deslocamento) / comprimento * Math.PI * 2) * amplitude * 0.5;

    x === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  }

  ctx.stroke();
}

function palmeira(x, baseY, h, direcao) {
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x, baseY);

  const tx = x + direcao * 18;
  const ty = baseY - h;

  ctx.quadraticCurveTo(x + direcao * 22, baseY - h / 2, tx, ty);
  ctx.stroke();

  ctx.fillStyle = '#2f9e44';

  for (let a = -2; a <= 2; a++) {
    ctx.beginPath();

    ctx.ellipse(tx + a * 14, ty - Math.abs(a) * -3 + 2, 30, 8, a * 0.5, 0, 7);
    ctx.fill();
  }
}

// ===== Ajuste de tela =====
function ajustarTela() {
  const escala = window.innerHeight / H;

  W = Math.ceil(window.innerWidth / escala);

  telaFundo.width = W;
  telaFundo.height = H;

  telaFundo.style.width = W + 'px';
  telaFundo.style.height = H + 'px';

  $('jogo').style.width = W + 'px';

  const envoltorio = $('envoltorio');

  envoltorio.style.width = W + 'px';
  envoltorio.style.transform = `scale(${escala})`;
}

window.addEventListener('resize', () => {
  ajustarTela();

  if (estado !== 'jogando' && posicaoY !== undefined) {
    desenhar();
  }
});

ajustarTela();

// ===== Controles =====
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();

    if (estado === 'jogando') {
      pular();
    } else if (estado === 'inicio' || estado === 'fim' || estado === 'vitoria') {
      iniciar();
    }
  }

  if (e.code === 'Enter' && estado !== 'jogando') {
    iniciar();
  }
});

$('jogo').addEventListener('pointerdown', (e) => {
  if (e.target.tagName !== 'BUTTON') {
    pular();
  }
});

$('botao-iniciar').addEventListener('click', iniciar);
$('botao-tentar').addEventListener('click', iniciar);
$('botao-novamente').addEventListener('click', iniciar);

reiniciar();
