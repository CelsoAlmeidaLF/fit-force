import { APP_ICON } from '../assets/AppIcon.js';
import { PinPad } from '../components/PinPad.js';
import { BiometricsAdapter } from '../../infrastructure/security/BiometricsAdapter.js';
import { SecurityRecoveryService } from '../../infrastructure/security/SecurityRecoveryService.js';

/**
 * Controller Central da Aplicação (Navegação, Ciclo de Vida, Coordenação de Views e Bloqueio por PIN)
 */
export class AppController {
  constructor({
    todayController,
    musclesController,
    trainingController,
    weekController,
    settingsController,
    restTimerService,
    bottomSheet,
    toast
  }) {
    this._today = todayController;
    this._muscles = musclesController;
    this._training = trainingController;
    this._week = weekController;
    this._settings = settingsController;
    this._timer = restTimerService;
    this._sheet = bottomSheet;
    this._toast = toast;

    this._storage = this._settings._storage;
    this._currentTab = 'hoje';
    this._unlocked = false;
  }

  init() {
    // 1. Inicializar Ícone da Aplicação
    const appIconEl = document.querySelector('#appIc');
    if (appIconEl) {
      appIconEl.src = APP_ICON;
    }

    // 2. Inicializar Subcontrollers
    this._today.init();
    this._muscles.init();
    this._training.init();
    this._week.init();
    this._settings.init();

    // 3. Configurar Navegação por Abas e Hash
    window.addEventListener('hashchange', () => this.handleHashChange());
    const navLinks = document.querySelectorAll('nav a[data-v]');
    navLinks.forEach(link => {
      link.addEventListener('click', e => {
        const view = link.dataset.v;
        if (view) {
          window.location.hash = view;
        }
      });
    });

    // 4. Observar Cronômetro de Descanso
    this._timer.subscribe(timerState => {
      this.handleTimerTick(timerState);
    });

    // 5. Carga Inicial
    this.handleHashChange();

    // 6. Verificação de Bloqueio por PIN (Proteção contra Olhares Curiosos)
    this.checkAppLock();
  }

  checkAppLock() {
    const state = this._storage.loadState();
    const lockEl = document.querySelector('#lock');
    if (!lockEl) return;

    // Se o usuário possui PIN configurado e o bloqueio está ativo
    if (state.pin && state.lockEnabled !== false && !this._unlocked) {
      lockEl.hidden = false;
      const box = lockEl.querySelector('.lockc');
      if (box) {
        PinPad.render(box, {
          mode: 'verify',
          title: 'Fit Força',
          sub: 'Digite seu PIN para desbloquear.',
          len: state.pinLen,
          bio: !!state.bio,
          onBio: async () => {
            const ok = await BiometricsAdapter.authenticateBiometrics(state.bio);
            if (ok) {
              this._unlocked = true;
              lockEl.hidden = true;
              PinPad.clearActive();
              this._toast.show('Acesso biométrico confirmado.');
            }
          },
          check: async v => {
            const h = await BiometricsAdapter.hashPin(v);
            return h === state.pin;
          },
          onOk: () => {
            this._unlocked = true;
            lockEl.hidden = true;
            PinPad.clearActive();
            this._toast.show('Acesso liberado.');
          },
          onForgot: () => this.promptRecoverPin(state, lockEl)
        });
      }
    } else {
      lockEl.hidden = true;
    }
  }

