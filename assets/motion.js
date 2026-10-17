/*
 * Qidrix · движение на сайте (общий файл для всех страниц).
 * Появление блоков, прогресс чтения, бегунок меню, посадка на раздел, плотная шапка,
 * подсветка карточек, параллакс. При «уменьшении движения» включается только самое
 * необходимое (прогресс, бегунок), без анимаций.
 */
(function () {
    'use strict';
    var root = document.documentElement;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced && 'IntersectionObserver' in window) root.classList.add('motion');

    function ready(fn) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
        else fn();
    }

    ready(function () {
        var header = document.querySelector('header');

        // «Уменьшить движение»: фоновые видео стоят на кадре-заставке.
        if (reduced) document.querySelectorAll('video[autoplay]').forEach(function (v) { v.removeAttribute('autoplay'); v.pause(); });

        // ─── Появление при прокрутке ───────────────────────────────────────
        if (root.classList.contains('motion')) {
            var groups = [
                ['section:not(#case-hero):not(#slide-1) .mono', ''],
                ['section:not(#case-hero):not(#slide-1) h2', ''],
                ['section:not(#case-hero):not(#slide-1) > p, .text-content > p, .case-text > p, .step-right-cell p', ''],
                ['.card, .arch-step, .feature-item, .overview-facts li, .contact-card', ''],
                ['.image-wrapper, .images-row, .images-group', 'reveal--zoom'],
                ['.tech-animation-container', 'reveal--zoom'],
            ];
            var seen = new Set();
            var items = [];
            groups.forEach(function (g) {
                document.querySelectorAll(g[0]).forEach(function (el) {
                    if (seen.has(el) || el.closest('.reveal') || el.closest('header, footer, .side-panel')) return;
                    seen.add(el);
                    el.classList.add('reveal');
                    if (g[1]) el.classList.add(g[1]);
                    items.push(el);
                });
            });
            // Соседи в одной сетке появляются по очереди.
            items.forEach(function (el) {
                var parent = el.parentElement;
                var sibs = Array.prototype.filter.call(parent.children, function (c) { return c.classList.contains('reveal'); });
                var i = sibs.indexOf(el);
                if (i > 0) el.style.setProperty('--reveal-delay', Math.min(i, 6) * 90 + 'ms');
            });
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    var el = e.target;
                    el.classList.add('is-in');
                    io.unobserve(el);
                    // После появления снимаем служебные классы: работают обычные hover-эффекты.
                    var done = function () {
                        el.classList.remove('reveal', 'is-in', 'reveal--zoom', 'reveal--side');
                        el.style.removeProperty('--reveal-delay');
                    };
                    var ms = 1000 + (parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0);
                    setTimeout(done, ms);
                });
            }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
            items.forEach(function (el) { io.observe(el); });
        }

        // ─── Прогресс чтения, плотная шапка, параллакс ─────────────────────
        var bar = null;
        if (header) {
            bar = document.createElement('div');
            bar.className = 'scroll-progress';
            bar.setAttribute('aria-hidden', 'true');
            header.appendChild(bar);
        }
        var heroBg = document.querySelector('.hero-bg-video');
        var ticking = false;
        function onScroll() {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () {
                ticking = false;
                var max = document.documentElement.scrollHeight - window.innerHeight;
                var p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
                if (bar) bar.style.setProperty('--progress', p.toFixed(4));
                if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
                if (heroBg && root.classList.contains('motion') && window.scrollY < window.innerHeight * 1.2) {
                    heroBg.style.setProperty('--parallax', (window.scrollY * 0.25).toFixed(1) + 'px');
                }
            });
        }
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        onScroll();

        // ─── Бегунок меню ──────────────────────────────────────────────────
        var nav = document.querySelector('.nav-links');
        if (nav) {
            var ind = document.createElement('span');
            ind.className = 'nav-indicator';
            ind.setAttribute('aria-hidden', 'true');
            nav.appendChild(ind);
            var place = function (a) {
                var on = !!(a && a.offsetWidth);
                // Класс меняем только при реальной смене: иначе наблюдатель ниже зациклится.
                if (ind.classList.contains('is-on') !== on) ind.classList.toggle('is-on', on);
                if (!on) return;
                var r = a.getBoundingClientRect();
                var n = nav.getBoundingClientRect();
                ind.style.width = r.width + 'px';
                ind.style.transform = 'translateX(' + (r.left - n.left) + 'px)';
            };
            var active = function () { return nav.querySelector('a.active'); };
            // Следим только за пунктами меню (класс active ставит подсветка разделов), не за бегунком.
            new MutationObserver(function (records) {
                if (records.some(function (m) { return m.target !== ind; })) place(active());
            }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['class'] });
            nav.addEventListener('mouseover', function (e) { var a = e.target.closest('a'); if (a) place(a); });
            nav.addEventListener('mouseleave', function () { place(active()); });
            window.addEventListener('resize', function () { place(active()); });
            // Шрифты и перевод меняют ширину пунктов.
            if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(active()); });
            new MutationObserver(function () { place(active()); }).observe(root, { attributes: true, attributeFilter: ['lang'] });
            place(active());
        }

        // ─── Посадка на раздел, выбранный в меню ───────────────────────────
        document.addEventListener('click', function (e) {
            var a = e.target.closest('a[href^="#"]');
            if (!a || a.getAttribute('href').length < 2) return;
            var target = document.getElementById(a.getAttribute('href').slice(1));
            if (!target || target.tagName !== 'SECTION' || reduced) return;
            var land = function () {
                target.classList.remove('is-landing');
                void target.offsetWidth; // перезапуск анимации
                target.classList.add('is-landing');
                setTimeout(function () { target.classList.remove('is-landing'); }, 1300);
            };
            if ('onscrollend' in window) window.addEventListener('scrollend', land, { once: true });
            else setTimeout(land, 650);
        });

        // ─── Подсветка карточек за курсором ────────────────────────────────
        if (window.matchMedia('(hover: hover)').matches) {
            document.querySelectorAll('.card, .feature-item, .arch-step, .overview-facts li, .contact-card').forEach(function (el) {
                el.classList.add('qx-glow');
                el.addEventListener('pointermove', function (e) {
                    var r = el.getBoundingClientRect();
                    el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                    el.style.setProperty('--my', (e.clientY - r.top) + 'px');
                });
            });
        }
    });
})();
