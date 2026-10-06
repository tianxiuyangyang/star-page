/* =========================================================
 *  我们的星页 · 交互
 *  ---------------------------------------------------------
 *  内容全部来自 js/content.js，这里只负责动画和逻辑。
 *  一般不需要改这个文件。
 * ========================================================= */

(function () {
  'use strict';

  var S = window.SITE || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function setText(sel, txt) {
    var el = $(sel);
    if (el && txt != null) el.textContent = txt;
  }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }

  /* =======================================================
   *  0. 标题
   * ======================================================= */
  if (S.pageTitle) document.title = S.pageTitle;

    /* =======================================================
   *  1. 背景：星空 + 流星雨
   *     开场（封面还在）时是上半屏的流星雨，
   *     进入正文后密度自动降到约三成，只剩零星几条。
   *     想调密度：改 setIntensity 的数值；想调"半屏"的界线：改 step 里的 half。
   * ======================================================= */
  var Sky = (function () {
    var cv = $('#stars');
    if (!cv || !cv.getContext) return null;
    var ctx = cv.getContext('2d');
    var W = 0, H = 0, DPR = 1, small = false;
    var stars = [], meteors = [];
    var raf = 0, t0 = 0, lastMs = 0, alive = true, acc = 0;
    var intensity = 1, target = 1;          // 1 = 开场密度，进入后调到 0.28

    function maxMeteors() { return Math.max(2, Math.round((small ? 14 : 30) * intensity)); }
    function rate() { return (small ? 6 : 11) * intensity; }   // 每秒新生几条

    function build() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      small = window.innerWidth < 640;
      W = cv.width = Math.floor(window.innerWidth * DPR);
      H = cv.height = Math.floor(window.innerHeight * DPR);
      var n = Math.round(Math.min(160, Math.max(46, (window.innerWidth * window.innerHeight) / 13000)));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: (Math.random() * 1.25 + 0.35) * DPR,
          a: Math.random() * 0.6 + 0.18,
          sp: Math.random() * 0.02 + 0.004,
          ph: Math.random() * Math.PI * 2,
          warm: Math.random() < 0.22
        });
      }
      meteors = [];
      acc = 0;
    }

    function newMeteor() {
      var right = Math.random() < 0.5;                        // 一半往左下、一半往右下
      var ang = (26 + Math.random() * 16) * Math.PI / 180;     // 与竖直方向的夹角
      var sp = (430 + Math.random() * 430) * DPR;              // 速度（px/秒）
      return {
        x: (right ? -0.05 + Math.random() * 0.95 : 0.1 + Math.random() * 0.95) * W,
        y: (-0.18 + Math.random() * 0.34) * H,
        vx: (right ? 1 : -1) * Math.sin(ang) * sp,
        vy: Math.cos(ang) * sp,
        len: (95 + Math.random() * 150) * DPR,
        w: (1.2 + Math.random() * 0.9) * DPR,
        life: 0,
        max: 1.1 + Math.random() * 1.1
      };
    }

    function drawMeteor(m, a) {
      var d = Math.sqrt(m.vx * m.vx + m.vy * m.vy) || 1;
      var tx = m.x - m.vx / d * m.len;
      var ty = m.y - m.vy / d * m.len;
      var g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, 'rgba(255,246,242,' + (0.9 * a).toFixed(3) + ')');
      g.addColorStop(0.32, 'rgba(240,190,196,' + (0.5 * a).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(232,160,168,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = m.w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff8f4';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.w * 1.15, 0, 6.2832);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    function drawStars(t) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        ctx.globalAlpha = t === null ? s.a : s.a * (0.55 + 0.45 * Math.sin(t * s.sp * 3 + s.ph));
        ctx.fillStyle = s.warm ? '#f2ccd0' : '#dee6ff';
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function step(dt, now) {
      intensity += (target - intensity) * Math.min(1, dt * 1.8);   // 密度平滑过渡
      drawStars(now / 1000);

      // 流星：只在上半屏飞，越过"半屏线"就淡出，所以下半屏一直是干净的
      acc += rate() * dt;
      while (acc >= 1) {
        acc -= 1;
        if (meteors.length < maxMeteors()) meteors.push(newMeteor());
      }
      if (meteors.length > maxMeteors()) meteors.length = maxMeteors();

      var half = H * 0.56;
      for (var k = meteors.length - 1; k >= 0; k--) {
        var m = meteors[k];
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        var fadeIn = Math.min(1, m.life / 0.26);
        var fadeOut = m.y <= half ? 1 : Math.max(0, 1 - (m.y - half) / (H * 0.16));
        var a = fadeIn * fadeOut * (0.45 + 0.55 * intensity);
        if (a <= 0.012 || m.life > m.max || m.x < -W * 0.35 || m.x > W * 1.35) {
          meteors.splice(k, 1);
          continue;
        }
        drawMeteor(m, a);
      }
    }

    function loop(ms) {
      if (!alive) return;
      if (!t0) { t0 = ms; lastMs = ms; }
      var dt = Math.min(0.05, (ms - lastMs) / 1000);
      lastMs = ms;
      step(dt, ms);
      raf = requestAnimationFrame(loop);
    }

    function start() {
      build();
      if (reduce) { drawStars(null); return; }   // 系统开了"减少动态效果"就不放流星
      cancelAnimationFrame(raf);
      alive = true;
      t0 = 0;
      raf = requestAnimationFrame(loop);
    }

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        build();
        if (reduce) drawStars(null);
      }, 220);
    });
    document.addEventListener('visibilitychange', function () {
      if (reduce) return;
      if (document.hidden) { alive = false; cancelAnimationFrame(raf); }
      else { alive = true; t0 = 0; raf = requestAnimationFrame(loop); }
    });

    start();

    return {
      // 开场 1 → 进入正文后调小（0.28 ≈ 三成密度）
      setIntensity: function (v) { target = Math.max(0, Math.min(1, v)); },
      redraw: function () { if (reduce) drawStars(null); }
    };
  })();