  promptRecoverPin(state, lockEl) {
    this._sheet.open(`
      <h3 style="margin-top:0">Recuperação de Acesso</h3>
      <p style="font-size:13px;color:var(--soft);margin-bottom:12px">
        Cole as suas 12 palavras na ordem correta ou digite o código Hash de 12 caracteres do seu Certificado de Segurança:
      </p>

      <div class="f" style="margin-bottom:12px">
        <textarea id="inpRecoverySecret" rows="3" style="width:100%;resize:none;font-family:monospace;font-size:13px" placeholder="ex: borbulha lotado gradual ... ou XXXX-XXXX-XXXX" spellcheck="false" autocomplete="off"></textarea>
      </div>

      <div id="recError" style="color:var(--bad);font-size:12px;margin-bottom:12px;min-height:16px"></div>

      <button type="button" class="btn pri block" id="btnValidateRecovery">Validar e Redefinir PIN</button>
      <button type="button" class="btn sec block" id="btnCancelRecovery" style="margin-top:8px">Voltar</button>
    `);

    const btnCancel = document.querySelector('#btnCancelRecovery');
    if (btnCancel) {
      btnCancel.onclick = () => {
        this._sheet.close();
        this.checkAppLock();
      };
    }

    const btnValidate = document.querySelector('#btnValidateRecovery');
    if (btnValidate) {
      btnValidate.onclick = async () => {
        const inp = document.querySelector('#inpRecoverySecret');
        const errEl = document.querySelector('#recError');
        if (!inp) return;

        const val = inp.value.trim();
        const res = await SecurityRecoveryService.verifyRecoveryInput(val, state.seedHash, state.seedWords);

        if (!res.ok) {
          if (errEl) errEl.textContent = res.message || 'Segredo incorreto.';
          return;
        }

        // Segredo válido! Permite criar um novo PIN imediatamente
        this._sheet.open(`
          <h3 style="margin-top:0;color:var(--accent)">Segredo Validado!</h3>
          <p style="font-size:13px;color:var(--soft)">Defina seu novo PIN de 4 a 6 dígitos:</p>
          <div id="pinBoxNew"></div>
        `);

        const boxNew = document.querySelector('#pinBoxNew');
        if (boxNew) {
          PinPad.renderCreationFlow(boxNew, {
            onDone: async newPin => {
              state.pin = await BiometricsAdapter.hashPin(newPin);
              state.pinLen = newPin.length;
              state.lockEnabled = true;
              this._storage.saveState(state);

              this._unlocked = true;
              if (lockEl) lockEl.hidden = true;
              PinPad.clearActive();
              this._sheet.close();
              this._toast.show('Novo PIN redefinido com sucesso! Acesso liberado.');
            }
          });
        }
      };
    }
  }

  handleHashChange() {
    const rawHash = (window.location.hash || '#hoje').replace('#', '').trim();
    const validTabs = ['hoje', 'musculos', 'treino', 'semana', 'config'];
    const activeTab = validTabs.includes(rawHash) ? rawHash : 'hoje';

    this._currentTab = activeTab;

    // Atualizar Barra Inferior
    document.querySelectorAll('nav a[data-v]').forEach(a => {
      a.classList.toggle('on', a.dataset.v === activeTab);
    });

    // Atualizar Botão Gear no Topo
    const gearBtn = document.querySelector('#gear');
    if (gearBtn) {
      gearBtn.classList.toggle('on', activeTab === 'config');
    }

    // Alternar Seções com classe .on e display
    validTabs.forEach(tab => {
      const section = document.querySelector(`#v-${tab}`);
      if (section) {
        const isMatch = tab === activeTab;
        section.classList.toggle('on', isMatch);
        section.style.display = isMatch ? 'block' : 'none';
      }
    });

    window.scrollTo({ top: 0, behavior: 'instant' });

    // Chamar render da View ativa
    if (activeTab === 'hoje') {
      this._today.render();
    } else if (activeTab === 'musculos') {
      this._muscles.render();
    } else if (activeTab === 'treino') {
      this._training.render();
    } else if (activeTab === 'semana') {
      this._week.render();
    } else if (activeTab === 'config') {
      this._settings.render();
    }
  }

  handleTimerTick(timerState) {
    let timerBar = document.querySelector('#activeTimerBar');
    if (timerState.isRunning) {
      if (!timerBar) {
        timerBar = document.createElement('div');
        timerBar.id = 'activeTimerBar';
        timerBar.style.cssText = 'position:fixed;top:60px;left:16px;right:16px;background:var(--accent);color:#0E1210;padding:8px 16px;border-radius:20px;font-weight:700;display:flex;justify-content:space-between;align-items:center;z-index:90;box-shadow:0 4px 12px rgba(0,0,0,0.3)';
        document.body.appendChild(timerBar);
      }
      timerBar.innerHTML = `
        <span>Descanso: <b>${timerState.formatted}</b></span>
        <button type="button" class="btn sm" id="btnCancelTimer" style="background:#0E1210;color:#fff;padding:2px 8px;border:none">Pular</button>
      `;
      const btnSkip = timerBar.querySelector('#btnCancelTimer');
      if (btnSkip) {
        btnSkip.onclick = () => this._timer.stop();
      }
    } else if (timerBar) {
      timerBar.remove();
    }
  }
}
