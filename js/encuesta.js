(function () {
  'use strict';

  var CLAVE = 'epda_encuestas_v2';
  var botones = Array.prototype.slice.call(document.querySelectorAll('#estrellasInput button'));
  var formulario = document.getElementById('encuestaForm');
  var estadoEstrellas = 0;

  function $(sel) { return document.querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function calidadDe(n) {
    if (n <= 2) return 'Mala';
    if (n === 3) return 'Regular';
    return 'Buena';
  }

  function setEstrellas(n) {
    estadoEstrellas = n;
    botones.forEach(function (b) {
      var valor = Number(b.dataset.val);
      b.classList.toggle('activa', valor <= n);
      b.setAttribute('aria-checked', valor === n ? 'true' : 'false');
      b.tabIndex = (n === 0 ? valor === 1 : valor === n) ? 0 : -1;
    });
    var texto = document.getElementById('estrellasTexto');
    texto.textContent = n ? n + ' de 5 · ' + calidadDe(n) : 'Sin calificar';
  }

  botones.forEach(function (b) {
    b.addEventListener('click', function () { setEstrellas(Number(b.dataset.val)); });
  });

  document.getElementById('estrellasInput').addEventListener('keydown', function (e) {
    var teclas = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (teclas.indexOf(e.key) < 0) return;
    e.preventDefault();
    var actual = botones.indexOf(document.activeElement);
    if (actual < 0) actual = estadoEstrellas > 0 ? estadoEstrellas - 1 : 0;
    var destino = actual;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') destino = Math.min(botones.length - 1, actual + 1);
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') destino = Math.max(0, actual - 1);
    if (e.key === 'Home') destino = 0;
    if (e.key === 'End') destino = botones.length - 1;
    botones[destino].focus();
    setEstrellas(destino + 1);
  });

  function leer() {
    try {
      var bruto = localStorage.getItem(CLAVE);
      var datos = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(datos) ? datos : [];
    } catch (e) {
      return [];
    }
  }

  function guardar(lista) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(lista));
      return true;
    } catch (e) {
      return false;
    }
  }

  function renderCopia() {
    var lista = leer();
    var contador = document.getElementById('copiaCount');
    if (contador) contador.textContent = String(lista.length);
    var botonJSON = document.getElementById('descargarJSON');
    var botonCSV = document.getElementById('descargarCSV');
    if (botonJSON) botonJSON.disabled = !lista.length;
    if (botonCSV) botonCSV.disabled = !lista.length;

    var contenedor = document.getElementById('copiaLista');
    if (!contenedor) return;
    if (!lista.length) {
      contenedor.innerHTML = '<p class="copia-vacia">Todavía no hay respuestas guardadas en este navegador.</p>';
      return;
    }
    var filas = lista.slice(-6).reverse().map(function (e) {
      var fecha = '';
      try {
        fecha = new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      } catch (err) { fecha = '—'; }
      return '<tr>' +
        '<td>' + esc(e.id) + '</td>' +
        '<td>' + esc(e.tipo_vehiculo) + '</td>' +
        '<td>' + esc(e.marca) + '</td>' +
        '<td>' + esc(e.estrellas) + '/5</td>' +
        '<td>' + esc(e.calidad) + '</td>' +
        '<td>' + esc(fecha) + '</td>' +
        '</tr>';
    }).join('');
    contenedor.innerHTML = '<table><thead><tr>' +
      '<th>ID</th><th>Tipo</th><th>Marca</th><th>Estrellas</th><th>Calidad</th><th>Fecha</th>' +
      '</tr></thead><tbody>' + filas + '</tbody></table>' +
      (lista.length > 6 ? '<p class="copia-vacia">Mostrando las 6 más recientes.</p>' : '');
  }

  function descargar(nombre, contenido, tipoMime) {
    var blob = new Blob([contenido], { type: tipoMime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }

  function fechaArchivo() {
    var d = new Date();
    function dos(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + dos(d.getMonth() + 1) + '-' + dos(d.getDate());
  }

  function descargarJSON() {
    var lista = leer();
    if (!lista.length) return;
    descargar('encuestas-autonomia-' + fechaArchivo() + '.json',
      JSON.stringify(lista, null, 2), 'application/json;charset=utf-8');
  }

  function descargarCSV() {
    var lista = leer();
    if (!lista.length) return;
    var columnas = ['id', 'fecha', 'tipo_vehiculo', 'marca', 'anios_uso', 'precio_usd',
      'autonomia_nueva_km', 'autonomia_actual_km', 'calidad', 'estrellas', 'opinion'];
    function celda(v) {
      return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
    }
    var lineas = [columnas.map(celda).join(',')];
    lista.forEach(function (e) {
      lineas.push(columnas.map(function (c) { return celda(e[c]); }).join(','));
    });
    descargar('encuestas-autonomia-' + fechaArchivo() + '.csv',
      '\ufeff' + lineas.join('\r\n'), 'text/csv;charset=utf-8');
  }

  function mostrarEstado(mensaje, tipo) {
    var estado = document.getElementById('formStatus');
    estado.textContent = mensaje;
    estado.className = 'form-status ' + (tipo || '');
  }

  function ga(evento, parametros) {
    try {
      window.dataLayer = window.dataLayer || [];
      var datos = { event: evento };
      if (parametros) {
        for (var k in parametros) {
          if (Object.prototype.hasOwnProperty.call(parametros, k)) datos[k] = parametros[k];
        }
      }
      window.dataLayer.push(datos);
    } catch (e) { /* analítica opcional */ }
  }

  formulario.addEventListener('submit', function (e) {
    e.preventDefault();

    var tipo = document.getElementById('encTipo').value;
    var marca = document.getElementById('encMarca').value.trim();
    var anios = Number(document.getElementById('encAnios').value);
    var precio = Number(document.getElementById('encPrecio').value);
    var nueva = Number(document.getElementById('encNueva').value);
    var actual = Number(document.getElementById('encActual').value);
    var opinion = document.getElementById('encOpinion').value.trim();

    var errores = [];
    if (!tipo) errores.push([document.getElementById('encTipo'), 'Elige un tipo de vehículo.']);
    if (!marca) errores.push([document.getElementById('encMarca'), 'Escribe la marca.']);
    if (!Number.isFinite(nueva) || nueva <= 0) errores.push([document.getElementById('encNueva'), 'La autonomía nueva debe ser mayor que 0.']);
    if (!Number.isFinite(actual) || actual < 0) errores.push([document.getElementById('encActual'), 'La autonomía actual no puede ser negativa.']);
    if (Number.isFinite(nueva) && Number.isFinite(actual) && actual > nueva) {
      errores.push([document.getElementById('encActual'), 'La autonomía actual no puede superar la nueva.']);
    }
    if (!estadoEstrellas) errores.push([botones[0], 'Pon tu calificación en estrellas.']);

    if (errores.length) {
      mostrarEstado(errores[0][1], 'error');
      errores[0][0].focus();
      return;
    }

    var lista = leer();
    var entrada = {
      id: 'P' + String(lista.length + 1).padStart(3, '0') + '-' + Date.now().toString(36).slice(-4).toUpperCase(),
      fecha: new Date().toISOString(),
      tipo_vehiculo: tipo,
      marca: marca,
      anios_uso: Number.isFinite(anios) ? Math.max(0, Math.min(40, anios)) : 0,
      precio_usd: Number.isFinite(precio) ? Math.max(0, precio) : 0,
      autonomia_nueva_km: nueva,
      autonomia_actual_km: actual,
      calidad: calidadDe(estadoEstrellas),
      estrellas: estadoEstrellas,
      opinion: opinion
    };
    lista.push(entrada);

    if (!guardar(lista)) {
      mostrarEstado('No se pudo guardar en este navegador. Revisa el almacenamiento o descarga el archivo manualmente.', 'error');
      return;
    }

    mostrarEstado('Guardado. Calificación: ' + estadoEstrellas + '/5 (' + entrada.calidad +
      '). Descarga una copia para conservarla.', 'ok');
    ga('encuesta_enviada', {
      tipo_vehiculo: entrada.tipo_vehiculo,
      calidad: entrada.calidad,
      estrellas: entrada.estrellas
    });

    formulario.reset();
    document.getElementById('encAnios').value = '1';
    document.getElementById('encPrecio').value = '1000';
    document.getElementById('encNueva').value = '50';
    document.getElementById('encActual').value = '40';
    setEstrellas(0);
    renderCopia();
  });

  var FB_CLAVE = 'epda_feedback_historia_v1';
  var fbBotones = Array.prototype.slice.call(document.querySelectorAll('#feedbackEstrellas button'));
  var fbValor = 0;

  function leerFeedback() {
    try {
      var n = Number(localStorage.getItem(FB_CLAVE) || 0);
      return n >= 1 && n <= 5 ? n : 0;
    } catch (e) { return 0; }
  }

  function guardarFeedback(n) {
    try {
      localStorage.setItem(FB_CLAVE, String(n));
      return true;
    } catch (e) { return false; }
  }

  function fbCalidad(n) {
    if (n <= 2) return 'Mala';
    if (n === 3) return 'Regular';
    return 'Buena';
  }

  function pintarFeedback(n) {
    fbValor = n;
    fbBotones.forEach(function (b) {
      var valor = Number(b.dataset.val);
      b.classList.toggle('activa', valor <= n);
      b.setAttribute('aria-checked', valor === n ? 'true' : 'false');
      b.tabIndex = (n === 0 ? valor === 1 : valor === n) ? 0 : -1;
    });
    var texto = document.getElementById('feedbackTexto');
    if (texto) texto.textContent = n ? n + ' de 5 · ' + fbCalidad(n) : 'Sin calificar';
  }

  function actualizarFeedback() {
    pintarFeedback(leerFeedback());
  }

  fbBotones.forEach(function (b) {
    b.addEventListener('click', function () {
      var n = Number(b.dataset.val);
      pintarFeedback(n);
      var guardado = guardarFeedback(n);
      var status = document.getElementById('feedbackStatus');
      if (status) {
        status.textContent = guardado
          ? 'Gracias. Tu valoración quedó guardada en este navegador.'
          : 'No se pudo guardar la valoración en este navegador.';
        status.className = 'form-status ' + (guardado ? 'ok' : 'error');
      }
      ga('feedback_historia', { valoracion: n, calidad: fbCalidad(n), guardado: guardado });
    });
  });

  var fbContenedor = document.getElementById('feedbackEstrellas');
  if (fbContenedor) {
    fbContenedor.addEventListener('keydown', function (e) {
      var teclas = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
      if (teclas.indexOf(e.key) < 0) return;
      e.preventDefault();
      var actual = fbBotones.indexOf(document.activeElement);
      if (actual < 0) actual = fbValor > 0 ? fbValor - 1 : 0;
      var destino = actual;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') destino = Math.min(fbBotones.length - 1, actual + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') destino = Math.max(0, actual - 1);
      if (e.key === 'Home') destino = 0;
      if (e.key === 'End') destino = fbBotones.length - 1;
      fbBotones[destino].focus();
      pintarFeedback(destino + 1);
    });
  }

  document.getElementById('descargarJSON').addEventListener('click', descargarJSON);
  document.getElementById('descargarCSV').addEventListener('click', descargarCSV);
  window.addEventListener('storage', function (e) {
    if (e.key === CLAVE) renderCopia();
  });

  window.actualizarCopia = renderCopia;
  window.actualizarFeedback = actualizarFeedback;
  renderCopia();
  setEstrellas(0);
  actualizarFeedback();
})();
