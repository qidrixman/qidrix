/*
 * Qidrix · общие мелочи для всех страниц сайта.
 * Кнопки «Демо-карьер» передают демо язык сайта (?lang=…): демо живёт на другом домене,
 * общего хранилища браузера у них нет. Подписи кнопок для экранных читалок — на языке страницы.
 */
(function () {
    'use strict';
    var DEMO = 'qidrixman.github.io/qidrix-karier/demo/';
    function currentLang() {
        var l = (document.documentElement.lang || 'ru').slice(0, 2);
        return /^(ru|en|kk|uz)$/.test(l) ? l : 'ru';
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
        update();
        ariaLabels();
        new MutationObserver(function () { update(); ariaLabels(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
