/*
 * Qidrix · общие мелочи для всех страниц сайта.
 * Кнопки «Демо-карьер» передают демо язык сайта (?lang=…): демо живёт на другом домене,
 * общего хранилища браузера у них нет. Подписи кнопок для экранных читалок — на языке страницы.
 *
 * Языковые версии — отдельные страницы (/ — русский, /en/, /kk/, /uz/), чтобы поисковики видели
 * каждую. На <html> страница знает путь к корню сайта (data-root) и себя (data-page): так ссылки
 * работают и на qidrix.asia, и на зеркале в подпапке.
 */
(function () {
    'use strict';
    var DEMO = 'qidrixman.github.io/qidrix-karier/demo/';
    function currentLang() {
        var l = (document.documentElement.lang || 'ru').slice(0, 2);
        return /^(ru|en|kk|uz)$/.test(l) ? l : 'ru';
    }
    var LANGS = ['ru', 'en', 'kk', 'uz'];
    var LABEL = { ru: 'RU', en: 'EN', kk: 'KZ', uz: 'UZ' };
    /** Адрес этой же страницы на языке lang; keepPlace — с текущим разделом (#slide-3 и т.п.). */
    function langUrl(lang, keepPlace) {
        var h = document.documentElement;
        var url = (h.dataset.root || '') + (lang === 'ru' ? '' : lang + '/') + (h.dataset.page || '');
        if (!url) url = './';
        if (keepPlace) {
            var place = '';
            document.querySelectorAll('main section[id], body > section[id]').forEach(function (s) {
                if (s.getBoundingClientRect().top <= 120) place = s.id;
            });
            if (place && window.scrollY > 200) url += '#' + place;
        }
        return url;
    }
    window.qxLangUrl = langUrl;
    function remember(lang) { try { localStorage.setItem('qidrix_lang', lang); } catch (e) {} }
    /** Переключатель языков в футере — обычные ссылки (их видят и поисковики). */
    function langLinks() {
        var page = currentLang();
        document.querySelectorAll('[data-qx-langs]').forEach(function (nav) {
            if (!nav.children.length) LANGS.forEach(function (l) {
                var a = document.createElement('a');
                a.href = langUrl(l);
                a.hreflang = l;
                a.lang = l;
                a.textContent = LABEL[l];
                if (l === page) a.setAttribute('aria-current', 'true');
                nav.appendChild(a);
            });
            nav.querySelectorAll('a[hreflang]').forEach(function (a) {
                var l = a.getAttribute('hreflang');
                a.addEventListener('click', function (e) {
                    remember(l);
                    if (l !== page) { e.preventDefault(); location.href = langUrl(l, true); }
                });
            });
        });
    }
    function update() {
        var lang = currentLang();
        document.querySelectorAll('a[href*="' + DEMO + '"]').forEach(function (a) {
            var url = new URL(a.getAttribute('href'), location.href);
            url.searchParams.set('lang', lang);
            a.setAttribute('href', url.toString());
        });
    }
    // Подписи кнопок для экранных читалок — на языке страницы (data-aria-ru / -en / -kk / -uz).
    function ariaLabels() {
        var lang = currentLang();
        document.querySelectorAll('[data-aria-' + lang + ']').forEach(function (el) {
            el.setAttribute('aria-label', el.getAttribute('data-aria-' + lang));
        });
    }
    function init() {
        langLinks();
        update();
        ariaLabels();
        new MutationObserver(function () { update(); ariaLabels(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