/* =======================================================
   *  2. 音效（Web Audio 实时合成，不加载任何音频文件）
   * ======================================================= */
  var Sfx = (function () {
    var ctx = null, on = true;

    function ensure() {
      if (ctx) return ctx;
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { ctx = new C(); } catch (e) { return null; }
      return ctx;
    }
    /* 浏览器规定：没有用户手势就不许出声。
       所以这里绝不硬排振荡器——等 resume 成功之后再放，
       否则控制台会刷一堆 AudioContext was not allowed to start。 */
    function ready(fn) {
      if (!on) return;
      var c = ensure();
      if (!c) return;
      if (c.state === 'running') { fn(c); return; }
      var p = c.resume();
      if (p && typeof p.then === 'function') {
        p.then(function () { if (on && c.state === 'running') fn(c); }, function () {});
      }
    }
    function tone(c, freq, dur, gain, delay, type) {
      var t = c.currentTime + (delay || 0);
      var o = c.createOscillator();
      var g = c.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain || 0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    }

    return {
      get on() { return on; },
      set on(v) { on = !!v; },
      // 第一次碰屏幕/按键时先把音频上下文唤醒，这样点击时的音效不会丢
      warm: function () {
        var c = ensure();
        if (c && c.state === 'suspended') c.resume();
      },
      open: function () {
        ready(function (c) {
          tone(c, 523.25, 0.9, 0.045, 0, 'sine');
          tone(c, 659.25, 1.1, 0.035, 0.10, 'sine');
          tone(c, 783.99, 1.4, 0.03, 0.22, 'sine');
        });
      },
      pick: function () {
        ready(function (c) { tone(c, 880, 0.16, 0.035, 0, 'sine'); tone(c, 1174.66, 0.2, 0.02, 0.05, 'sine'); });
      },
      ok: function () {
        ready(function (c) { tone(c, 659.25, 0.24, 0.04, 0, 'sine'); tone(c, 987.77, 0.5, 0.028, 0.09, 'sine'); });
      },
      tap: function () {
        ready(function (c) { tone(c, 1200, 0.06, 0.014, 0, 'triangle'); });
      }
    };
  })();

  (function warmup() {
    var evs = ['pointerdown', 'touchstart', 'keydown'];
    function once() {
      Sfx.warm();
      evs.forEach(function (e) { window.removeEventListener(e, once); });
    }
    evs.forEach(function (e) { window.addEventListener(e, once, { passive: true }); });
  })();

  var soundBtn = $('#soundBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', function () {
      Sfx.on = !Sfx.on;
      soundBtn.setAttribute('aria-pressed', String(Sfx.on));
      document.body.classList.toggle('sound-off', !Sfx.on);
      if (Sfx.on) Sfx.tap();
    });
  }

    /* =======================================================
   *  3. 爱心冒泡
   *     点页面任意位置，都会从点击的地方冒出一串小爱心。
   * ======================================================= */
  var HEARTS = ['♡', '♥', '♡', '💗', '♡', '💕'];
  function hearts(x, y, n, big) {
    if (reduce) return;
    n = n || 7;
    for (var i = 0; i < n; i++) {
      (function (i) {
        setTimeout(function () {
          var el = document.createElement('span');
          el.className = 'heart-fx';
          el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
          el.style.left = (x + (Math.random() - 0.5) * (big ? 64 : 38)) + 'px';
          el.style.top  = (y + (Math.random() - 0.5) * 16) + 'px';
          el.style.color = Math.random() < 0.6 ? '#e8a0a8' : '#f5c9b8';
          el.style.setProperty('--dx', ((Math.random() - 0.5) * (big ? 200 : 112)).toFixed(0) + 'px');
          el.style.setProperty('--dy', ((big ? 180 : 96) + Math.random() * (big ? 220 : 120)).toFixed(0) + 'px');
          el.style.setProperty('--sway', ((Math.random() - 0.5) * (big ? 52 : 40)).toFixed(0) + 'px');
          el.style.setProperty('--rot', ((Math.random() - 0.5) * 64).toFixed(0) + 'deg');
          el.style.setProperty('--dur', ((big ? 2.2 : 1.7) + Math.random() * 1.2).toFixed(2) + 's');
          el.style.setProperty('--fs', ((big ? 13 : 14) + Math.random() * (big ? 11 : 10)).toFixed(0) + 'px');
          document.body.appendChild(el);
          el.addEventListener('animationend', function () { el.remove(); });
          setTimeout(function () { if (el.parentNode) el.remove(); }, 4600);
        }, i * (big ? 46 : 62));
      })(i);
    }
  }

  // 进入正文后：点哪儿哪儿冒爱心（开场那一下由"进入"动画自己放，不重复）
  document.addEventListener('click', function (e) {
    if (document.body.classList.contains('locked')) return;
    var keyboard = !e.clientX && !e.clientY;
    hearts(keyboard ? window.innerWidth / 2 : e.clientX,
           keyboard ? window.innerHeight * 0.62 : e.clientY,
           7, false);
  });

