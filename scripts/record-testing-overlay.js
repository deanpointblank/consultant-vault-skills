// On-screen annotations for record-testing recordings: caption bar, cursor ring, click ring, key badge. Run only after the login ends.
async page => {
  const init = () => {
    if (window !== window.top) return;
    if (window.__rec_on) return;
    window.__rec_on = true;
    const start = () => {
      if (document.getElementById('__rec_cap')) return;
      // A constructed sheet, not a <style> element: a page policy such as style-src 'self' blocks an injected <style> silently.
      const css = new CSSStyleSheet();
      css.replaceSync(`
#__rec_cap{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);max-width:90%;background:rgba(0,0,0,.85);color:#fff;font:700 32px/1.3 system-ui,sans-serif;padding:14px 26px;border-radius:12px;z-index:2147483647;pointer-events:none;text-align:center}
#__rec_cap:empty{display:none}
#__rec_dot{position:fixed;width:36px;height:36px;box-sizing:border-box;margin:-18px 0 0 -18px;border-radius:50%;background:transparent;border:5px solid #f22;z-index:2147483647;pointer-events:none;transition:left .45s ease,top .45s ease;left:-100px;top:-100px}
.__rec_ring{position:fixed;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:4px solid #f22;z-index:2147483647;pointer-events:none;animation:__rec_r .6s ease-out forwards}
@keyframes __rec_r{to{width:90px;height:90px;margin:-45px 0 0 -45px;opacity:0}}
#__rec_keys{position:fixed;right:24px;top:24px;background:#ffd400;color:#000;font:700 28px/1.2 ui-monospace,monospace;padding:8px 16px;border-radius:8px;z-index:2147483647;pointer-events:none}
#__rec_keys:empty{display:none}`);
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, css];
      const store = {
        get: () => { try { return sessionStorage.getItem('__rec_cap') || ''; } catch { return ''; } },
        set: t => { try { sessionStorage.setItem('__rec_cap', t); } catch {} },
      };
      const mk = id => { const d = document.createElement('div'); d.id = id; document.documentElement.appendChild(d); return d; };
      const cap = mk('__rec_cap'), dot = mk('__rec_dot'), keys = mk('__rec_keys');
      const at = (x, y) => { dot.style.left = x + 'px'; dot.style.top = y + 'px'; };
      let kt, typed = [];
      addEventListener('mousemove', e => at(e.clientX, e.clientY), true);
      addEventListener('mousedown', e => {
        // Snap, do not glide: the ring is on the target when the click lands.
        dot.style.transition = 'none'; at(e.clientX, e.clientY); void dot.offsetWidth; dot.style.transition = '';
        const r = document.createElement('div'); r.className = '__rec_ring'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px';
        document.documentElement.appendChild(r); setTimeout(() => r.remove(), 700);
      }, true);
      addEventListener('keydown', e => {
        const t = e.composedPath()[0];
        if (t && t.type === 'password') return;
        typed.push(e.key.length === 1 ? e.key : '⟨' + e.key + '⟩');
        while (typed.length > 1 && typed.join('').length > 40) typed.shift();
        keys.textContent = '⌨ ' + typed.join('');
        clearTimeout(kt); kt = setTimeout(() => { typed = []; keys.textContent = ''; }, 1500);
      }, true);
      window.__rec = { caption: t => { cap.textContent = t || ''; store.set(t || ''); } };
      cap.textContent = store.get();
    };
    document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
  };
  await page.addInitScript(init);
  await page.evaluate(init);
}
