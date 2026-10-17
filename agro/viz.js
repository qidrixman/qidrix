/*
 * Qidrix · Агро — анимированные визуализации решений (вместо фото).
 *
 * Изометрические «диорамы» в ракурсе пролётов Qidrix: поле-плитка с бортиками, техника, связь,
 * потоки данных. Чистый SVG без библиотек: лёгкий, чёткий на любом экране, следует теме сайта.
 * Анимация идёт только пока блок на экране; при «уменьшении движения» — статичный кадр.
 * Подписи — на языке страницы (ru · en · kk · uz), меняются вместе с ним.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var COS = Math.cos(Math.PI / 6);
  var SIN = 0.5;
  var S = 26; // пикселей на единицу поля
  var OX = 300; // центр сцены в viewBox 600 × 440
  var OY = 120;
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Подписи на 4 языках ────────────────────────────────────────────────
  var T = {
    sat: { ru: 'Спутник', en: 'Satellite', kk: 'Жерсерік', uz: 'Sunʼiy yoʻldosh' },
    bs: { ru: 'Базовая станция', en: 'Base station', kk: 'Базалық станция', uz: 'Baza stansiyasi' },
    hq: { ru: 'Диспетчерская', en: 'Control room', kk: 'Диспетчерлік', uz: 'Dispetcherlik' },
    combine: { ru: 'Комбайн', en: 'Combine', kk: 'Комбайн', uz: 'Kombayn' },
    drone: { ru: 'Дрон', en: 'Drone', kk: 'Дрон', uz: 'Dron' },
    online: { ru: 'на связи', en: 'online', kk: 'байланыста', uz: 'aloqada' },
    tractor: { ru: 'Трактор Т-150 · №12', en: 'Tractor T-150 · #12', kk: 'Т-150 тракторы · №12', uz: 'T-150 traktori · №12' },
    speed: { ru: 'Скорость', en: 'Speed', kk: 'Жылдамдық', uz: 'Tezlik' },
    fuel: { ru: 'Топливо', en: 'Fuel', kk: 'Отын', uz: 'Yoqilgʻi' },
    rpm: { ru: 'Обороты', en: 'Engine RPM', kk: 'Айналым', uz: 'Aylanish' },
    area: { ru: 'Обработано', en: 'Worked area', kk: 'Өңделді', uz: 'Ishlandi' },
    kmh: { ru: 'км/ч', en: 'km/h', kk: 'км/сағ', uz: 'km/soat' },
    ha: { ru: 'га', en: 'ha', kk: 'га', uz: 'ga' },
    rpmU: { ru: 'об/мин', en: 'rpm', kk: 'айн/мин', uz: 'ayl/daq' },
    zone: { ru: 'Геозона', en: 'Geofence', kk: 'Геоаймақ', uz: 'Geozona' },
    station: { ru: 'Заправка ГСМ', en: 'Fuel station', kk: 'ЖЖМ бекеті', uz: 'YoMM shoxobchasi' },
    dispense: { ru: 'Выдача', en: 'Dispensed', kk: 'Берілді', uz: 'Berildi' },
    left: { ru: 'Остаток', en: 'In tank', kk: 'Қалдық', uz: 'Qoldiq' },
    rfid: { ru: 'RFID-карта', en: 'RFID card', kk: 'RFID карта', uz: 'RFID karta' },
    l: { ru: 'л', en: 'L', kk: 'л', uz: 'l' },
    synced: { ru: 'в 1С', en: 'synced to ERP', kk: '1С-ке', uz: '1C ga' },
    scan: { ru: 'Облёт поля', en: 'Field survey', kk: 'Өрісті ұшып шолу', uz: 'Dalani aylanib uchish' },
    done: { ru: 'Обследовано', en: 'Surveyed', kk: 'Тексерілді', uz: 'Tekshirildi' },
    issues: { ru: 'Проблемных зон', en: 'Problem areas', kk: 'Мәселелі аймақтар', uz: 'Muammoli hududlar' },
    person: { ru: 'Человек', en: 'Person', kk: 'Адам', uz: 'Odam' },
    ndvi: { ru: 'NDVI: норма · стресс · потери', en: 'NDVI: healthy · stress · loss', kk: 'NDVI: қалыпты · стресс · шығын', uz: 'NDVI: meʼyor · stress · yoʻqotish' },
  };
  var lang = function () {
    var l = (document.documentElement.lang || 'ru').slice(0, 2);
    return T.sat[l] ? l : 'ru';
  };
  var tr = function (k) { return T[k][lang()] || T[k].ru; };
  var dec = function (n, d) { return n.toFixed(d).replace('.', lang() === 'en' ? '.' : ','); };

  // ─── Геометрия ──────────────────────────────────────────────────────────
  function P(x, y, z) {
    return [OX + (x - y) * COS * S, OY + (x + y) * SIN * S - (z || 0) * S];
  }
  function pts(list) {
    return list.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
  }
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) {
      var v = attrs[k];
      // CSS-переменные (цвета темы) работают только через style, не через атрибуты SVG.
      if (typeof v === 'string' && v.indexOf('var(') === 0) e.style.setProperty(k, v);
      else e.setAttribute(k, v);
    }
    if (parent) parent.appendChild(e);
    return e;
  }
  function poly(list, fill, parent, extra) {
    var a = { points: pts(list), fill: fill };
    for (var k in extra || {}) a[k] = extra[k];
    return el('polygon', a, parent);
  }
  function line(a, b, stroke, w, parent, extra) {
    var o = { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: stroke, 'stroke-width': w, 'stroke-linecap': 'round' };
    for (var k in extra || {}) o[k] = extra[k];
    return el('line', o, parent);
  }
  /** Короб: x, y — угол на земле, w × d — основание, h — высота, z — подъём. */
  function box(g, x, y, w, d, h, c, z) {
    z = z || 0;
    var grp = el('g', {}, g);
    poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], c.left, grp);
    poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], c.right, grp);
    poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], c.top, grp);
    return grp;
  }
  /** Эллипс на земле (кольцо сигнала) в изометрии. */
  function groundEllipse(cx, cy, r, z) {
    var c = P(cx, cy, z || 0);
    return { cx: c[0], cy: c[1], rx: r * S * COS * Math.SQRT2, ry: r * S * SIN * Math.SQRT2 };
  }

  var C = {
    soil: { top: '#5B6B3A', left: '#2A2F25', right: '#1E2126' },
    rowA: '#7E9A45',
    rowB: '#4F6330',
    lime: '#C2FF41',
    cyan: 'var(--accent-cyan)',
    amber: 'var(--accent-amber)',
    sky: '#38BDF8',
    red: '#EF4444',
    white: '#F2F3F1',
    steel: { top: '#C9CED6', left: '#7C838C', right: '#9AA0A8' },
    yellow: { top: '#FFD54A', left: '#B8860B', right: '#E0A800' },
    green: { top: '#8BC34A', left: '#4E6E28', right: '#668F35' },
    roof: { top: '#9AA0A8', left: '#5B6168', right: '#767C84' },
  };

  /** Поле-плитка с бортиками («диорама» как в пролётах) и рядами посевов. */
  function field(g, n, rows) {
    var skirt = 0.9;
    poly([P(0, n, 0), P(n, n, 0), P(n, n, -skirt), P(0, n, -skirt)], C.soil.left, g);
    poly([P(n, 0, 0), P(n, n, 0), P(n, n, -skirt), P(n, 0, -skirt)], C.soil.right, g);
    poly([P(0, 0, 0), P(n, 0, 0), P(n, n, 0), P(0, n, 0)], C.soil.top, g);
    if (rows) {
      for (var i = 0.5; i < n; i += 0.5) {
        line(P(i, 0.2, 0.02), P(i, n - 0.2, 0.02), (i * 2) % 2 ? C.rowA : C.rowB, 2.2, g, { opacity: 0.85 });
      }
    }
  }

  /** Подпись-«чип» в сцене (SVG, как метки в пролётах). */
  function chip(g, at, key, color) {
    var grp = el('g', { class: 'viz-chip' }, g);
    var t = el('text', { x: at[0] + 14, y: at[1] + 4, fill: '#F3F4F6', 'font-size': 12, 'font-family': 'Inter, sans-serif', 'font-weight': 600 }, grp);
    var r = el('rect', { x: at[0] - 4, y: at[1] - 11, rx: 11, height: 22, width: 60, fill: 'rgba(14,16,19,0.88)', stroke: color, 'stroke-width': 1.2 }, null);
    grp.insertBefore(r, t);
    el('circle', { cx: at[0] + 6, cy: at[1], r: 3.2, fill: color }, grp);
    var set = function () {
      t.textContent = tr(key);
      var w = t.getComputedTextLength ? t.getComputedTextLength() : t.textContent.length * 7;
      r.setAttribute('width', w + 26);
    };
    set();
    return set;
  }

  /** Карточка телеметрии поверх сцены (HTML, чтобы текст оставался чётким и доступным). */
  function card(host, title) {
    var c = document.createElement('div');
    c.className = 'viz-card';
    c.innerHTML = '<div class="viz-card__head"><i></i><span></span></div><dl></dl>';
    host.appendChild(c);
    return {
      el: c,
      set: function (head, rows) {
        c.querySelector('span').textContent = head;
        c.querySelector('dl').innerHTML = rows.map(function (r) {
          return '<div><dt>' + r[0] + '</dt><dd' + (r[2] ? ' class="' + r[2] + '"' : '') + '>' + r[1] + '</dd></div>';
        }).join('');
      },
    };
  }

  // Точка на ломаной по доле пути t ∈ [0, 1).
  function along(path, t) {
    var lens = [];
    var total = 0;
    for (var i = 1; i < path.length; i++) {
      var l = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
      lens.push(l);
      total += l;
    }
    var d = (((t % 1) + 1) % 1) * total;
    for (var j = 0; j < lens.length; j++) {
      if (d <= lens[j]) {
        var k = d / lens[j];
        var a = path[j];
        var b = path[j + 1];
        return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, dir: Math.atan2(b[1] - a[1], b[0] - a[0]), seg: j };
      }
      d -= lens[j];
    }
    var last = path[path.length - 1];
    return { x: last[0], y: last[1], dir: 0, seg: path.length - 2 };
  }

  /** Машинка (трактор / комбайн) — короб с кабиной; переставляется через transform. */
  function vehicle(g, colors, cab) {
    var grp = el('g', {}, g);
    // Колёса, корпус, кабина (в 1,5 раза крупнее масштаба поля — как техника в пролётах).
    box(grp, -0.6, -0.5, 0.3, 1.0, 0.3, { top: '#3A3F45', left: '#1E2126', right: '#2A2F35' }, 0);
    box(grp, 0.35, -0.5, 0.3, 1.0, 0.3, { top: '#3A3F45', left: '#1E2126', right: '#2A2F35' }, 0);
    box(grp, -0.7, -0.45, 1.4, 0.9, 0.5, colors, 0.18);
    box(grp, cab ? -0.55 : -0.1, -0.38, 0.62, 0.76, 0.6, { top: '#DDE6EE', left: '#66727E', right: '#8794A1' }, 0.68);
    el('circle', { cx: P(0, 0, 1.45)[0], cy: P(0, 0, 1.45)[1], r: 3.5, fill: C.lime, class: 'viz-blink' }, grp);
    return grp;
  }
  function moveTo(grp, x, y, z) {
    var o = P(0, 0, 0);
    var p = P(x, y, z || 0);
    grp.setAttribute('transform', 'translate(' + (p[0] - o[0]).toFixed(1) + ' ' + (p[1] - o[1]).toFixed(1) + ')');
  }

  /** Решётчатая мачта с секторами. */
  function tower(g, x, y, h) {
    var grp = el('g', {}, g);
    var b = 0.35;
    var top = 0.08;
    [[1, 1], [1, -1], [-1, -1], [-1, 1]].forEach(function (s) {
      line(P(x + s[0] * b, y + s[1] * b, 0), P(x + s[0] * top, y + s[1] * top, h), '#C9D1C7', 1.6, grp);
    });
    for (var k = 1; k < 6; k++) {
      var z = (h * k) / 6;
      var w = b - ((b - top) * k) / 6;
      poly([P(x - w, y - w, z), P(x + w, y - w, z), P(x + w, y + w, z), P(x - w, y + w, z)], 'none', grp, { stroke: '#AEB6AC', 'stroke-width': 1 });
    }
    [[0.25, 0], [0, 0.25], [-0.25, 0], [0, -0.25]].forEach(function (o) {
      box(grp, x + o[0] - 0.06, y + o[1] - 0.06, 0.12, 0.12, 0.35, { top: C.white, left: '#B7C0B4', right: C.lime }, h - 0.5);
    });
    return grp;
  }

  // ─── Сцены ──────────────────────────────────────────────────────────────

  var scenes = {
    /** 1 · Каналы связи: спутник, базовая станция, техника и дрон, диспетчерская. */
    network: function (svg, host) {
      var g = el('g', {}, svg);
      field(g, 12, true);
      var rings = el('g', {}, g);
      var ringEls = [0, 1, 2].map(function () { return el('ellipse', { fill: 'none', stroke: C.lime, 'stroke-width': 2 }, rings); });
      var hq = box(g, 9, 1, 2, 1.6, 1.1, C.roof);
      poly([P(9, 1, 1.1), P(11, 1, 1.1), P(11, 2.6, 1.1), P(9, 2.6, 1.1)], 'none', hq, { stroke: '#00E5FF', 'stroke-width': 2 });
      tower(g, 4, 4, 4.2);
      var combine = vehicle(g, C.yellow, true);
      var drone = el('g', {}, g);
      var d0 = P(0, 0, 0);
      [[-12, -6], [12, -6], [-12, 6], [12, 6]].forEach(function (o) { el('circle', { cx: d0[0] + o[0], cy: d0[1] + o[1], r: 6, fill: 'none', stroke: C.white, 'stroke-width': 1.4 }, drone); });
      el('rect', { x: d0[0] - 7, y: d0[1] - 4, width: 14, height: 8, rx: 2, fill: C.white }, drone);
      // Спутник в «небе» над полем.
      var sat = el('g', {}, svg);
      var sp = [78, 46];
      el('rect', { x: sp[0] - 30, y: sp[1] - 5, width: 22, height: 10, fill: '#38BDF8', opacity: 0.85 }, sat);
      el('rect', { x: sp[0] + 8, y: sp[1] - 5, width: 22, height: 10, fill: '#38BDF8', opacity: 0.85 }, sat);
      el('rect', { x: sp[0] - 7, y: sp[1] - 8, width: 14, height: 16, rx: 2, fill: C.white }, sat);
      var bsTop = P(4, 4, 4.2);
      var hqTop = P(10, 1.8, 1.4);
      var beam = line(sp, bsTop, C.sky, 1.6, svg, { 'stroke-dasharray': '5 6', opacity: 0.8 });
      var flows = el('g', {}, svg);
      var dots = [];
      for (var i = 0; i < 9; i++) dots.push(el('circle', { r: 3.2, fill: '#E9FFB8' }, flows));
      var labels = [
        chip(svg, [sp[0] + 38, sp[1]], 'sat', C.sky),
        chip(svg, [bsTop[0] + 14, bsTop[1] - 6], 'bs', C.lime),
        chip(svg, [hqTop[0] - 30, hqTop[1] - 34], 'hq', '#00E5FF'),
      ];
      var path = [[1.5, 9], [10.5, 9], [10.5, 10.5], [1.5, 10.5], [1.5, 9]];
      return {
        labels: labels,
        frame: function (t) {
          ringEls.forEach(function (r, k) {
            var ph = ((t / 2.6 + k / 3) % 1);
            var e = groundEllipse(4, 4, 0.6 + ph * 6, 0.05);
            r.setAttribute('cx', e.cx); r.setAttribute('cy', e.cy); r.setAttribute('rx', e.rx); r.setAttribute('ry', e.ry);
            r.setAttribute('opacity', (1 - ph) * 0.8);
          });
          var c = along(path, t / 40);
          moveTo(combine, c.x, c.y);
          var dx = 8 + Math.sin(t / 3) * 1.6;
          var dy = 6 + Math.cos(t / 3) * 1.6;
          var dz = 2.4 + Math.sin(t * 2) * 0.12;
          moveTo(drone, dx, dy, dz);
          var cTop = P(c.x, c.y, 1);
          var dTop = P(dx, dy, dz);
          var routes = [[cTop, bsTop], [dTop, bsTop], [bsTop, hqTop], [sp, bsTop]];
          dots.forEach(function (d, k) {
            var r = routes[k % routes.length];
            var ph = ((t * 0.5 + k / dots.length) % 1);
            d.setAttribute('cx', r[0][0] + (r[1][0] - r[0][0]) * ph);
            d.setAttribute('cy', r[0][1] + (r[1][1] - r[0][1]) * ph);
            d.setAttribute('opacity', Math.sin(ph * Math.PI));
          });
          beam.setAttribute('stroke-dashoffset', -t * 20);
        },
      };
    },

    /** 2 · Телеметрия: трактор работает челноком, за ним — след; карточка показаний. */
    tractor: function (svg, host) {
      var g = el('g', {}, svg);
      field(g, 12, true);
      // Геозона.
      poly([P(1, 1, 0.03), P(11, 1, 0.03), P(11, 11, 0.03), P(1, 11, 0.03)], 'none', g, { stroke: '#00E5FF', 'stroke-width': 1.6, 'stroke-dasharray': '6 6', opacity: 0.8 });
      var path = [];
      for (var i = 0; i < 9; i++) {
        var y = 1.6 + i * 1.1;
        if (i % 2 === 0) path.push([1.6, y], [10.4, y]);
        else path.push([10.4, y], [1.6, y]);
      }
      var trail = el('polyline', { fill: 'none', stroke: C.lime, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.55 }, g);
      var tractorG = vehicle(g, C.green, false);
      var zoneChip = chip(svg, [P(1, 11, 0)[0] - 10, P(1, 11, 0)[1] + 18], 'zone', '#00E5FF');
      var cardT = card(host);
      var total = 0;
      for (var j = 1; j < path.length; j++) total += Math.hypot(path[j][0] - path[j - 1][0], path[j][1] - path[j - 1][1]);
      var last = -1;
      return {
        labels: [zoneChip],
        frame: function (t) {
          var k = (t / 60) % 1;
          var p = along(path, k);
          moveTo(tractorG, p.x, p.y);
          var done = path.slice(0, p.seg + 1).concat([[p.x, p.y]]);
          trail.setAttribute('points', pts(done.map(function (q) { return P(q[0], q[1], 0.04); })));
          var sec = Math.floor(t);
          if (sec !== last) {
            last = sec;
            var turning = Math.abs(p.x - 1.6) < 0.4 || Math.abs(p.x - 10.4) < 0.4;
            var v = turning ? 6 + Math.random() * 2 : 11.5 + Math.random() * 1.5;
            cardT.set(tr('tractor'), [
              [tr('speed'), dec(v, 1) + ' ' + tr('kmh')],
              [tr('fuel'), Math.round(78 - k * 22) + ' %'],
              [tr('rpm'), Math.round(turning ? 1300 + Math.random() * 100 : 1820 + Math.random() * 80) + ' ' + tr('rpmU')],
              [tr('area'), dec(k * 4.8, 1) + ' ' + tr('ha'), 'is-ok'],
            ]);
          }
        },
      };
    },

    /** 3 · ГСМ: бак с уровнем, колонка, трактор заезжает на заправку, литры считаются. */
    fuel: function (svg, host) {
      var g = el('g', {}, svg);
      field(g, 12, false);
      // Площадка АЗС.
      poly([P(2, 2, 0.02), P(9, 2, 0.02), P(9, 7, 0.02), P(2, 7, 0.02)], '#4A4F55', g);
      // Бак-цилиндр (эллипсы + стенка).
      var tc = P(4, 4, 0);
      var rx = 1.6 * S * COS;
      var ry = 1.6 * S * SIN;
      var H = 3 * S;
      var tank = el('g', {}, g);
      el('path', { d: 'M' + (tc[0] - rx) + ' ' + tc[1] + ' A' + rx + ' ' + ry + ' 0 0 0 ' + (tc[0] + rx) + ' ' + tc[1] + ' L' + (tc[0] + rx) + ' ' + (tc[1] - H) + ' L' + (tc[0] - rx) + ' ' + (tc[1] - H) + ' Z', fill: '#AEB4BC' }, tank);
      var level = el('rect', { x: tc[0] - rx * 0.18, width: rx * 0.36, fill: 'var(--accent-amber)', opacity: 0.9 }, tank);
      el('rect', { x: tc[0] - rx * 0.18, y: tc[1] - H + 6, width: rx * 0.36, height: H - 10, fill: 'none', stroke: '#5B6168', 'stroke-width': 1.2 }, tank);
      el('ellipse', { cx: tc[0], cy: tc[1] - H, rx: rx, ry: ry, fill: '#D3D8DE' }, tank);
      // Колонка.
      box(g, 7, 4.2, 0.6, 0.6, 1.4, { top: C.white, left: '#8A939C', right: '#B7BFC7' });
      var screen = P(7.3, 4.2, 1.2);
      el('rect', { x: screen[0] - 7, y: screen[1] - 5, width: 14, height: 8, rx: 1.5, fill: '#00E5FF', opacity: 0.9 }, g);
      var hose = el('path', { fill: 'none', stroke: '#2B2F35', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
      var trk = vehicle(g, C.green, false);
      var drops = el('g', {}, g);
      var dropEls = [];
      for (var i = 0; i < 6; i++) dropEls.push(el('circle', { r: 2.6, fill: 'var(--accent-amber)' }, drops));
      var syncG = el('g', { opacity: 0 }, svg);
      var sp = [P(4, 4, 3.4)[0], P(4, 4, 3.4)[1] - 30];
      el('path', { d: 'M' + (sp[0] - 18) + ' ' + (sp[1] + 8) + ' a10 10 0 0 1 4 -18 a13 13 0 0 1 24 4 a8 8 0 0 1 2 14 z', fill: 'rgba(14,16,19,0.9)', stroke: '#00E5FF', 'stroke-width': 1.4 }, syncG);
      var syncT = el('text', { x: sp[0] + 26, y: sp[1] + 2, fill: '#00E5FF', 'font-size': 12, 'font-family': 'Fira Code, monospace' }, syncG);
      var station = chip(svg, [P(2, 7, 0)[0] - 40, P(2, 7, 0)[1] + 20], 'station', 'var(--accent-amber)');
      var cardF = card(host);
      var lastShown = '';
      return {
        labels: [station, function () { syncT.textContent = tr('synced'); }],
        frame: function (t) {
          // Цикл 16 с: подъезд 4 с, заправка 8 с, отъезд 4 с.
          var c = t % 16;
          var x;
          if (c < 4) x = 12.5 - (c / 4) * 4.4;
          else if (c < 12) x = 8.1;
          else x = 8.1 - ((c - 12) / 4) * 7.5;
          var y = c < 12 ? 5.4 : 5.4 + ((c - 12) / 4) * 4.5;
          moveTo(trk, x, y);
          var fueling = c >= 4.6 && c < 11.6;
          var pumped = Math.max(0, Math.min(1, (c - 4.6) / 7)) * 120;
          var tankL = 8200 - (Math.floor(t / 16) % 5) * 120 - pumped;
          var frac = tankL / 10000;
          level.setAttribute('y', tc[1] - 4 - (H - 10) * frac);
          level.setAttribute('height', (H - 10) * frac);
          var a = P(7.3, 4.8, 0.6);
          var b = P(x, y, 0.6);
          hose.setAttribute('d', fueling ? 'M' + a[0] + ' ' + a[1] + ' Q' + (a[0] + b[0]) / 2 + ' ' + (Math.max(a[1], b[1]) + 18) + ' ' + b[0] + ' ' + b[1] : '');
          dropEls.forEach(function (d, k) {
            var ph = (t * 1.4 + k / dropEls.length) % 1;
            d.setAttribute('opacity', fueling ? Math.sin(ph * Math.PI) : 0);
            d.setAttribute('cx', a[0] + (b[0] - a[0]) * ph);
            d.setAttribute('cy', a[1] + (b[1] - a[1]) * ph + Math.sin(ph * Math.PI) * 14);
          });
          syncG.setAttribute('opacity', c > 11.6 && c < 15 ? 1 : 0);
          var shown = Math.round(pumped) + '|' + Math.round(tankL / 10) + '|' + lang();
          if (shown !== lastShown) {
            lastShown = shown;
            cardF.set(tr('station'), [
              [tr('rfid'), lang() === 'en' ? 'T-150 · #12' : lang() === 'uz' ? 'T-150 · №12' : 'Т-150 · №12'],
              [tr('dispense'), Math.round(pumped) + ' ' + tr('l'), fueling ? 'is-ok' : ''],
              [tr('left'), Math.round(tankL).toLocaleString('ru-RU') + ' ' + tr('l')],
            ]);
          }
        },
      };
    },

    /** 4 · БПЛА: дрон облетает поле, клетки окрашиваются по NDVI, детекция человека. */
    drone: function (svg, host) {
      var g = el('g', {}, svg);
      field(g, 12, false);
      var N = 8;
      var cell = 10 / N;
      var cells = [];
      var seedVal = function (i, j) { var s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453; return s - Math.floor(s); };
      for (var j = 0; j < N; j++)
        for (var i = 0; i < N; i++) {
          var x0 = 1 + i * cell;
          var y0 = 1 + j * cell;
          var v = seedVal(i, j);
          var col = v > 0.86 ? '#EF4444' : v > 0.68 ? '#FACC15' : '#22C55E';
          cells.push({ i: i, j: j, x: x0 + cell / 2, y: y0 + cell / 2, bad: v > 0.86, warn: v > 0.68, el: poly([P(x0 + 0.04, y0 + 0.04, 0.03), P(x0 + cell - 0.04, y0 + 0.04, 0.03), P(x0 + cell - 0.04, y0 + cell - 0.04, 0.03), P(x0 + 0.04, y0 + cell - 0.04, 0.03)], col, g, { opacity: 0.08 }) });
        }
      var path = [];
      for (var r = 0; r < N; r++) {
        var yy = 1 + r * cell + cell / 2;
        if (r % 2 === 0) path.push([1 + cell / 2, yy], [11 - cell / 2, yy]);
        else path.push([11 - cell / 2, yy], [1 + cell / 2, yy]);
      }
      var cone = el('polygon', { fill: '#00E5FF', opacity: 0.16 }, g);
      var drone = el('g', {}, g);
      var d0 = P(0, 0, 0);
      [[-13, -6.5], [13, -6.5], [-13, 6.5], [13, 6.5]].forEach(function (o) { el('circle', { cx: d0[0] + o[0], cy: d0[1] + o[1], r: 6.5, fill: 'none', stroke: C.white, 'stroke-width': 1.5 }, drone); });
      el('rect', { x: d0[0] - 8, y: d0[1] - 4.5, width: 16, height: 9, rx: 2, fill: C.white }, drone);
      // Детекция: человек на краю поля.
      var person = P(10.6, 3.2, 0);
      var det = el('g', { opacity: 0 }, svg);
      el('rect', { x: person[0] - 9, y: person[1] - 26, width: 18, height: 28, fill: 'none', stroke: C.red, 'stroke-width': 2 }, det);
      var detT = el('text', { x: person[0] + 14, y: person[1] - 14, fill: '#FFB4AB', 'font-size': 12, 'font-family': 'Inter, sans-serif', 'font-weight': 600 }, det);
      el('line', { x1: person[0], y1: person[1] - 2, x2: person[0], y2: person[1] - 14, stroke: '#E5E7EB', 'stroke-width': 3, 'stroke-linecap': 'round' }, svg);
      el('circle', { cx: person[0], cy: person[1] - 18, r: 3.2, fill: '#E5E7EB' }, svg);
      var legend = chip(svg, [P(1, 11, 0)[0] - 30, P(1, 11, 0)[1] + 20], 'ndvi', '#22C55E');
      var cardD = card(host);
      var lastPct = -1;
      return {
        labels: [legend, function () { detT.textContent = tr('person') + ' · 92 %'; lastPct = -1; }],
        frame: function (t) {
          var k = (t / 48) % 1;
          var p = along(path, k);
          moveTo(drone, p.x, p.y, 3 + Math.sin(t * 2.2) * 0.1);
          var a = P(p.x - 0.7, p.y - 0.7, 0.05);
          var b = P(p.x + 0.7, p.y - 0.7, 0.05);
          var c = P(p.x + 0.7, p.y + 0.7, 0.05);
          var d = P(p.x - 0.7, p.y + 0.7, 0.05);
          var top = P(p.x, p.y, 2.9);
          cone.setAttribute('points', pts([top, a, b, c, d, a]));
          var row = Math.floor(k * N);
          var scanned = 0;
          var issues = 0;
          cells.forEach(function (q) {
            var seen = q.j < row || (q.j === row && (row % 2 === 0 ? q.x <= p.x : q.x >= p.x));
            q.el.setAttribute('opacity', seen ? 0.62 : 0.08);
            if (seen) { scanned++; if (q.bad || q.warn) issues++; }
          });
          det.setAttribute('opacity', p.x > 9.4 && p.y > 2 && p.y < 4.6 ? 1 : 0);
          var pct = Math.round((scanned / cells.length) * 100);
          if (pct !== lastPct) {
            lastPct = pct;
            cardD.set(tr('scan'), [
              [tr('done'), pct + ' %', 'is-ok'],
              [tr('issues'), String(issues), issues ? 'is-warn' : ''],
            ]);
          }
        },
      };
    },
  };

  // ─── Запуск: только видимые сцены, пауза вне экрана ────────────────────
  function mount(host) {
    var kind = host.getAttribute('data-viz');
    if (!scenes[kind]) return;
    var svg = el('svg', { viewBox: '0 0 600 440', preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true', focusable: 'false' }, null);
    host.appendChild(svg);
    var scene = scenes[kind](svg, host);
    var running = false;
    var raf = 0;
    var t0 = performance.now() - Math.random() * 4000;
    var tick = function (now) {
      scene.frame((now - t0) / 1000);
      raf = running ? requestAnimationFrame(tick) : 0;
    };
    var relabel = function () { scene.labels.forEach(function (f) { f(); }); scene.frame((performance.now() - t0) / 1000); };
    relabel();
    new MutationObserver(relabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    if (REDUCED || !('IntersectionObserver' in window)) {
      scene.frame(12.5);
      return;
    }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        running = e.isIntersecting;
        if (running && !raf) raf = requestAnimationFrame(tick);
      });
    }, { rootMargin: '120px' }).observe(host);
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-viz]'), mount);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