/* =======================================================
   *  4. 首页开场
   * ======================================================= */
  (function cover() {
    var C = S.cover || {};
    setText('#coverKicker', C.kicker || '');
    setText('#coverDatePrefix', C.datePrefix || '');
    setText('#coverDate', S.startLabel || '');
    var hint = $('#coverHint span');
    if (hint && C.hint) hint.textContent = C.hint;

    var line = $('#coverLine');
    if (line) {
      var raw = String(C.line || '').split('\n');
      var idx = 0, html = '';
      raw.forEach(function (seg, li) {
        if (li) html += '<br>';
        for (var i = 0; i < seg.length; i++) {
          var ch = seg[i];
          if (ch === ' ') { html += '&nbsp;'; continue; }
          html += '<span class="ch" style="--i:' + (idx++) + '">' + esc(ch) + '</span>';
        }
      });
      line.innerHTML = html;
    }

    var done = false;
    function enter(ev) {
      if (done) return;
      done = true;
      document.body.classList.add('entered');
      var main = $('#main');
      if (main) main.setAttribute('aria-hidden', 'false');
      var cov = $('#cover');
      if (cov) cov.classList.add('is-gone');

      var x = window.innerWidth / 2, y = window.innerHeight * 0.62;
      if (ev && ev.clientX) { x = ev.clientX; y = ev.clientY; }
      hearts(x, y, 20, true);
      if (Sky) Sky.setIntensity(0.28);      // 进入正文后，流星雨变少
      Sfx.open();

      setTimeout(function () {
        // 等封面淡出再解锁：这样"进入"这一下不会被冒爱心特效重复接住
        document.body.classList.remove('locked');
        startReveal();
        if (cov) cov.style.display = 'none';
      }, reduce ? 0 : 900);
      window.scrollTo(0, 0);
    }

    var cov = $('#cover');
    if (cov) cov.addEventListener('click', enter);
    document.addEventListener('keydown', function (e) {
      if (document.body.classList.contains('locked') &&
          (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
        e.preventDefault();
        enter(null);
      }
    });
  })();

  /* =======================================================
   *  5. 入场显示（进入后才开始观察，免得动画在封面后面播完）
   * ======================================================= */
  var revealStarted = false;
  function startReveal() {
    if (revealStarted) return;
    revealStarted = true;
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduce) {
      els.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* =======================================================
   *  6. 侧边导航点 + 章节高亮
   * ======================================================= */
  (function nav() {
    var box = $('#dots');
    var secs = $$('#main .sec');
    if (!box || !secs.length) return;

    var btns = secs.map(function (sec) {
      var k = sec.querySelector('.kicker');
      var label = k ? k.textContent.replace(/^\s*\d+\s*/, '').trim() : (sec.id || '');
      var b = document.createElement('button');
      b.type = 'button';
      b.innerHTML = '<span>' + esc(label) + '</span><i></i>';
      b.title = label;
      b.addEventListener('click', function () {
        Sfx.tap();
        sec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
      box.appendChild(b);
      return b;
    });

    // 左上角站名也当成"回到开头"的按钮
    var brand = $('#brandBtn');
    if (brand) {
      brand.addEventListener('click', function () {
        Sfx.tap();
        secs[0].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    }

    var ticking = false;
    function sync() {
      ticking = false;
      var mid = window.innerHeight * 0.45, best = 0;
      secs.forEach(function (sec, i) {
        if (sec.getBoundingClientRect().top <= mid) best = i;
      });
      btns.forEach(function (b, i) { b.classList.toggle('on', i === best); });
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sync);
    }, { passive: true });
    sync();
  })();

  /* =======================================================
   *  7. 我们俩（生日 / 星座 / 中间的大爱心）
   * ======================================================= */
  (function couple() {
    var C = S.couple;
    var box = $('#pair');
    if (!C || !box) return;

    setText('#coupleKicker', C.kicker || '');
    setText('#coupleTitle', C.title || '');
    setText('#coupleSub', C.sub || '');
    // 标题 / 小字留空时整块收掉，免得留一段空白
    function hideIfEmpty(sel) {
      var el = $(sel);
      if (el && !el.textContent.trim()) el.hidden = true;
    }
    hideIfEmpty('#coupleTitle');
    hideIfEmpty('#coupleSub');

    function side(d, cls) {
      d = d || {};
      return '' +
        '<div class="pair-side ' + cls + '">' +
          '<span class="pair-ico" aria-hidden="true">' + esc(d.symbol || '') + '</span>' +
          (d.label ? '<p class="pair-label">' + esc(d.label) + '</p>' : '') +
          (d.date ? '<p class="pair-date">' + esc(d.date) + '</p>' : '') +
          (d.sign ? '<p class="pair-sign">' + esc(d.sign) + '</p>' : '') +
        '</div>';
    }
    // 中间那个大爱心写在 index.html 里，这里只填左右两侧
    var him = $('#pairHim'), her = $('#pairHer');
    if (him) him.outerHTML = side(C.him, 'him');
    if (her) her.outerHTML = side(C.her, 'her');
  })();

  /* =======================================================
   *  8. 封底照片
   * ======================================================= */
  (function finale() {
    var F = S.finale || {};
    setText('#finaleKicker', F.kicker || '');
    setText('#sign', F.sign || '');
    setText('#shotCap', F.caption || '');
    setText('#backBtn', F.backBtn || '回到开头');
    setText('#foot', S.footer || '');
    var sub = $('#finaleSub');
    if (sub && F.sub) sub.textContent = F.sub;

    var lineEl = $('#finaleLine');
    if (lineEl && F.line) lineEl.innerHTML = nl2br(F.line);

    var img = $('#shotImg');
    if (img) {
      if (F.photo) img.src = F.photo;
      img.alt = F.caption || '我们的照片';
      img.addEventListener('error', function () {
        var fr = img.parentNode;
        if (!fr || fr.dataset.empty) return;
        fr.dataset.empty = '1';
        fr.innerHTML = '<div class="shot-empty">把照片放进 <b>assets/</b> 文件夹，<br>再改一下 <b>js/content.js</b> 里的 finale.photo 就好。</div>';
      });
    }

    var back = $('#backBtn');
    if (back) {
      back.addEventListener('click', function () {
        Sfx.tap();
        var top = $('#main .sec') || document.body;
        top.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    }
  })();

  /* =======================================================
   *  9. 大图查看
   * ======================================================= */
  (function lightbox() {
    var lb = $('#lightbox'), img = $('#lbImg'), cap = $('#lbCap');
    if (!lb) return;
    var opener = null;

    function open(src, text, from) {
      if (!src) return;
      img.src = src;
      cap.textContent = text || '';
      lb.classList.add('on');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lb-open');
      opener = from || null;
      Sfx.tap();
    }
    function close() {
      lb.classList.remove('on');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lb-open');
      if (opener && opener.focus) opener.focus();
      opener = null;
    }

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('[data-close]')) { close(); return; }
      var shot = t.closest('.shot-frame');
      if (shot) {
        var si = shot.querySelector('img');
        if (si) open(si.src, ($('#shotCap') || {}).textContent, shot);
        return;
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb.classList.contains('on')) close();
    });
  })();

})();
