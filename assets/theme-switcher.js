(function () {
  'use strict';

  var STORAGE_KEY = 'blog-theme';
  var currentTheme = localStorage.getItem(STORAGE_KEY) || 'simple';

  function applyTheme(theme) {
    document.body.classList.remove('theme-simple', 'theme-anime', 'theme-cool');
    document.body.classList.add('theme-' + theme);
    currentTheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);

    if (theme === 'anime') {
      ensureAnimeBg();
      removeCoolBg();
    } else if (theme === 'cool') {
      ensureCoolBg();
      removeAnimeBg();
    } else {
      removeAnimeBg();
      removeCoolBg();
    }

    document.querySelectorAll('.ts-card').forEach(function (card) {
      card.classList.toggle('selected', card.dataset.theme === theme);
    });
  }

  function ensureAnimeBg() {
    if (document.getElementById('anime-bg-video')) return;
    var video = document.createElement('video');
    video.id = 'anime-bg-video';
    video.src = '/assets/anime-bg.mp4';
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', '');
    document.body.insertBefore(video, document.body.firstChild);
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  function removeAnimeBg() {
    var el = document.getElementById('anime-bg-video');
    if (el) el.remove();
  }

  function ensureCoolBg() {
    if (document.getElementById('cool-bg-iframe')) return;
    var iframe = document.createElement('iframe');
    iframe.id = 'cool-bg-iframe';
    iframe.src = '/assets/neon-bg.html';
    iframe.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;z-index:-2;pointer-events:none;opacity:0.5;';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.setAttribute('tabindex', '-1');
    document.body.insertBefore(iframe, document.body.firstChild);
  }

  function removeCoolBg() {
    var el = document.getElementById('cool-bg-iframe');
    if (el) el.remove();
  }

  function showPanel() {
    var overlay = document.getElementById('theme-switcher-overlay');
    var panel = document.getElementById('theme-switcher-panel');
    if (!overlay || !panel) return;
    overlay.classList.add('active');
    panel.classList.add('active');
    document.querySelectorAll('.ts-card').forEach(function (card) {
      card.classList.toggle('selected', card.dataset.theme === currentTheme);
    });
  }

  function hidePanel() {
    var overlay = document.getElementById('theme-switcher-overlay');
    var panel = document.getElementById('theme-switcher-panel');
    if (!overlay || !panel) return;
    overlay.classList.remove('active');
    panel.classList.remove('active');
  }

  function addNavButton() {
    var menu = document.querySelector('.menu');
    if (!menu || document.getElementById('theme-nav-btn')) return;
    var li = document.createElement('li');
    li.className = 'menu-item menu-item-theme';
    li.id = 'theme-nav-btn';
    li.innerHTML = '<a href="javascript:;" rel="section" title="切换风格"><i class="fa fa-palette fa-fw"></i>风格</a>';
    li.addEventListener('click', showPanel);
    menu.appendChild(li);
  }

  function initPanelEvents() {
    var overlay = document.getElementById('theme-switcher-overlay');
    var panel = document.getElementById('theme-switcher-panel');
    if (!panel) return;

    panel.querySelector('.ts-close').addEventListener('click', hidePanel);
    if (overlay) overlay.addEventListener('click', hidePanel);

    document.querySelectorAll('.ts-card').forEach(function (card) {
      card.addEventListener('click', function () {
        applyTheme(card.dataset.theme);
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') hidePanel();
    });
  }

  function init() {
    addNavButton();
    initPanelEvents();
    applyTheme(currentTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
