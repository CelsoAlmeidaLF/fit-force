import { APP_ICON } from '../assets/AppIcon.js';

/**
 * Componente Visual de Teclado Numérico Tátil Seguro (PIN Pad)
 * Padrão Zero-Knowledge para Fit Força · Proteção contra Olhares Curiosos
 */
export class PinPad {
  static activePad = null;
  static _listenerRegistered = false;

  static initGlobalKeyboardListener() {
    if (this._listenerRegistered) return;
    document.addEventListener('keydown', e => {
      if (!this.activePad || !document.body.contains(this.activePad) || this.activePad.offsetParent === null) {
        return;
      }
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (this.activePad._key) {
        this.activePad._key(e);
      }
    });
    this._listenerRegistered = true;
  }

  static render(containerEl, options = {}) {
    this.initGlobalKeyboardListener();
    let v = '';
    let busy = false;

    containerEl.innerHTML = `
      <div class="pp">
        ${options.logo === false ? '' : `<img class="appic sm" src="${APP_ICON}" alt="" style="width:52px;height:52px;margin:0 auto 10px;display:block">`}
        <h3 class="pp-t">${options.title || 'PIN de Acesso'}</h3>
        <p class="pp-s">${options.sub || 'Proteção contra olhares curiosos'}</p>
        <div class="pp-d">${'<i></i>'.repeat(6)}</div>
        <div class="pp-e" role="alert"></div>
        <div class="pp-k">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
            .map(n => `<button type="button" data-k="${n}">${n}</button>`)
            .join('')}
          ${
            options.bio
              ? '<button type="button" data-k="bio" class="fx" aria-label="Usar biometria"><span class="ms" aria-hidden="true">fingerprint</span></button>'
              : '<span></span>'
          }
          <button type="button" data-k="0">0</button>
          <button type="button" data-k="del" class="fx" aria-label="Apagar"><span class="ms" aria-hidden="true">backspace</span></button>
        </div>
        ${options.mode === 'create' ? '<button type="button" class="btn pri pp-ok" disabled style="width:100%;margin-top:8px">Continuar</button>' : ''}
        ${options.foot || ''}
        ${options.onForgot ? '<button type="button" class="link pp-forgot" style="margin-top:14px;background:none;border:none;color:var(--accent);font-size:12px;cursor:pointer;text-decoration:underline">Esqueci o PIN (Recuperar por 12 palavras)</button>' : ''}
      </div>
    `;

    const dots = [...containerEl.querySelectorAll('.pp-d i')];
    const err = containerEl.querySelector('.pp-e');
    const ok = containerEl.querySelector('.pp-ok');
    const dotBox = containerEl.querySelector('.pp-d');
    const btnForgot = containerEl.querySelector('.pp-forgot');

    if (btnForgot && options.onForgot) {
      btnForgot.onclick = () => options.onForgot();
    }

    const draw = () => {
      dots.forEach((d, i) => {
        d.className = i < v.length ? 'on' : '';
        d.style.display =
          (options.len && i >= options.len) || (!options.len && options.mode === 'verify' && i >= Math.max(4, v.length))
            ? 'none'
            : '';
      });
      if (ok) ok.disabled = v.length < 4;
    };

    const fail = m => {
      if (err) err.textContent = m;
      if (dotBox) {
        dotBox.classList.remove('shk');
        void dotBox.offsetWidth;
        dotBox.classList.add('shk');
      }
      try {
        if (navigator.vibrate) navigator.vibrate(90);
      } catch (e) {}
      v = '';
      draw();
    };

    const press = async k => {
      if (busy) return;
      if (k === 'bio') {
        if (options.onBio) options.onBio();
        return;
      }
      if (k === 'del') {
        v = v.slice(0, -1);
        if (err) err.textContent = '';
        draw();
        return;
      }
      if (v.length >= 6) return;
      v += k;
      if (err) err.textContent = '';
      draw();

      if (options.mode === 'verify' && v.length >= 4) {
        busy = true;
        const result = await options.check(v);
        busy = false;
        if (result) {
          options.onOk(v);
          return;
        }
        if (v.length >= (options.len || 6)) {
          fail(options.err || 'PIN incorreto. Tente novamente.');
        }
      }
    };

    const keyContainer = containerEl.querySelector('.pp-k');
    if (keyContainer) {
      keyContainer.onclick = e => {
        const btn = e.target.closest('[data-k]');
        if (btn) press(btn.dataset.k);
      };
    }

    if (ok) {
      ok.onclick = () => {
        if (v.length >= 4) options.onOk(v);
      };
    }

    containerEl._key = e => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter' && ok && !ok.disabled) ok.click();
    };

    this.activePad = containerEl;
    draw();
    return { fail };
  }

  static renderCreationFlow(containerEl, options = {}) {
    const startStepOne = msg => {
      this.render(containerEl, {
        mode: 'create',
        title: options.title || 'Crie seu PIN de 4 a 6 números',
        sub: options.sub || 'Protege suas séries e cargas contra olhares curiosos.',
        logo: options.logo,
        foot: options.foot,
        onOk: p1 => {
          this.render(containerEl, {
            mode: 'verify',
            len: p1.length,
            title: 'Confirme o PIN',
            sub: 'Digite o mesmo PIN novamente para salvar.',
            logo: options.logo,
            err: 'Os PINs digitados não conferem.',
            check: async v => v === p1,
            onOk: () => options.onDone(p1),
            foot: '<button type="button" class="link pp-back" style="margin-top:10px;background:none;border:none;color:var(--accent);cursor:pointer">Voltar</button>'
          });
          const backBtn = containerEl.querySelector('.pp-back');
          if (backBtn) backBtn.onclick = () => startStepOne();
        }
      });
      if (options.bindFoot) options.bindFoot(containerEl);
      if (msg && containerEl.querySelector('.pp-e')) containerEl.querySelector('.pp-e').textContent = msg;
    };
    startStepOne();
  }

  static clearActive() {
    this.activePad = null;
  }
}
