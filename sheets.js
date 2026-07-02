(function () {
  'use strict';

  var SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFzmlbt8FOoIInbHaOq6kI3RtVz9ch69heHBURGUFk-LmxjK2kNn3B6VYv5q6Sb6GDqaFB_Om6Kfdp/pub?output=csv';
  var WA_NUMBER = '55XXXXXXXXXXX';

  // ─── Injetar estilos ────────────────────────────────────────────────────────
  var style = document.createElement('style');
  style.textContent = [
    '.card__media img{width:100%;aspect-ratio:4/3.5;object-fit:cover;border-radius:8px;display:block;}',
    '.card--sk .card__media{background:var(--nude);border-radius:8px;aspect-ratio:4/3.5;}',
    '.card--sk .card__name,.card--sk .card__dims,.card--sk p{background:var(--nude);border-radius:4px;color:transparent;min-height:1em;}',
    '.card--sk .btn{background:var(--nude);color:transparent;border-color:transparent;pointer-events:none;}',
    '.card--sk .card__price{border-top-color:transparent;}',
    '.card--sk .val{background:var(--nude);border-radius:4px;color:transparent;display:inline-block;min-width:80px;}',
    // ── Slider ──
    '.card__slider{position:relative;overflow:hidden;border-radius:8px;}',
    '.card__slides{display:flex;transition:transform .35s cubic-bezier(.4,0,.2,1);will-change:transform;}',
    '.card__slide{flex:0 0 100%;width:100%;}',
    '.card__slide img{width:100%;aspect-ratio:4/3.5;object-fit:cover;display:block;border-radius:0;}',
    '.slider__btn{position:absolute;top:50%;transform:translateY(-50%);background:rgba(42,35,28,.6);border:none;color:#faf5ec;width:30px;height:30px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;transition:background .2s;padding:0;line-height:1;}',
    '.slider__btn:hover{background:rgba(42,35,28,.9);}',
    '.slider__btn--prev{left:8px;}',
    '.slider__btn--next{right:8px;}',
    '.slider__dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:2;}',
    '.slider__dot{width:6px;height:6px;border-radius:50%;background:rgba(250,245,236,.45);border:none;cursor:pointer;padding:0;transition:background .25s,transform .25s;}',
    '.slider__dot.active{background:#faf5ec;transform:scale(1.3);}',
    // ── Badge "Valor especial" ──
    '.card__media{position:relative;}',
    '.card__badge{position:absolute;top:10px;left:10px;background:#B8631A;color:#FAF5EC;font-size:10.5px;font-weight:700;letter-spacing:.09em;padding:5px 11px;border-radius:4px;z-index:5;text-transform:uppercase;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.28);}'
  ].join('');
  document.head.appendChild(style);

  // ─── CSV Parser (lida com aspas e vírgulas dentro de campos) ────────────────
  function parseRow(line) {
    var fields = [];
    var cur = '';
    var inQ = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else { inQ = !inQ; }
      } else if (ch === ',' && !inQ) {
        fields.push(cur); cur = '';
      } else {
        cur += ch;
      }
    }
    fields.push(cur);
    return fields;
  }

  function parseCSV(text) {
    var lines = text.split(/\r?\n/);
    if (lines.length < 2) return [];
    var headers = parseRow(lines[0]).map(function (h) {
      return h.trim().toLowerCase().replace(/\s+/g, '_');
    });
    var rows = [];
    for (var i = 1; i < lines.length; i++) {
      var vals = parseRow(lines[i]);
      var row = {};
      var hasData = false;
      headers.forEach(function (h, idx) {
        row[h] = (vals[idx] || '').trim();
        if (row[h]) hasData = true;
      });
      if (hasData) rows.push(row);
    }
    return rows;
  }

  // ─── Google Drive URL → URL de imagem direta ────────────────────────────────
  function imgUrl(raw) {
    if (!raw) return '';
    var m = raw.match(/\/d\/([^/?]+)/);
    if (m) return 'https://lh3.googleusercontent.com/d/' + m[1] + '=w600';
    if (/^https?:\/\//.test(raw)) return raw;
    return './assets/img/' + raw;
  }

  // ─── Coletar todas as imagens de um item ────────────────────────────────────
  // Lê colunas foto_id, foto_id_2, foto_id_3 … (ou foto/imagem com os mesmos sufixos)
  function getImages(item) {
    var urls = [];
    var suffixes = ['', '_2', '_3', '_4', '_5'];
    suffixes.forEach(function (s) {
      var raw = item['foto_id' + s] || item['foto' + s] || item['imagem' + s] || '';
      var u = imgUrl(raw);
      if (u) urls.push(u);
    });
    return urls;
  }

  // ─── Exibir valor BRL conforme digitado na planilha ─────────────────────────
  function formatBRL(raw) {
    if (!raw) return '';
    var s = String(raw).replace(/\s*\([^)]*\)/g, '').trim();
    if (!s) return '';
    if (!/^R\$/.test(s)) s = 'R$ ' + s;
    return s;
  }

  // ─── Construir slider com múltiplas imagens ─────────────────────────────────
  function buildSlider(urls, altBase) {
    var slider = document.createElement('div');
    slider.className = 'card__slider';

    var track = document.createElement('div');
    track.className = 'card__slides';

    urls.forEach(function (url, i) {
      var slide = document.createElement('div');
      slide.className = 'card__slide';
      var img = document.createElement('img');
      img.src = url;
      img.alt = (altBase || 'Tapeçaria') + (urls.length > 1 ? ' — foto ' + (i + 1) : '');
      img.setAttribute('loading', 'eager');
      slide.appendChild(img);
      track.appendChild(slide);
    });

    slider.appendChild(track);

    var current = 0;

    // Botões de navegação
    var btnPrev = document.createElement('button');
    btnPrev.className = 'slider__btn slider__btn--prev';
    btnPrev.setAttribute('aria-label', 'Foto anterior');
    btnPrev.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';

    var btnNext = document.createElement('button');
    btnNext.className = 'slider__btn slider__btn--next';
    btnNext.setAttribute('aria-label', 'Próxima foto');
    btnNext.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';

    // Dots indicadores
    var dotsEl = document.createElement('div');
    dotsEl.className = 'slider__dots';
    var dots = [];
    urls.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'slider__dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Foto ' + (i + 1));
      dots.push(dot);
      dotsEl.appendChild(dot);
    });

    function goTo(idx) {
      current = (idx + urls.length) % urls.length;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }

    btnPrev.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goTo(current - 1); });
    btnNext.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goTo(current + 1); });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); goTo(i); });
    });

    // Suporte a swipe (touch)
    var touchStartX = 0;
    slider.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) goTo(diff > 0 ? current + 1 : current - 1);
    }, { passive: true });

    slider.appendChild(btnPrev);
    slider.appendChild(btnNext);
    slider.appendChild(dotsEl);

    return slider;
  }

  // ─── Construir elemento <article class="card"> ──────────────────────────────
  function buildCard(item, index) {
    var article = document.createElement('article');
    article.className = 'card reveal';
    article.setAttribute('data-d', String(index + 1));

    // — Área de mídia —
    var media = document.createElement('div');
    media.className = 'card__media';

    var urls = getImages(item);

    if (urls.length > 1) {
      // Carrossel com múltiplas fotos
      media.appendChild(buildSlider(urls, item.nome));
    } else if (urls.length === 1) {
      // Imagem única
      var img = document.createElement('img');
      img.setAttribute('src', urls[0]);
      img.setAttribute('alt', item.nome || 'Tapeçaria');
      img.setAttribute('loading', 'lazy');
      media.appendChild(img);
    } else {
      // Placeholder quando não há imagem
      var ph = document.createElement('div');
      ph.className = 'ph';
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'ph__icon');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '1.4');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      var rect = document.createElementNS(ns, 'rect');
      ['x','y','width','height','rx'].forEach(function (a, i) {
        rect.setAttribute(a, ['3','3','18','18','2'][i]);
      });
      var circ = document.createElementNS(ns, 'circle');
      ['cx','cy','r'].forEach(function (a, i) {
        circ.setAttribute(a, ['8.5','8.5','1.5'][i]);
      });
      var path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M21 15l-5-5L5 21');
      svg.appendChild(rect); svg.appendChild(circ); svg.appendChild(path);
      var lbl = document.createElement('span');
      lbl.className = 'ph__label';
      lbl.textContent = 'foto da peça';
      ph.appendChild(svg); ph.appendChild(lbl);
      media.appendChild(ph);
    }

    // — Badge "Valor especial" —
    if ((item.valor_especial || '').toLowerCase().trim() === 'sim') {
      var badge = document.createElement('span');
      badge.className = 'card__badge';
      badge.textContent = 'Valor especial';
      media.appendChild(badge);
    }

    article.appendChild(media);

    // — Corpo —
    var body = document.createElement('div');
    body.className = 'card__body';

    var h3 = document.createElement('h3');
    h3.className = 'card__name';
    h3.textContent = item.nome || '';
    body.appendChild(h3);

    if (item.dimensoes) {
      var dims = document.createElement('p');
      dims.className = 'card__dims';
      dims.textContent = item.dimensoes;
      body.appendChild(dims);
    }

    // — Preços —
    var priceDiv = document.createElement('div');
    priceDiv.className = 'card__price';

    if (item.preco_pix) {
      var pix = document.createElement('div');
      pix.className = 'price__pix';
      var pl = document.createElement('span'); pl.className = 'label'; pl.textContent = 'No Pix';
      var pv = document.createElement('span'); pv.className = 'val'; pv.textContent = formatBRL(item.preco_pix);
      var pn = document.createElement('span'); pn.className = 'note'; pn.textContent = (item.nota_pix || '10% de desconto').replace(/ de R\$/g, ' por R$');
      pix.appendChild(pl); pix.appendChild(pv); pix.appendChild(pn);
      priceDiv.appendChild(pix);
    }

    if (item.preco_cartao) {
      var card = document.createElement('div');
      card.className = 'price__card';
      var cl = document.createElement('span'); cl.className = 'label'; cl.textContent = 'No cartão';
      var rawCard = item.preco_cartao;
      var parenM = rawCard.match(/\(([^)]+)\)/);
      var priceOnly = rawCard.replace(/\s*\([^)]*\)/g, '').trim();
      var cv = document.createElement('span'); cv.className = 'val'; cv.textContent = formatBRL(priceOnly);
      var cn = document.createElement('span'); cn.className = 'note';
      cn.textContent = (parenM ? parenM[1] : (item.nota_cartao || 'em até 3x sem juros')).replace(/ de R\$/g, ' por R$');
      card.appendChild(cl); card.appendChild(cv); card.appendChild(cn);
      priceDiv.appendChild(card);
    }

    body.appendChild(priceDiv);

    // — Botão WhatsApp —
    var waText = 'Olá Jéssica! Tenho interesse na peça ' + (item.nome || '');
    var waDefault = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(waText);
    var waHref = (item.whatsapp_link && /^https?:\/\//i.test(item.whatsapp_link)) ? item.whatsapp_link : waDefault;
    var btn = document.createElement('a');
    btn.className = 'btn btn--solid';
    btn.setAttribute('href', waHref);
    btn.setAttribute('target', '_blank');
    btn.setAttribute('rel', 'noopener');
    btn.textContent = 'Tenho interesse';
    body.appendChild(btn);

    article.appendChild(body);
    return article;
  }

  // ─── Skeleton loader ────────────────────────────────────────────────────────
  function showLoading(grid) {
    grid.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      var sk = document.createElement('article');
      sk.className = 'card card--sk';
      var skMedia = document.createElement('div'); skMedia.className = 'card__media';
      var skBody = document.createElement('div'); skBody.className = 'card__body';
      var skName = document.createElement('h3'); skName.className = 'card__name'; skName.textContent = '            ';
      var skDim = document.createElement('p'); skDim.className = 'card__dims'; skDim.textContent = '      ';
      var skPrice = document.createElement('div'); skPrice.className = 'card__price';
      var skPix = document.createElement('div'); skPix.className = 'price__pix';
      var skVal = document.createElement('span'); skVal.className = 'val'; skVal.textContent = '        ';
      skPix.appendChild(skVal); skPrice.appendChild(skPix);
      var skBtn = document.createElement('a'); skBtn.className = 'btn btn--solid'; skBtn.textContent = ' ';
      skBody.appendChild(skName); skBody.appendChild(skDim);
      skBody.appendChild(skPrice); skBody.appendChild(skBtn);
      sk.appendChild(skMedia); sk.appendChild(skBody);
      grid.appendChild(sk);
    }
  }

  // ─── Estado vazio ───────────────────────────────────────────────────────────
  function showEmpty(grid) {
    grid.innerHTML = '';
    var msg = document.createElement('p');
    msg.setAttribute('style', 'text-align:center;color:var(--text-soft);padding:3rem 1rem;grid-column:1/-1;font-size:1.1rem;');
    msg.textContent = 'Nenhuma peça disponível no momento. Em breve novas tapeçarias!';
    grid.appendChild(msg);
  }

  // ─── Estado de erro (com fallback) ─────────────────────────────────────────
  function showError(grid, fallback) {
    if (fallback && fallback.trim()) {
      grid.innerHTML = fallback;
      observeCards(grid.querySelectorAll('.reveal'));
    } else {
      grid.innerHTML = '';
      var msg = document.createElement('p');
      msg.setAttribute('style', 'text-align:center;color:var(--text-soft);padding:3rem 1rem;grid-column:1/-1;font-size:1.05rem;');
      msg.textContent = 'Não foi possível carregar as peças. Tente novamente em instantes.';
      grid.appendChild(msg);
    }
  }

  // ─── Reveal / IntersectionObserver ─────────────────────────────────────────
  function observeCards(nodes) {
    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    nodes.forEach(function (el) { io.observe(el); });
  }

  // ─── Fetch CSV ──────────────────────────────────────────────────────────────
  async function fetchTapeçarias() {
    var res = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var text = await res.text();
    return parseCSV(text);
  }

  // ─── Filtro e ordenação ─────────────────────────────────────────────────────
  var DISPONIVEL_TRUE = ['sim', 'yes', 'true', 'disponível', 'disponivel', '1'];

  function isAvailable(row) {
    return DISPONIVEL_TRUE.indexOf((row.disponivel || '').toLowerCase().trim()) !== -1;
  }

  // ─── Ponto de entrada ───────────────────────────────────────────────────────
  async function init() {
    var grid = document.querySelector('.pieces__grid');
    if (!grid) return;

    var fallback = grid.innerHTML;
    showLoading(grid);

    try {
      var items = await fetchTapeçarias();

      var available = items
        .filter(isAvailable)
        .sort(function (a, b) {
          return (parseInt(a.ordem, 10) || 0) - (parseInt(b.ordem, 10) || 0);
        });

      if (available.length === 0) {
        showEmpty(grid);
      } else {
        grid.innerHTML = '';
        available.forEach(function (item, i) {
          grid.appendChild(buildCard(item, i));
        });
        observeCards(grid.querySelectorAll('.reveal'));
      }
    } catch (err) {
      console.error('Erro ao carregar tapeçarias:', err);
      showError(grid, fallback);
    }
  }

  // ─── Selo de site seguro ────────────────────────────────────────────────────
  function injectSiteSeguro() {
    if (document.getElementById('jp-site-seguro')) return;
    var footer = document.querySelector('footer');
    if (!footer) return;

    var badge = document.createElement('div');
    badge.id = 'jp-site-seguro';
    badge.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;padding:16px 0 0;margin-top:20px;border-top:1px solid rgba(34,30,26,.10);';

    var svg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
    badge.innerHTML = '<span style="display:inline-flex;align-items:center;gap:7px;font-size:11.5px;letter-spacing:.06em;color:#7A6E63;">' + svg + 'Site Seguro</span>';

    var container = footer.firstElementChild || footer;
    container.appendChild(badge);
  }

  function waitForFooter(tries) {
    var footer = document.querySelector('footer');
    if (footer && footer.firstElementChild) {
      injectSiteSeguro();
    } else if ((tries || 0) < 40) {
      setTimeout(function() { waitForFooter((tries || 0) + 1); }, 250);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { init(); waitForFooter(); });
  } else {
    init();
    waitForFooter();
  }
})();
