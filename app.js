/* ==========================================================================
   UMBRAL — Landing · JS
   Tema · acento · nav · barra de oferta · progreso · reveal · count-up ·
   roadmap · FAQ · Diagnóstico gratuito (20 preguntas + resultados).
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  /* Paleta monocroma (blanco / negro / gris): los tokens de color los fija
     el CSS en :root. Solo modo oscuro: sin selector de tema. */
  root.setAttribute('data-theme', 'dark');

  /* ---------- Barra de oferta: cerrar ---------- */
  var promoX = $('#promoClose');
  if (safeGet('promo') === 'off') document.body.classList.add('promo-off');
  if (promoX) promoX.addEventListener('click', function () {
    document.body.classList.add('promo-off');
    safeSet('promo', 'off');
  });

  /* ---------- Nav: sombra + menú móvil ---------- */
  var nav = $('#nav');
  var navLinks = $('#navLinks');
  var navToggle = $('#navToggle');
  var progress = $('#navProgress');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Efectos de scroll: progreso + sombra nav + parallax + roadmap ---------- */
  var heroInner = $('.hero__inner');
  var roadmap = $('#roadmapTrack');
  var roadSteps = $$('.road-step');
  var ticking = false;

  function onScroll() {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }
  function update() {
    ticking = false;
    var y = window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;

    if (progress) progress.style.transform = 'scaleX(' + (docH > 0 ? clamp(y / docH, 0, 1) : 0) + ')';
    if (nav) nav.classList.toggle('is-stuck', y > 8);
    if (heroInner && !reduce && y < window.innerHeight) heroInner.style.transform = 'translateY(' + (y * 0.12) + 'px)';

    if (roadmap) {
      var r = roadmap.getBoundingClientRect();
      var p = clamp((window.innerHeight * 0.5 - r.top) / r.height, 0, 1);
      roadmap.style.setProperty('--road', p.toFixed(3));
      for (var i = 0; i < roadSteps.length; i++) {
        var sr = roadSteps[i].getBoundingClientRect();
        if (sr.top < window.innerHeight * 0.62) roadSteps[i].classList.add('is-reached');
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  /* ---------- Reveal ---------- */
  var reveals = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }
  // Si se entra con ancla (#seccion), muestra ya esa sección y sus hijos reveal.
  function revealHashTarget() {
    if (!location.hash) return;
    var tgt = document.getElementById(location.hash.slice(1));
    if (!tgt) return;
    if (tgt.classList.contains('reveal')) tgt.classList.add('is-in');
    $$('.reveal', tgt).forEach(function (el) { el.classList.add('is-in'); });
  }
  revealHashTarget();
  window.addEventListener('hashchange', revealHashTarget);

  /* ---- Gráficas animadas: se (re)disparan al entrar en viewport ---- */
  var figs = $$('.figcard');
  if (!('IntersectionObserver' in window) || reduce) {
    figs.forEach(function (f) { f.classList.add('fx-run'); });
  } else {
    var fio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) en.target.classList.add('fx-run');
        else en.target.classList.remove('fx-run');
      });
    }, { threshold: 0.35 });
    figs.forEach(function (f) { fio.observe(f); });
  }

  /* ---------- Count-up en stats ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var pre = el.getAttribute('data-prefix') || '';
    var suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = pre + target + suf; return; }
    var start = (window.performance && performance.now) ? performance.now() : Date.now();
    var dur = 1200;
    function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
    function tick() {
      var k = clamp((now() - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + Math.round(target * eased) + suf;
      if (k < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    // garantía: aunque rAF se congele (pestaña en segundo plano), el valor final queda correcto
    setTimeout(function () { el.textContent = pre + target + suf; }, dur + 150);
  }
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else counters.forEach(countUp);

  /* ---------- FAQ ---------- */
  $$('.qa').forEach(function (qa) {
    var btn = $('.qa__q', qa), panel = $('.qa__a', qa);
    if (!btn || !panel) return;
    btn.addEventListener('click', function () {
      var open = qa.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
    });
  });
  window.addEventListener('resize', function () {
    var o = $('.qa.is-open .qa__a');
    if (o) o.style.maxHeight = o.scrollHeight + 'px';
  });

  /* ======================================================================
     DIAGNÓSTICO GRATUITO
     ====================================================================== */
  var AXES = [
    { id: 'marca',     name: 'Marca personal', lever: 'Posicionamiento y mensaje de autoridad' },
    { id: 'captacion', name: 'Captación',      lever: 'Sistema de contenidos y captación constante' },
    { id: 'ventas',    name: 'Ventas',         lever: 'Proceso de ventas y política de precios' },
    { id: 'liderazgo', name: 'Liderazgo',      lever: 'Delegación, procesos y estructura' }
  ];
  // Cada pregunta con 4 respuestas propias y concretas (v: 0 = sano · 3 = punto de dolor)
  var QUESTIONS = [
    { ax: 'marca', t: '¿Cómo te eligen tus clientes frente a la competencia?', o: [
      ['Me eligen por criterio, aunque no sea el más barato', 0],
      ['Me comparan, pero suelo ganar sin pelear el precio', 1],
      ['Acabo justificando mucho mi tarifa para que me elijan', 2],
      ['Compito de lleno por precio y lo noto en el margen', 3] ] },
    { ax: 'marca', t: 'Si alguien te pide en una frase qué te hace diferente…', o: [
      ['Lo tengo clarísimo y lo digo sin pensar', 0],
      ['Lo sé, pero me cuesta resumirlo bien', 1],
      ['Improviso una respuesta distinta cada vez', 2],
      ['No sabría qué decir con seguridad', 3] ] },
    { ax: 'marca', t: 'Fuera de tu círculo cercano, ¿te reconocen como referente?', o: [
      ['Sí, me escribe gente que ya me sigue', 0],
      ['Empiezan a conocerme dentro de mi nicho', 1],
      ['Solo me conocen si me presento yo', 2],
      ['Prácticamente nadie sabe quién soy', 3] ] },
    { ax: 'marca', t: '¿Tu marca transmite la autoridad que tienes por experiencia?', o: [
      ['Sí, mi imagen va por delante de mí', 0],
      ['Se acerca, pero se queda algo corta', 1],
      ['Transmite bastante menos de lo que valgo', 2],
      ['No refleja nada de mi trayectoria', 3] ] },
    { ax: 'marca', t: 'Antes de confiar en tu trabajo, la gente…', o: [
      ['Llega ya convencida', 0],
      ['Necesita poco para decidirse', 1],
      ['Me hace muchas preguntas y dudas', 2],
      ['Me obliga a "venderme" mucho cada vez', 3] ] },
    { ax: 'captacion', t: 'Si dejas de publicar o de escribir a gente un mes entero…', o: [
      ['Sigo teniendo oportunidades entrando', 0],
      ['Baja un poco, pero se sostiene', 1],
      ['Se nota bastante el bajón', 2],
      ['Se me seca la agenda', 3] ] },
    { ax: 'captacion', t: '¿Tienes un sistema que te traiga contactos interesados?', o: [
      ['Sí, funciona casi solo y es medible', 0],
      ['Tengo piezas sueltas que algo aportan', 1],
      ['Lo intento, pero sin método', 2],
      ['No tengo nada montado', 3] ] },
    { ax: 'captacion', t: '¿De dónde salen hoy tus clientes nuevos?', o: [
      ['De un sistema propio de captación', 0],
      ['Mezcla de sistema y referidos', 1],
      ['Casi todo boca a boca y suerte', 2],
      ['Ni idea de dónde saldrá el próximo', 3] ] },
    { ax: 'captacion', t: 'Tu contenido y tu comunicación…', o: [
      ['Responden a una estrategia y dan retorno', 0],
      ['Tienen rumbo, pero poco retorno aún', 1],
      ['Los hago sin un plan claro', 2],
      ['Publico a bandazos o directamente no publico', 3] ] },
    { ax: 'captacion', t: '¿Sabes de dónde vendrá tu facturación dentro de 60 días?', o: [
      ['Sí, con bastante previsión', 0],
      ['Más o menos, con cierto margen', 1],
      ['Es una incógnita casi siempre', 2],
      ['Ninguna, vivo mes a mes', 3] ] },
    { ax: 'ventas', t: '¿Cómo cierras normalmente una venta?', o: [
      ['Con un proceso claro y sin presionar', 0],
      ['Con algo de método, aunque cada una es distinta', 1],
      ['A base de insistir y muchas llamadas', 2],
      ['Casi persiguiendo al cliente', 3] ] },
    { ax: 'ventas', t: 'Cuando el cliente duda por el precio…', o: [
      ['Mantengo mi tarifa y aun así cierro', 0],
      ['A veces ajusto el alcance del trabajo', 1],
      ['Suelo hacer un descuento para no perderlo', 2],
      ['Bajo el precio casi siempre', 3] ] },
    { ax: 'ventas', t: 'Tu facturación mes a mes…', o: [
      ['Es estable y previsible', 0],
      ['Varía, pero dentro de un rango', 1],
      ['Da bandazos grandes', 2],
      ['Un mes bien y dos mal, sin control', 3] ] },
    { ax: 'ventas', t: '¿Tienes un proceso de ventas definido?', o: [
      ['Sí, con etapas y seguimiento', 0],
      ['Tengo una rutina informal', 1],
      ['Cada venta me la invento sobre la marcha', 2],
      ['No hay proceso, es puro azar', 3] ] },
    { ax: 'ventas', t: 'Subir tus precios te…', o: [
      ['Sale natural, mis precios acompañan mi valor', 0],
      ['Cuesta un poco, pero lo hago', 1],
      ['Da bastante vértigo y lo voy dejando', 2],
      ['Bloquea: llevo años sin tocarlos', 3] ] },
    { ax: 'liderazgo', t: 'Si paras una semana entera, el negocio…', o: [
      ['Sigue funcionando sin mí', 0],
      ['Aguanta con algún tema pendiente', 1],
      ['Se ralentiza mucho', 2],
      ['Se para casi del todo', 3] ] },
    { ax: 'liderazgo', t: 'Las decisiones importantes…', o: [
      ['Están repartidas y delegadas', 0],
      ['Comparto algunas, otras no', 1],
      ['Pasan casi todas por mí', 2],
      ['Absolutamente todas dependen de mí', 3] ] },
    { ax: 'liderazgo', t: 'Tu carga de trabajo y tu capacidad de desconectar…', o: [
      ['Trabajo lo que quiero y desconecto bien', 0],
      ['Voy justo, pero es llevadero', 1],
      ['Trabajo de más y me cuesta parar', 2],
      ['No desconecto nunca, estoy al límite', 3] ] },
    { ax: 'liderazgo', t: 'Delegar tareas te resulta…', o: [
      ['Fácil: tengo a quién y cómo', 0],
      ['Posible, aunque superviso mucho', 1],
      ['Difícil, siento que nadie lo hará igual', 2],
      ['Imposible, acabo haciéndolo yo', 3] ] },
    { ax: 'liderazgo', t: '¿Tienes estructura y procesos que sostengan el crecimiento?', o: [
      ['Sí, el negocio está sistematizado', 0],
      ['Algunos procesos, a medias', 1],
      ['Muy poco documentado', 2],
      ['Nada: todo está en mi cabeza', 3] ] }
  ];
  var LEVELS = ['Crítico', 'A mejorar', 'Sólido', 'Fuerte'];
  function levelOf(pct) { return pct < 40 ? 0 : pct < 65 ? 1 : pct < 85 ? 2 : 3; }
  var VERDICTS = [
    { h: 'Punto de partida crítico', p: 'Tu empresa depende casi por completo de ti. Es el mejor momento para construir una base sólida con método, antes de seguir sumando esfuerzo.' },
    { h: 'Base con fugas', p: 'Tienes cosas funcionando, pero el crecimiento se te escapa por varios lados a la vez. Ordenar marca, captación, ventas y liderazgo bajo un mismo sistema es lo que destraba el salto.' },
    { h: 'Estructura en marcha', p: 'Vas por buen camino. Ajustando una o dos palancas concretas puedes escalar con mucha más tranquilidad y previsibilidad.' },
    { h: 'Empresa sólida', p: 'Tu negocio ya se sostiene sin ti. El foco ahora es escalar, optimizar márgenes y consolidar tu autoridad en el sector.' }
  ];

  var STORE_KEY = 'umbral-diag-v2';   // clave nueva: ignora datos de pruebas anteriores
  var quiz = $('#quiz');
  var quizInner = $('#quizInner');
  var quizBar = $('#quizBar');
  var answers = [];
  var idx = 0;
  var lastFocus = null;

  function openQuiz() {
    if (!quiz) return;
    lastFocus = document.activeElement;
    quiz.classList.add('is-open');
    document.body.classList.add('no-scroll');
    var saved = safeGet(STORE_KEY);
    answers = [];
    if (saved) { try { answers = JSON.parse(saved) || []; } catch (e) { answers = []; } }
    if (!Array.isArray(answers)) answers = [];
    if (answers.length === QUESTIONS.length && answers.every(function (a) { return a != null; })) renderResults();
    else { idx = 0; renderIntro(); }
  }
  function closeQuiz() {
    if (!quiz) return;
    quiz.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $$('[data-open-quiz]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openQuiz(); }); });
  $$('[data-close-quiz]').forEach(function (b) { b.addEventListener('click', closeQuiz); });
  if (quiz) quiz.addEventListener('click', function (e) { if (e.target === quiz || e.target.classList.contains('quiz__backdrop')) closeQuiz(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && quiz && quiz.classList.contains('is-open')) closeQuiz(); });

  function setBar(pct) { if (quizBar) quizBar.style.width = pct + '%'; }

  function renderIntro() {
    setBar(0);
    quizInner.innerHTML =
      '<p class="quiz__eyebrow">Diagnóstico gratuito</p>' +
      '<h3>¿Cuánto depende tu empresa de ti hoy?</h3>' +
      '<p class="quiz__p">20 preguntas rápidas sobre tu marca, tu captación de clientes, tus ventas y tu forma de liderar. Al terminar recibes un diagnóstico con puntuación por área, gráfica y palancas concretas.</p>' +
      '<div class="quiz__meta"><span>20 preguntas</span><span>2 minutos</span><span>Resultado inmediato</span><span>Sin dejar tu email</span></div>' +
      '<div class="quiz__cta"><button class="btn btn--solid btn--lg" id="quizStart">Empezar diagnóstico</button>' +
      '<button class="btn btn--lg" data-close-quiz>Ahora no</button></div>';
    $('#quizStart').addEventListener('click', function () { idx = 0; renderQuestion(); });
    $$('[data-close-quiz]', quizInner).forEach(function (b) { b.addEventListener('click', closeQuiz); });
    quizInner.scrollTop = 0;
  }

  function syncNextBtn() {
    var nx = $('#qNext', quizInner);
    if (!nx) return;
    var ready = answers[idx] != null;
    nx.disabled = !ready;
    nx.style.opacity = ready ? '' : '.4';
    nx.style.pointerEvents = ready ? '' : 'none';
  }

  function renderQuestion() {
    var q = QUESTIONS[idx];
    var ax = AXES.filter(function (a) { return a.id === q.ax; })[0];
    var current = answers[idx];                       // undefined si aún no respondida
    setBar(Math.round(idx / QUESTIONS.length * 100));
    var opts = q.o.map(function (o) {
      var label = o[0], v = o[1];
      var sel = (current != null && Number(current) === v) ? ' is-sel' : '';
      return '<button type="button" class="q-opt' + sel + '" data-v="' + v + '">' +
             '<span class="q-opt__dot"></span>' + label + '</button>';
    }).join('');
    quizInner.innerHTML =
      '<p class="q-step">Pregunta ' + (idx + 1) + ' / ' + QUESTIONS.length + '</p>' +
      '<p class="q-axis">' + ax.name + '</p>' +
      '<p class="q-text">' + q.t + '</p>' +
      '<div class="q-options" id="qOptions">' + opts + '</div>' +
      '<div class="q-nav">' +
        '<button type="button" class="btn btn--sm" id="qPrev"' + (idx === 0 ? ' disabled style="opacity:.4;pointer-events:none"' : '') + '>← Anterior</button>' +
        '<button type="button" class="btn btn--sm btn--solid" id="qNext">' + (idx === QUESTIONS.length - 1 ? 'Ver resultado →' : 'Siguiente →') + '</button>' +
      '</div>';
    quizInner.scrollTop = 0;

    $('#qOptions', quizInner).addEventListener('click', function (e) {
      var b = e.target.closest('.q-opt');
      if (!b) return;
      answers[idx] = Number(b.getAttribute('data-v'));
      safeSet(STORE_KEY, JSON.stringify(answers));
      $$('.q-opt', quizInner).forEach(function (x) { x.classList.toggle('is-sel', x === b); });
      syncNextBtn();                                  // habilita "Siguiente" — NO avanza solo
    });
    $('#qPrev', quizInner).addEventListener('click', function () { if (idx > 0) { idx--; renderQuestion(); } });
    $('#qNext', quizInner).addEventListener('click', next);
    syncNextBtn();
  }
  function next() {
    if (answers[idx] == null) return;                 // exige respuesta
    if (idx < QUESTIONS.length - 1) { idx++; renderQuestion(); }
    else renderResults();
  }

  function scores() {
    var raw = {}; AXES.forEach(function (a) { raw[a.id] = 0; });
    QUESTIONS.forEach(function (q, i) { raw[q.ax] += (answers[i] || 0); });
    var pct = {};
    AXES.forEach(function (a) { pct[a.id] = Math.round((1 - raw[a.id] / 15) * 100); });
    var overall = Math.round(AXES.reduce(function (s, a) { return s + pct[a.id]; }, 0) / AXES.length);
    return { pct: pct, overall: overall };
  }

  function radarSVG(pct) {
    var cx = 130, cy = 128, R = 96;
    var order = ['marca', 'captacion', 'ventas', 'liderazgo'];
    var ang = [-90, 0, 90, 180];
    function pt(i, r) {
      var a = ang[i] * Math.PI / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }
    var rings = [25, 50, 75, 100].map(function (v) {
      var p = order.map(function (_, i) { return pt(i, R * v / 100).join(','); }).join(' ');
      return '<polygon class="grid-line" points="' + p + '"/>';
    }).join('');
    var axesL = order.map(function (_, i) { var e = pt(i, R); return '<line class="axis-line" x1="' + cx + '" y1="' + cy + '" x2="' + e[0] + '" y2="' + e[1] + '"/>'; }).join('');
    var poly = order.map(function (id, i) { return pt(i, R * pct[id] / 100).join(','); }).join(' ');
    var dots = order.map(function (id, i) { var p = pt(i, R * pct[id] / 100); return '<circle class="dot" cx="' + p[0] + '" cy="' + p[1] + '" r="3"/>'; }).join('');
    var labels =
      '<text x="' + cx + '" y="18" text-anchor="middle">MARCA</text>' +
      '<text x="' + (cx + R + 2) + '" y="' + (cy + 3) + '" text-anchor="end">CAPTACIÓN</text>' +
      '<text x="' + cx + '" y="' + (cy + R + 16) + '" text-anchor="middle">VENTAS</text>' +
      '<text x="' + (cx - R - 2) + '" y="' + (cy + 3) + '" text-anchor="start">LIDERAZGO</text>';
    return '<svg class="radar" viewBox="0 0 260 264" role="img" aria-label="Gráfica de diagnóstico por área">' +
      rings + axesL + '<polygon class="poly" points="' + poly + '"/>' + dots + labels + '</svg>';
  }

  function renderResults() {
    setBar(100);
    var s = scores();
    var ov = levelOf(s.overall);
    var bars = AXES.map(function (a) {
      var p = s.pct[a.id], lv = levelOf(p);
      return '<div class="abar"><div class="abar__top"><span class="abar__name">' + a.name +
        '</span><span class="abar__val">' + p + '%</span></div>' +
        '<div class="abar__track"><span class="abar__fill" data-w="' + p + '"></span></div>' +
        '<span class="abar__tag">' + LEVELS[lv] + ' · ' + a.lever + '</span></div>';
    }).join('');
    var rows = AXES.map(function (a) {
      var p = s.pct[a.id], lv = levelOf(p);
      return '<tr><td>' + a.name + '</td><td>' + p + '%</td><td><span class="res-chip" data-lvl="' + lv + '">' + LEVELS[lv] + '</span></td><td>' + a.lever + '</td></tr>';
    }).join('');
    rows += '<tr><td>Global</td><td>' + s.overall + '%</td><td><span class="res-chip" data-lvl="' + ov + '">' + LEVELS[ov] + '</span></td><td>Método Arquitectura Empresarial Identitaria</td></tr>';

    quizInner.innerHTML =
      '<p class="quiz__eyebrow">Tu diagnóstico</p>' +
      '<div class="res-head" style="margin-top:14px">' +
        '<div><div class="res-score">' + s.overall + '%<small>Independencia de tu empresa</small></div></div>' +
        '<div class="res-verdict"><h4>' + VERDICTS[ov].h + '</h4><p>' + VERDICTS[ov].p + '</p></div>' +
      '</div>' +
      '<div class="res-grid">' +
        '<div>' + radarSVG(s.pct) + '</div>' +
        '<div class="axis-bars">' + bars + '</div>' +
      '</div>' +
      '<table class="res-table"><thead><tr><th>Área</th><th>Puntuación</th><th>Estado</th><th>Palanca recomendada</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="res-cta">' +
        '<p>Este diagnóstico es orientativo. En la Sesión Estratégica lo revisamos contigo y definimos el plan para tu caso.</p>' +
        '<div class="hero__cta">' +
          '<a href="#clase" class="btn btn--solid btn--lg" data-close-quiz>Agenda tu Sesión Estratégica</a>' +
          '<button class="btn btn--lg" id="quizRestart">Repetir test</button>' +
        '</div>' +
      '</div>';
    quizInner.scrollTop = 0;

    var radar = $('.radar', quizInner);
    var fills = $$('.abar__fill', quizInner);
    if (reduce) {
      if (radar) radar.classList.add('is-drawn');
      fills.forEach(function (f) { f.style.width = f.getAttribute('data-w') + '%'; });
    } else {
      requestAnimationFrame(function () {
        setTimeout(function () {
          if (radar) radar.classList.add('is-drawn');
          fills.forEach(function (f, i) { setTimeout(function () { f.style.width = f.getAttribute('data-w') + '%'; }, i * 110); });
        }, 60);
      });
    }
    $('#quizRestart').addEventListener('click', function () {
      answers = []; safeSet(STORE_KEY, '[]'); idx = 0; renderQuestion();
    });
    $$('[data-close-quiz]', quizInner).forEach(function (b) {
      b.addEventListener('click', function () { setTimeout(closeQuiz, 60); });
    });
  }

  /* ======================================================================
     MINI-CALENDARIO DE RESERVA (en el CTA final)
     ====================================================================== */
  (function initBooking() {
    var root = $('#booking'); if (!root) return;
    var grid = $('#calGrid'), title = $('#calTitle'), prevB = $('#calPrev'), nextB = $('#calNext');
    var slotsList = $('#slotsList'), slotsLabel = $('#slotsLabel');
    var form = $('#bookingForm'), btn = $('#bookBtn'), body = $('#bookingBody');
    var nameI = $('#bkName'), mailI = $('#bkMail'), msgI = $('#bkMsg');
    if (!grid || !form) return;

    var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var SLOTS = ['10:00', '11:00', '12:00', '13:00', '16:00', '17:00', '18:00'];
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var view = new Date(today.getFullYear(), today.getMonth(), 1);
    var maxView = new Date(today.getFullYear(), today.getMonth() + 4, 1);   // reservas hasta 4 meses vista
    var selDate = null, selSlot = null;

    function ymd(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
    function longDate(d) {
      var dow = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'][d.getDay()];
      return dow + ' ' + d.getDate() + ' de ' + MONTHS[d.getMonth()];
    }
    function sync() {
      var ok = selDate && selSlot && nameI.value.trim() && /.+@.+\..+/.test(mailI.value);
      btn.disabled = !ok;
    }
    function renderCal() {
      title.textContent = MONTHS[view.getMonth()] + ' ' + view.getFullYear();
      prevB.disabled = (view.getFullYear() === today.getFullYear() && view.getMonth() <= today.getMonth());
      nextB.disabled = (view.getFullYear() === maxView.getFullYear() && view.getMonth() >= maxView.getMonth());
      grid.innerHTML = '';
      var lead = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;   // lunes = 0
      var days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
      var i, cell;
      for (i = 0; i < lead; i++) { cell = document.createElement('div'); cell.className = 'cal__day is-empty'; grid.appendChild(cell); }
      for (i = 1; i <= days; i++) {
        var d = new Date(view.getFullYear(), view.getMonth(), i);
        var off = d.getDay() === 0 || d.getDay() === 6 || d < today;
        cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'cal__day' + (selDate && ymd(selDate) === ymd(d) ? ' is-sel' : '');
        cell.textContent = i;
        if (off) cell.disabled = true;
        else cell.addEventListener('click', (function (dd) {
          return function () { selDate = dd; selSlot = null; renderCal(); renderSlots(); };
        })(d));
        grid.appendChild(cell);
      }
    }
    function renderSlots() {
      if (!selDate) { slotsLabel.textContent = 'Elige primero un día'; slotsList.innerHTML = ''; sync(); return; }
      slotsLabel.textContent = 'Horas para el ' + longDate(selDate) + ' · CET';
      slotsList.innerHTML = '';
      SLOTS.forEach(function (s) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot' + (selSlot === s ? ' is-sel' : '');
        b.textContent = s;
        b.addEventListener('click', function () { selSlot = s; renderSlots(); });
        slotsList.appendChild(b);
      });
      sync();
    }

    form.addEventListener('input', sync);
    prevB.addEventListener('click', function () { view.setMonth(view.getMonth() - 1); renderCal(); });
    nextB.addEventListener('click', function () { view.setMonth(view.getMonth() + 1); renderCal(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (btn.disabled) return;
      var when = longDate(selDate) + ' a las ' + selSlot;
      var vName = nameI.value.trim(), vMail = mailI.value.trim(), vMsg = msgI.value.trim();
      var url = (root.getAttribute('data-url') || '').trim();
      var mail = (root.getAttribute('data-email') || '').trim();

      body.innerHTML =
        '<div class="booking__done">' +
          '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>' +
          '<h4>Solicitud enviada</h4>' +
          '<p>Hemos anotado tu interés para el <b>' + when + '</b> (CET). ' +
          'Te confirmamos la cita por email en menos de 24 h.</p>' +
        '</div>';
      var k = root.querySelector('.booking__head .kicker'); if (k) k.textContent = 'Reserva recibida';
      var h = root.querySelector('.booking__hint'); if (h) h.textContent = '';

      if (url) {
        var u = url + (url.indexOf('?') > -1 ? '&' : '?') +
          'date=' + encodeURIComponent(ymd(selDate)) +
          '&name=' + encodeURIComponent(vName) + '&email=' + encodeURIComponent(vMail);
        window.open(u, '_blank', 'noopener');
      } else if (mail) {
        var body2 = ['Hola, quiero reservar una Sesión Estratégica.', '',
          'Cuándo: ' + when + ' (CET)', 'Nombre: ' + vName, 'Email: ' + vMail,
          'Qué quiero resolver: ' + (vMsg || '—')].join('\n');
        window.location.href = 'mailto:' + mail +
          '?subject=' + encodeURIComponent('Reserva Sesión Estratégica — ' + when) +
          '&body=' + encodeURIComponent(body2);
      }
    });

    renderCal();
    renderSlots();
  })();
})();
