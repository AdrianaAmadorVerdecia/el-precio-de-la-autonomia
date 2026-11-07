(function () {
  'use strict';

  if (typeof DATOS === 'undefined') {
    var app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<p class="note">No se pudieron cargar los datos del estudio.</p>';
    }
    return;
  }

  var TIPOS = Object.keys(DATOS.tipos);
  var COLOR = {
    'Moto electrica': 'var(--moto)',
    'Bicicleta electrica': 'var(--bici)',
    'Patinete electrico': 'var(--patinete)'
  };
  var BASE_SVG = 'viewBox="0 0 64 64" width="34" height="34" fill="none" stroke="currentColor" ' +
    'stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICONOS = {
    'Moto electrica': '<svg ' + BASE_SVG + '>' +
      '<circle cx="15" cy="47" r="8"/><circle cx="49" cy="47" r="8"/>' +
      '<path d="M23 47l7-11h12l5 11"/><path d="M26 32h12"/>' +
      '<path d="M42 36l4-12h7"/><path d="M46 24l4 12"/>' +
      '<path d="M30 36l-4-4"/><circle cx="34" cy="42" r="2.5"/>' +
      '</svg>',
    'Bicicleta electrica': '<svg ' + BASE_SVG + '>' +
      '<circle cx="15" cy="47" r="8"/><circle cx="49" cy="47" r="8"/>' +
      '<path d="M15 47l12-18h16l6 18"/><path d="M27 29l8 18 8-18"/>' +
      '<path d="M27 29l-4-6h7"/><path d="M43 29l6-8h7"/>' +
      '<circle cx="35" cy="47" r="3"/>' +
      '</svg>',
    'Patinete electrico': '<svg ' + BASE_SVG + '>' +
      '<circle cx="16" cy="48" r="7"/><circle cx="48" cy="48" r="7"/>' +
      '<path d="M23 48h18l3-6H20z"/><path d="M44 42l4-22h8"/>' +
      '<path d="M46 20h9"/>' +
      '</svg>'
  };
  var CLAVE = 'epda_perfil_v1';
  var PASOS = Array.prototype.slice.call(document.querySelectorAll('.step'));

  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function money(n) {
    return '$' + new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(Math.round(Number(n) || 0));
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function starsHTML(valor) {
    var num = Number(valor) || 0;
    var pct = clamp(num / 5 * 100, 0, 100);
    return '<span class="stars" role="img" aria-label="' + num.toFixed(1) +
      ' de 5 estrellas"><span class="stars-bg" aria-hidden="true">★★★★★</span>' +
      '<span class="stars-fill" aria-hidden="true" style="width:' + pct + '%">★★★★★</span></span>';
  }
  function aniosTexto(n) { return n + (n === 1 ? ' año' : ' años'); }

  var estado = {
    paso: 1,
    presupuesto: 1500,
    kmDia: 20,
    prioridad: 'equilibrio',
    anios: 3,
    tipo: null,
    revelado: false,
    voz: 0
  };
  var textoResultado = '';

  try {
    var guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    if (guardado && typeof guardado === 'object') {
      if (guardado.presupuesto != null) estado.presupuesto = clamp(Number(guardado.presupuesto) || 1500, 100, 7000);
      if (guardado.kmDia != null) estado.kmDia = clamp(Number(guardado.kmDia) || 20, 2, 120);
      if (guardado.anios != null) estado.anios = clamp(Number(guardado.anios) || 0, 0, 10);
      if (['precio', 'autonomia', 'equilibrio'].indexOf(guardado.prioridad) >= 0) estado.prioridad = guardado.prioridad;
      if (TIPOS.indexOf(guardado.tipo) >= 0) estado.tipo = guardado.tipo;
    }
  } catch (e) { /* sin perfil guardado */ }

  function guardarPerfil() {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({
        presupuesto: estado.presupuesto,
        kmDia: estado.kmDia,
        anios: estado.anios,
        prioridad: estado.prioridad,
        tipo: estado.tipo
      }));
    } catch (e) { /* almacenamiento no disponible */ }
  }

  var presupuesto = $('#presupuesto');
  var kmDia = $('#kmDia');
  var aniosUso = $('#aniosUso');
  var prioridad = $('#prioridad');

  function pintarRange(el) {
    var min = Number(el.min) || 0;
    var max = Number(el.max) || 100;
    var valor = Number(el.value) || 0;
    var pct = max > min ? (valor - min) / (max - min) * 100 : 0;
    el.style.setProperty('--pct', pct.toFixed(1) + '%');
  }

  function actualizarSalidas() {
    $('#presupuestoOut').textContent = money(estado.presupuesto);
    $('#kmDiaOut').textContent = estado.kmDia + ' km';
    $('#aniosOut').textContent = aniosTexto(estado.anios);
    [presupuesto, kmDia, aniosUso].forEach(pintarRange);
  }

  function rellenarDatos() {
    var r = DATOS.resumen || {};
    var valores = {
      productos_observados: r.productos_observados || r.productos,
      productos: r.productos,
      encuestas: r.encuestas,
      tipos: Object.keys(DATOS.tipos).length
    };
    $$('[data-stat]').forEach(function (el) {
      var clave = el.getAttribute('data-stat');
      if (valores[clave] != null) el.textContent = valores[clave];
    });
  }

  function textoPrioridad() {
    if (estado.prioridad === 'precio') return 'gastar menos';
    if (estado.prioridad === 'autonomia') return 'llegar más lejos';
    return 'equilibrio entre precio y autonomía';
  }

  function renderPerfil() {
    document.getElementById('perfilResumen').textContent =
      money(estado.presupuesto) + ' · ' + estado.kmDia + ' km/día · ' +
      aniosTexto(estado.anios) + ' · Prioridad: ' + textoPrioridad() + '.';
  }

  function actualizarHint() {
    var hint = $('#tipoHint');
    if (!estado.tipo) {
      hint.textContent = 'Toca una tarjeta para elegir.';
    } else {
      hint.textContent = 'Elegiste ' + DATOS.tipos[estado.tipo].etiqueta + '.';
    }
  }

  function renderTipos() {
    var grid = $('#typeGrid');
    grid.innerHTML = TIPOS.map(function (tipo) {
      var t = DATOS.tipos[tipo];
      var n = DATOS.productos.filter(function (p) {
        return p.tipo === tipo && p.precio <= estado.presupuesto;
      }).length;
      var sel = estado.tipo === tipo;
      var badge = n
        ? n + (n === 1 ? ' opción dentro de tu presupuesto' : ' opciones dentro de tu presupuesto')
        : 'Ninguna opción con tu presupuesto';
      return '<button type="button" class="type-card" data-tipo="' + esc(tipo) + '" aria-pressed="' + sel + '">' +
        '<span class="type-head">' +
        '<span class="type-icon" style="--c:' + COLOR[tipo] + '">' + ICONOS[tipo] + '</span>' +
        '<span class="type-title">' + esc(t.etiqueta) + '</span>' +
        '</span>' +
        '<span class="stars-row">' + starsHTML(t.estrellas) +
        '<span class="star-value">' + Number(t.estrellas).toFixed(1) + '</span>' +
        '<span class="star-caption">' + t.personas + ' dueños</span></span>' +
        '<span class="type-stats">' +
        '<span class="stat-line"><span class="k">Precio típico</span><span class="v">' +
        (t.precio_prom ? money(t.precio_prom) : '—') + '</span></span>' +
        '<span class="stat-line"><span class="k">Autonomía actual</span><span class="v">' +
        t.actual_real + ' km</span></span>' +
        '</span>' +
        '<span class="badge' + (n ? '' : ' zero') + '">' + badge + '</span>' +
        '</button>';
    }).join('');
  }

  function seleccionarTipo(tipo) {
    estado.tipo = estado.tipo === tipo ? null : tipo;
    guardarPerfil();
    $$('#typeGrid .type-card').forEach(function (c) {
      c.setAttribute('aria-pressed', String(c.dataset.tipo === estado.tipo));
    });
    actualizarHint();
  }

  function renderTrampa() {
    var grid = $('#trampaGrid');
    var max = 0;
    TIPOS.forEach(function (tipo) {
      var t = DATOS.tipos[tipo];
      max = Math.max(max, t.internet_prom || 0, t.mercado_prom || 0, t.nueva_real || 0);
    });
    max = max * 1.06 || 1;
    function ancho(v) { return ((Number(v) || 0) / max * 100).toFixed(1); }

    grid.innerHTML = TIPOS.map(function (tipo) {
      var t = DATOS.tipos[tipo];
      var delta = (t.nueva_real || 0) - (t.internet_prom || 0);
      var direccion = delta >= 0 ? 'más' : 'menos';
      var realAncho = estado.revelado ? ancho(t.nueva_real) : 0;
      var realValor = estado.revelado ? t.nueva_real + ' km' : '?';
      var detalle = estado.revelado
        ? 'Los dueños reportan <strong>' + Math.abs(delta) + ' km ' + direccion +
          '</strong> que el promedio anunciado en Internet.'
        : 'La barra de los dueños está oculta. Toca el botón para verla.';
      return '<article class="trampa-card">' +
        '<h3><span class="type-dot" style="--c:' + COLOR[tipo] + '"></span>' + esc(t.etiqueta) + '</h3>' +
        '<div class="bar-row"><span class="bar-label">Internet</span><div class="bar-track">' +
        '<div class="bar-fill bar-internet" style="width:' + ancho(t.internet_prom) + '%"></div></div>' +
        '<span class="bar-value">' + t.internet_prom + ' km</span></div>' +
        '<div class="bar-row"><span class="bar-label">Dueños</span><div class="bar-track">' +
        '<div class="bar-fill bar-real" style="width:' + realAncho + '%"></div></div>' +
        '<span class="bar-value">' + realValor + '</span></div>' +
        '<p class="trampa-mercado">Mercado informal: <strong>' + t.mercado_prom + ' km</strong></p>' +
        '<p class="trampa-delta">' + detalle + '</p>' +
        '</article>';
    }).join('');

    var nota = document.getElementById('trampaNota');
    if (nota) {
      nota.hidden = !estado.revelado;
      nota.textContent = estado.revelado
        ? 'Diferencia entre el promedio publicado y la autonomía que reportan los dueños. ' +
          'En los tres tipos, lo reportado está por debajo del anuncio. En la bicicleta la ' +
          'brecha es mínima; en la moto y el patinete es amplia.'
        : '';
    }
  }

  function actualizarBotonRevelar() {
    var b = $('#revelarReal');
    if (!b) return;
    if (estado.revelado) {
      b.textContent = 'Realidad revelada';
      b.disabled = true;
      b.classList.remove('btn-accent');
      b.classList.add('btn-ghost');
    } else {
      b.textContent = 'Revelar la autonomía real';
      b.disabled = false;
      b.classList.add('btn-accent');
      b.classList.remove('btn-ghost');
    }
  }

  function renderTiempo() {
    var grid = $('#tiempoGrid');
    grid.innerHTML = TIPOS.map(function (tipo) {
      var t = DATOS.tipos[tipo];
      var restante = clamp(100 - t.perdida_anual * estado.anios, 0, 100);
      var proyectada = Math.round(t.nueva_real * restante / 100);
      var color = restante < 40 ? 'var(--red)' : restante < 70 ? 'var(--purple)' : 'var(--green)';
      var cantidad = proyectada < 1 ? '&lt; 1 km' : '≈ ' + proyectada + ' km';
      var alerta = '';
      if (t.personas < 5) {
        alerta = '<p class="tiempo-nota alerta">Muestra pequeña (' + t.personas +
          ' dueños): interpreta con cautela.</p>';
      } else if (estado.anios > Math.ceil(t.anios_prom * 2)) {
        alerta = '<p class="tiempo-nota alerta">Vas más allá del doble del tiempo observado (' +
          t.anios_prom + ' años): es una extrapolación.</p>';
      }
      return '<article class="tiempo-row">' +
        '<span class="type-dot" style="--c:' + COLOR[tipo] + '"></span>' +
        '<div><h3>' + esc(t.etiqueta) + '</h3>' +
        '<p class="tiempo-nota">de ' + t.nueva_real + ' km nuevos · quedaría ' +
        Math.round(restante) + '% · -' + t.perdida_anual + '%/año</p>' +
        alerta + '</div>' +
        '<strong class="tiempo-big" style="color:' + color + '">' + cantidad + '</strong>' +
        '</article>';
    }).join('');
  }

  function renderVoces() {
    var lista = DATOS.testimonios;
    var card = $('#vozCard');
    var dots = $('#vozDots');
    if (!lista.length) {
      card.innerHTML = '<p>No hay testimonios disponibles.</p>';
      dots.innerHTML = '';
      return;
    }
    estado.voz = clamp(estado.voz, 0, lista.length - 1);
    var t = lista[estado.voz];
    var clase = { Buena: 'buena', Regular: 'regular', Mala: 'mala' }[t.calidad] || '';
    card.innerHTML =
      '<p class="voz-quote">“' + esc(t.opinion) + '”</p>' +
      '<div class="voz-meta">' +
      starsHTML(t.estrellas) +
      '<span class="star-value">' + Number(t.estrellas).toFixed(1) + '</span>' +
      '<span class="voz-tag ' + clase + '">' + esc(t.calidad || 'Sin categoría') + '</span>' +
      '<span>' + esc(t.etiqueta) + (t.marca ? ' · ' + esc(t.marca) : '') + '</span>' +
      (t.anios != null ? '<span>' + t.anios + ' años de uso</span>' : '') +
      (t.perdida != null ? '<span>' + t.perdida + '% de pérdida</span>' : '') +
      '</div>';
    var visible = 5;
    var inicio = lista.length <= visible ? 0 :
      Math.max(0, Math.min(estado.voz - 2, lista.length - visible));
    var fin = Math.min(lista.length, inicio + visible);
    var html = '';
    for (var i = inicio; i < fin; i++) {
      html += '<button type="button" role="tab" aria-label="Testimonio ' + (i + 1) +
        '" aria-selected="' + (i === estado.voz) + '" data-voz="' + i + '"></button>';
    }
    dots.innerHTML = html;
  }

  function moverVoz(delta) {
    var total = DATOS.testimonios.length;
    if (!total) return;
    estado.voz = (estado.voz + delta + total) % total;
    renderVoces();
  }

  function calcular() {
    var lista = [];
    TIPOS.forEach(function (tipo) {
      var t = DATOS.tipos[tipo];
      var opciones = DATOS.productos.filter(function (p) {
        return p.tipo === tipo && p.precio <= estado.presupuesto;
      });
      if (!opciones.length) return;
      var tope = t.nueva_real * 1.2;
      var conProyeccion = opciones.map(function (p) {
        var copia = {};
        for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) copia[k] = p[k];
        copia.realista = Math.min(p.autonomia, tope);
        copia.usd_km_real = copia.realista > 0 ? p.precio / copia.realista : Infinity;
        copia.proyectada = Math.max(0, copia.realista * (1 - (t.perdida_anual / 100) * estado.anios));
        return copia;
      });
      var cumplen = conProyeccion.filter(function (p) { return p.proyectada >= estado.kmDia; });
      var pool = cumplen.length ? cumplen : conProyeccion;
      var elegido;
      if (estado.prioridad === 'precio') {
        elegido = pool.slice().sort(function (a, b) {
          return a.precio - b.precio || b.proyectada - a.proyectada;
        })[0];
      } else if (estado.prioridad === 'autonomia') {
        elegido = pool.slice().sort(function (a, b) {
          return b.proyectada - a.proyectada || a.precio - b.precio;
        })[0];
      } else {
        elegido = pool.slice().sort(function (a, b) {
          return a.usd_km_real - b.usd_km_real || b.proyectada - a.proyectada;
        })[0];
      }
      lista.push({ tipo: tipo, t: t, elegido: elegido, cumple: cumplen.length > 0, opciones: opciones.length });
    });
    lista.sort(function (a, b) {
      var pendiente = Number(!a.cumple) - Number(!b.cumple);
      if (pendiente) return pendiente;
      if (estado.prioridad === 'precio') return a.elegido.precio - b.elegido.precio;
      if (estado.prioridad === 'autonomia') return b.elegido.proyectada - a.elegido.proyectada;
      return a.elegido.usd_km_real - b.elegido.usd_km_real || b.elegido.proyectada - a.elegido.proyectada;
    });
    return lista;
  }

  function renderResultado() {
    var cont = $('#resultado');
    var alts = $('#alternativas');
    var altDetalle = $('#alternativasDetalle');
    var lista = calcular();
    if (!lista.length) {
      textoResultado = '';
      cont.innerHTML = '<div class="result-empty">' +
        '<h3>Con ' + money(estado.presupuesto) + ' no hay opciones en los datos</h3>' +
        '<p>Sube el presupuesto o baja los requisitos. El precio más bajo del estudio es ' +
        money(Math.min.apply(null, DATOS.productos.map(function (p) { return p.precio; }))) + '.</p>' +
        '<button type="button" class="btn btn-primary" data-go="2">Volver a ajustar</button>' +
        '</div>';
      if (alts) alts.innerHTML = '';
      if (altDetalle) altDetalle.hidden = true;
      return;
    }

    var mejor = lista[0];
    var t = mejor.t;
    var e = mejor.elegido;
    var proy = Math.round(e.proyectada);
    var años = aniosTexto(estado.anios);
    var cantidadProy = e.proyectada < 1 ? '&lt; 1 km' : '≈ ' + proy + ' km';

    var notaEleccion = '';
    if (estado.tipo && estado.tipo !== mejor.tipo) {
      notaEleccion = '<p class="result-note">Elegiste ' + esc(DATOS.tipos[estado.tipo].etiqueta) +
        '. Con tus datos, ' + esc(t.etiqueta) + ' encaja mejor, pero puedes comparar abajo.</p>';
    }
    var cautela = t.personas < 5
      ? '<p class="result-note">Muestra pequeña: solo ' + t.personas +
        ' dueños de este tipo. Tómalo como una señal, no como un pronóstico.</p>'
      : '';

    cont.innerHTML =
      '<div class="result-hero">' +
      '<p class="result-badge">Tu mejor opción</p>' +
      '<h3>' + esc(t.etiqueta) + '</h3>' +
      '<div class="result-stars">' + starsHTML(t.estrellas) +
      '<span>' + Number(t.estrellas).toFixed(1) + ' de 5 · ' + t.personas + ' dueños</span></div>' +
      '<p class="result-lead">Con ' + money(estado.presupuesto) + ' y ' +
      estado.kmDia + ' km/día, esta opción encaja con tu prioridad: ' +
      textoPrioridad() + '.</p>' +
      '<div class="result-metrics">' +
      '<div><span>Precio</span><strong>' + money(e.precio) + '</strong></div>' +
      '<div><span>Anunciada</span><strong>' + e.autonomia + ' km</strong></div>' +
      '<div><span>En ' + años + '</span><strong>' + cantidadProy + '</strong></div>' +
      '<div><span>USD/km</span><strong>' + Number(e.usd_km_real).toFixed(1) + '</strong></div>' +
      '</div>' +
      '<p class="' + (mejor.cumple ? 'ok' : 'warn') + '">' +
      (mejor.cumple
        ? 'Cubre tus ' + estado.kmDia + ' km diarios incluso después de ' + años + '.'
        : 'No alcanza a cubrir tus ' + estado.kmDia + ' km diarios después de ' + años +
          '; es lo que más se acerca.') +
      '</p>' +
      '<p class="result-note">Modelo: ' + esc(e.marca) + ' · ' + esc(e.sitio) +
      ' (' + esc(e.fuente) + '). Autonomía ajustada: ' + Math.round(e.realista) +
      ' km, con un tope conservador para no premiar anuncios inflados.</p>' +
      notaEleccion +
      cautela +
      '</div>';

    if (alts) {
      alts.innerHTML = lista.slice(1).map(function (o) {
        return '<article class="alternativa">' +
          '<h4>' + esc(o.t.etiqueta) + '</h4>' +
          '<div class="mini"><span>Estrellas</span><strong>' + starsHTML(o.t.estrellas) + ' ' +
          Number(o.t.estrellas).toFixed(1) + '</strong></div>' +
          '<div class="mini"><span>Precio</span><strong>' + money(o.elegido.precio) + '</strong></div>' +
          '<div class="mini"><span>En ' + años + '</span><strong>' +
          (o.elegido.proyectada < 1 ? '&lt; 1 km' : '≈ ' + Math.round(o.elegido.proyectada) + ' km') +
          '</strong></div>' +
          '<div class="mini"><span>USD por km ajustado</span><strong>' +
          Number(o.elegido.usd_km_real).toFixed(1) + '</strong></div>' +
          '</article>';
      }).join('') +
        '<p class="note">El cálculo usa los precios publicados, una autonomía ajustada (como ' +
        'máximo un 20 % por encima de lo que reportan los dueños del mismo tipo) y la pérdida ' +
        'anual promedio. Es una orientación, no una garantía: revisa siempre el estado real de ' +
        'la batería.</p>';
    }
    if (altDetalle) altDetalle.hidden = lista.length < 2;

    textoResultado = [
      'El precio de la autonomía — mi resultado',
      'Presupuesto: ' + money(estado.presupuesto),
      'Km al día: ' + estado.kmDia,
      'Años de uso: ' + años,
      'Prioridad: ' + textoPrioridad(),
      'Recomendación: ' + t.etiqueta,
      'Modelo: ' + e.marca + ' (' + e.sitio + ', ' + e.fuente + ')',
      'Precio: ' + money(e.precio) + ' · Autonomía anunciada: ' + e.autonomia +
        ' km · Autonomía ajustada: ' + Math.round(e.realista) + ' km · En ' + años +
        ': ≈ ' + proy + ' km · USD por km ajustado: ' + Number(e.usd_km_real).toFixed(1),
      mejor.cumple
        ? 'Cubre tus ' + estado.kmDia + ' km diarios después de ' + años + '.'
        : 'No alcanza a cubrir tus ' + estado.kmDia + ' km diarios después de ' + años + '.',
      t.personas < 5 ? 'Aviso: muestra pequeña (' + t.personas + ' dueños).' : '',
      'Fuente: ' + DATOS.fuente
    ].filter(Boolean).join('\n');
  }

  function actualizarTopNext(n) {
    var b = $('#topNext');
    if (!b) return;
    b.hidden = n === PASOS.length;
    if (n === 1) {
      b.textContent = 'Empezar';
      b.setAttribute('data-lucy', '');
      b.removeAttribute('data-next');
    } else {
      b.textContent = 'Siguiente';
      b.removeAttribute('data-lucy');
      b.setAttribute('data-next', '');
    }
  }

  function goTo(n, enfocar) {
    n = clamp(n, 1, PASOS.length);
    estado.paso = n;
    PASOS.forEach(function (s) {
      s.hidden = Number(s.dataset.step) !== n;
    });
    $('#progressFill').style.width = (n / PASOS.length * 100) + '%';
    $('#progressLabel').textContent = 'Escena ' + n + ' de ' + PASOS.length;
    actualizarTopNext(n);

    if (n === 2) actualizarHint();
    if (n === 3) {
      renderTrampa();
      actualizarBotonRevelar();
      renderTiempo();
      renderVoces();
    }
    if (n === 4) {
      renderResultado();
      if (typeof window.actualizarCopia === 'function') window.actualizarCopia();
      if (typeof window.actualizarFeedback === 'function') window.actualizarFeedback();
    }

    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });

    if (enfocar !== false) {
      var titulo = PASOS[n - 1].querySelector('h1, h2');
      if (titulo) setTimeout(function () { titulo.focus({ preventScroll: true }); }, 320);
    }
  }

  function reiniciar() {
    estado.paso = 1;
    estado.presupuesto = 1500;
    estado.kmDia = 20;
    estado.prioridad = 'equilibrio';
    estado.anios = 3;
    estado.tipo = null;
    estado.revelado = false;
    estado.voz = 0;
    presupuesto.value = 1500;
    kmDia.value = 20;
    aniosUso.value = 3;
    prioridad.value = 'equilibrio';
    actualizarSalidas();
    guardarPerfil();
    renderPerfil();
    renderTipos();
    actualizarHint();
    renderTrampa();
    actualizarBotonRevelar();
    renderTiempo();
    renderVoces();
    goTo(1);
  }

  function copiarResultado() {
    if (!textoResultado) return;
    var boton = $('#copiarResultado');
    var original = boton.textContent;
    function listo() {
      boton.textContent = 'Copiado';
      setTimeout(function () { boton.textContent = original; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textoResultado).then(listo).catch(function () { respaldo(); });
    } else {
      respaldo();
    }
    function respaldo() {
      var area = document.createElement('textarea');
      area.value = textoResultado;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      try { document.execCommand('copy'); listo(); } catch (e) { /* sin portapapeles */ }
      area.remove();
    }
  }

  presupuesto.addEventListener('input', function () {
    estado.presupuesto = clamp(Number(presupuesto.value) || 100, 100, 7000);
    actualizarSalidas();
    renderPerfil();
    renderTipos();
    guardarPerfil();
  });

  kmDia.addEventListener('input', function () {
    estado.kmDia = clamp(Number(kmDia.value) || 2, 2, 120);
    actualizarSalidas();
    renderPerfil();
    guardarPerfil();
  });

  aniosUso.addEventListener('input', function () {
    estado.anios = clamp(Number(aniosUso.value) || 0, 0, 10);
    actualizarSalidas();
    renderPerfil();
    renderTiempo();
    guardarPerfil();
  });

  prioridad.addEventListener('change', function () {
    estado.prioridad = prioridad.value;
    renderPerfil();
    renderTipos();
    guardarPerfil();
  });

  $('#typeGrid').addEventListener('click', function (e) {
    var card = e.target.closest('.type-card');
    if (card) seleccionarTipo(card.dataset.tipo);
  });

  $('#revelarReal').addEventListener('click', function () {
    estado.revelado = true;
    renderTrampa();
    actualizarBotonRevelar();
  });

  $('#prevVoz').addEventListener('click', function () { moverVoz(-1); });
  $('#nextVoz').addEventListener('click', function () { moverVoz(1); });

  $('#vozDots').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-voz]');
    if (!b) return;
    estado.voz = Number(b.dataset.voz);
    renderVoces();
  });

  document.addEventListener('click', function (e) {
    var lucy = e.target.closest('[data-lucy]');
    if (lucy) {
      e.preventDefault();
      estado.presupuesto = 1500;
      estado.kmDia = 20;
      estado.prioridad = 'precio';
      estado.anios = 3;
      estado.tipo = null;
      presupuesto.value = 1500;
      kmDia.value = 20;
      aniosUso.value = 3;
      prioridad.value = 'precio';
      actualizarSalidas();
      renderPerfil();
      renderTipos();
      guardarPerfil();
      goTo(2);
      return;
    }
    var ir = e.target.closest('[data-go]');
    if (ir) { e.preventDefault(); goTo(Number(ir.dataset.go)); return; }
    var siguiente = e.target.closest('[data-next]');
    if (siguiente) { e.preventDefault(); goTo(estado.paso + 1); return; }
    var atras = e.target.closest('[data-prev]');
    if (atras) { e.preventDefault(); goTo(estado.paso - 1); }
  });

  var reiniciarBtn = $('#reiniciar');
  if (reiniciarBtn) reiniciarBtn.addEventListener('click', reiniciar);
  var reiniciarFinal = $('#reiniciarFinal');
  if (reiniciarFinal) reiniciarFinal.addEventListener('click', reiniciar);
  var copiarBtn = $('#copiarResultado');
  if (copiarBtn) copiarBtn.addEventListener('click', copiarResultado);

  presupuesto.value = estado.presupuesto;
  kmDia.value = estado.kmDia;
  aniosUso.value = estado.anios;
  prioridad.value = estado.prioridad;

  actualizarSalidas();
  rellenarDatos();
  renderPerfil();
  renderTipos();
  actualizarHint();
  renderTrampa();
  actualizarBotonRevelar();
  renderTiempo();
  renderVoces();
  goTo(1, false);
})();
