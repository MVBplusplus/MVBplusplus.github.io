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
    if (document.getElementById('cool-bg-canvas')) return;
    var canvas = document.createElement('canvas');
    canvas.id = 'cool-bg-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;z-index:-2;pointer-events:none;opacity:0.7;';
    document.body.insertBefore(canvas, document.body.firstChild);
    initNeonCanvas(canvas);
  }

  function initNeonCanvas(canvas) {
    var ctx = canvas.getContext('2d');
    var TAU = Math.PI * 2;
    var palettes = {
      aurora: ['#69F0E2', '#54B8FF', '#A678FF', '#D9FFF6', '#6BE7C8'],
      cyber:  ['#00E5FF', '#6C63FF', '#FF3D9A', '#8CFF98', '#FFFFFF']
    };
    var settings = {
      particleAmount: 120, particleSize: 3.4, speed: 18,
      connectionRadius: 175, lineOpacity: 0.62, lineWidth: 1.15,
      glow: 0.42, backgroundColor: '#03151d', backgroundAccent: '#073347',
      theme: 'aurora', subtlePulse: true, adaptiveQuality: true
    };
    var cssW = 1, cssH = 1, dpr = 1;
    var particles = [];
    var grid = new Map();
    var cols = 1, rows = 1, cellSize = settings.connectionRadius;
    var lastTime = performance.now();
    var frameAccumulator = 0;
    var qualityScale = 1;
    var slowFrames = 0;
    var mouse = { x: -9999, y: -9999, active: false };

    function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
    function hexToRgb(hex) {
      var n = parseInt(hex.replace('#', ''), 16);
      return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
    }
    function rgbCss(hex, alpha){
      var c = hexToRgb(hex);
      return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + alpha + ')';
    }
    function currentPalette(){
      return palettes[settings.theme] || palettes.aurora;
    }
    function randomParticleColor(){
      var p = currentPalette();
      return p[(Math.random() * p.length) | 0];
    }

    function Particle(x, y) {
      this.x = x !== undefined ? x : Math.random() * cssW;
      this.y = y !== undefined ? y : Math.random() * cssH;
      this.baseRadius = settings.particleSize * (0.58 + Math.random() * 0.78);
      this.radius = this.baseRadius;
      this.phase = Math.random() * TAU;
      this.color = randomParticleColor();
      var angle = Math.random() * TAU;
      var vel = settings.speed * (0.7 + Math.random() * 0.55);
      this.vx = Math.cos(angle) * vel;
      this.vy = Math.sin(angle) * vel;
    }
    Particle.prototype.update = function(dt, t) {
      var speedNow = Math.hypot(this.vx, this.vy) || 1;
      var desired = settings.speed * (0.7 + 0.55 * ((Math.sin(this.phase) + 1) * 0.5));
      var correction = clamp((desired - speedNow) * dt * 0.5, -0.2, 0.2);
      this.vx += (this.vx / speedNow) * correction;
      this.vy += (this.vy / speedNow) * correction;
      if (mouse.active) {
        var dx = this.x - mouse.x, dy = this.y - mouse.y;
        var d2 = dx * dx + dy * dy;
        var r = 180;
        if (d2 > 1 && d2 < r * r) {
          var d = Math.sqrt(d2);
          var f = (1 - d / r) * 38 * dt;
          this.vx += (dx / d) * f;
          this.vy += (dy / d) * f;
        }
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      var pad = 2;
      if (this.x < -pad) { this.x = -pad; this.vx = Math.abs(this.vx); }
      else if (this.x > cssW + pad) { this.x = cssW + pad; this.vx = -Math.abs(this.vx); }
      if (this.y < -pad) { this.y = -pad; this.vy = Math.abs(this.vy); }
      else if (this.y > cssH + pad) { this.y = cssH + pad; this.vy = -Math.abs(this.vy); }
      var pulse = settings.subtlePulse ? (0.92 + 0.08 * Math.sin(t * 0.0015 + this.phase)) : 1;
      this.radius = this.baseRadius * pulse;
    };
    Particle.prototype.draw = function() {
      if (settings.glow > 0.02) {
        var glowRadius = this.radius * (2.0 + settings.glow * 2.6);
        ctx.fillStyle = rgbCss(this.color, 0.055 * settings.glow);
        ctx.beginPath(); ctx.arc(this.x, this.y, glowRadius, 0, TAU); ctx.fill();
        ctx.fillStyle = rgbCss(this.color, 0.11 * settings.glow);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * (1.35 + settings.glow), 0, TAU); ctx.fill();
      }
      ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.beginPath(); ctx.arc(this.x - this.radius * 0.25, this.y - this.radius * 0.25, Math.max(0.45, this.radius * 0.22), 0, TAU); ctx.fill();
    };

    function resize() {
      cssW = Math.max(1, window.innerWidth);
      cssH = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = cssW + 'px';
      canvas.style.height = cssH + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rebuildParticles(true);
    }

    function rebuildParticles(preserve) {
      var target = Math.max(10, Math.round(settings.particleAmount * qualityScale));
      if (!preserve || particles.length === 0) particles = [];
      while (particles.length < target) particles.push(new Particle());
      if (particles.length > target) particles.length = target;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.baseRadius = settings.particleSize * (0.58 + Math.random() * 0.78);
        if (!preserve) p.color = randomParticleColor();
        p.x = clamp(p.x, 0, cssW); p.y = clamp(p.y, 0, cssH);
      }
      rebuildGrid();
    }

    function rebuildGrid() {
      cellSize = Math.max(40, settings.connectionRadius);
      cols = Math.max(1, Math.ceil(cssW / cellSize));
      rows = Math.max(1, Math.ceil(cssH / cellSize));
      grid = new Map();
    }

    function buildGrid() {
      grid.clear();
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        var cx = clamp(Math.floor(p.x / cellSize), 0, cols - 1);
        var cy = clamp(Math.floor(p.y / cellSize), 0, rows - 1);
        var key = cy * cols + cx;
        var bucket = grid.get(key);
        if (!bucket) grid.set(key, bucket = []);
        bucket.push(i);
        p.cx = cx; p.cy = cy;
      }
    }

    function drawBackground(t) {
      var g = ctx.createLinearGradient(0, 0, cssW, cssH);
      g.addColorStop(0, settings.backgroundColor);
      g.addColorStop(0.52, settings.backgroundAccent);
      g.addColorStop(1, settings.backgroundColor);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cssW, cssH);
      var pulse = settings.subtlePulse ? (0.5 + 0.5 * Math.sin(t * 0.00018)) : 0.5;
      var halo = ctx.createRadialGradient(cssW * 0.72, cssH * 0.28, 0, cssW * 0.72, cssH * 0.28, Math.max(cssW, cssH) * 0.78);
      halo.addColorStop(0, rgbCss(currentPalette()[1], 0.055 + pulse * 0.015));
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, cssW, cssH);
    }

    function drawConnections() {
      var maxD2 = settings.connectionRadius * settings.connectionRadius;
      ctx.lineWidth = settings.lineWidth;
      for (var i = 0; i < particles.length; i++) {
        var a = particles[i];
        for (var oy = -1; oy <= 1; oy++) {
          var y = a.cy + oy; if (y < 0 || y >= rows) continue;
          for (var ox = -1; ox <= 1; ox++) {
            var x = a.cx + ox; if (x < 0 || x >= cols) continue;
            var bucket = grid.get(y * cols + x); if (!bucket) continue;
            for (var bj = 0; bj < bucket.length; bj++) {
              var j = bucket[bj];
              if (j <= i) continue;
              var b = particles[j];
              var dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
              if (d2 >= maxD2) continue;
              var proximity = 1 - d2 / maxD2;
              var alpha = proximity * proximity * settings.lineOpacity;
              if (alpha < 0.012) continue;
              ctx.strokeStyle = rgbCss(a.color, clamp(alpha, 0, 0.88));
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
      }
    }

    function render(now) {
      requestAnimationFrame(render);
      var frameMs = now - lastTime;
      lastTime = now;
      var minFrame = 1000 / 60;
      frameAccumulator += frameMs;
      if (minFrame && frameAccumulator < minFrame) return;
      var elapsed = frameAccumulator || frameMs;
      frameAccumulator = 0;
      var dt = clamp(elapsed / 1000, 0.001, 0.045);
      drawBackground(now);
      for (var i = 0; i < particles.length; i++) particles[i].update(dt, now);
      buildGrid();
      drawConnections();
      for (var j2 = 0; j2 < particles.length; j2++) particles[j2].draw();
      if (settings.adaptiveQuality) {
        if (elapsed > 28) slowFrames++; else slowFrames = Math.max(0, slowFrames - 2);
        if (slowFrames > 120 && qualityScale > 0.62) {
          qualityScale = Math.max(0.62, qualityScale - 0.08);
          slowFrames = 0;
          rebuildParticles(true);
        }
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', function(e) { mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true; }, { passive: true });
    window.addEventListener('mouseleave', function() { mouse.active = false; }, { passive: true });

    resize();
    requestAnimationFrame(render);
  }

  function removeCoolBg() {
    var el = document.getElementById('cool-bg-canvas');
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
