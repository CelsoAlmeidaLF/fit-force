import { APP_ICON } from '../assets/AppIcon.js';

/**
 * Controller Central da Aplicação (Navegação, Ciclo de Vida e Coordenação de Views)
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

    this._currentTab = 'hoje';
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
  }

  handleHashChange() {
    const rawHash = (window.location.hash || '#hoje').replace('#', '').trim();
    const validTabs = ['hoje', 'musculos', 'treino', 'semana'];
    const activeTab = validTabs.includes(rawHash) ? rawHash : 'hoje';

    this._currentTab = activeTab;

    // Atualizar Barra Inferior
    document.querySelectorAll('nav a[data-v]').forEach(a => {
      if (a.dataset.v === activeTab) {
        a.classList.add('on');
      } else {
        a.classList.remove('on');
      }
    });

    // Alternar Seções
    validTabs.forEach(tab => {
      const section = document.querySelector(`#v-${tab}`);
      if (section) {
        if (tab === activeTab) {
          section.style.display = 'block';
        } else {
          section.style.display = 'none';
        }
      }
    });

    // Chamar render da View ativa
    if (activeTab === 'hoje') {
      this._today.render();
    } else if (activeTab === 'musculos') {
      this._muscles.render();
    } else if (activeTab === 'treino') {
      this._training.render();
    } else if (activeTab === 'semana') {
      this._week.render();
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
