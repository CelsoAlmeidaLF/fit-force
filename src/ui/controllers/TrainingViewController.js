import { PlateCalculatorModel } from '../../domain/models/PlateCalculatorModel.js';
import { CalorieCalculatorModel } from '../../domain/models/CalorieCalculatorModel.js';
import { FormatUtils } from '../../domain/utils/FormatUtils.js';

/**
 * Controller da Aba "Treino" (Planejamento, Execução em Tempo Real e Histórico)
 */
export class TrainingViewController {
  constructor(storageAdapter, workoutService, exerciseService, restTimerService, bottomSheet, toast) {
    this._storage = storageAdapter;
    this._workoutService = workoutService;
    this._exerciseService = exerciseService;
    this._timer = restTimerService;
    this._sheet = bottomSheet;
    this._toast = toast;

    this._activeSubtab = 'hoje'; // 'hoje' | 'fichas' | 'hist' | 'ex'
    this._isLiveTraining = false;
    this._liveStartTime = 0;
  }

  init() {
    // Delegar cliques de subabas
    const navSubtabs = document.querySelectorAll('[data-tv]');
    navSubtabs.forEach(btn => {
      btn.addEventListener('click', e => {
        this._activeSubtab = btn.dataset.tv;
        this.render();
      });
    });

    const planEl = document.querySelector('#plan');
    if (planEl) {
      planEl.addEventListener('click', e => this.handlePlanClick(e));
    }

    const planActEl = document.querySelector('#planAct');
    if (planActEl) {
      planActEl.addEventListener('click', e => this.handlePlanActions(e));
    }

    const addBox = document.querySelector('#addBox');
    if (addBox) {
      addBox.innerHTML = `
        <button type="button" class="btn sec block" id="btnAddExToPlan">
          <span class="ms" aria-hidden="true">add</span> Adicionar exercício
        </button>
      `;
      const btnAdd = addBox.querySelector('#btnAddExToPlan');
      if (btnAdd) {
        btnAdd.onclick = () => this.openAddExerciseSheet();
      }
    }
  }

  render() {
    const subtabs = ['hoje', 'fichas', 'hist', 'ex'];
    subtabs.forEach(tab => {
      const el = document.querySelector(`#tv-${tab}`);
      if (el) {
        el.style.display = tab === this._activeSubtab ? 'block' : 'none';
      }
    });

    if (this._activeSubtab === 'hoje') {
      this.renderPlanView();
    } else if (this._activeSubtab === 'hist') {
      this.renderHistoryView();
    } else if (this._activeSubtab === 'fichas') {
      this.renderFichasView();
    } else if (this._activeSubtab === 'ex') {
      this.renderExercisesView();
    }
  }

  renderPlanView() {
    const state = this._storage.loadState();
    const plan = state.plan || [];
    const planEl = document.querySelector('#plan');
    const planActEl = document.querySelector('#planAct');

    if (!planEl || !planActEl) return;

    if (!plan.length) {
      planEl.innerHTML = '<p class="note">Nenhum exercício no plano de hoje. Adicione exercícios ou carregue uma ficha.</p>';
      planActEl.innerHTML = '';
      return;
    }

    if (!this._isLiveTraining) {
      // Modo Planejamento
      planEl.innerHTML = plan.map((p, idx) => {
        const ex = this._exerciseService.getExerciseByName(p.n);
        return `
          <div class="exrow" data-idx="${idx}">
            <div class="t">
              <b>${FormatUtils.escapeHtml(p.n)}</b>
              <small>${ex ? FormatUtils.escapeHtml(ex.defaultSeriesRaw) : ''}</small>
            </div>
            <div class="stp2">
              <button type="button" data-action="dec-sets" data-idx="${idx}"><span class="ms" aria-hidden="true">remove</span></button>
              <b class="num">${p.sets}×</b>
              <button type="button" data-action="inc-sets" data-idx="${idx}"><span class="ms" aria-hidden="true">add</span></button>
            </div>
            <button type="button" class="del" data-action="del-plan" data-idx="${idx}"><span class="ms" aria-hidden="true">close</span></button>
          </div>
        `;
      }).join('');

      planActEl.innerHTML = `
        <div style="display:flex;gap:10px;margin-top:16px">
          <button type="button" class="btn pri flex1" id="btnStartWorkout">Iniciar treino</button>
          <button type="button" class="btn sec" id="btnClearPlan">Limpar</button>
        </div>
      `;
    } else {
      // Modo Execução ao Vivo
      const active = this._workoutService.getActiveSession();
      if (!active) {
        this._isLiveTraining = false;
        this.renderPlanView();
        return;
      }

      planEl.innerHTML = active.exercises.map((ex, exIdx) => `
        <div class="glass pad" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong>${FormatUtils.escapeHtml(ex.name)}</strong>
            <button type="button" class="link sm" data-action="open-plates" data-exidx="${exIdx}">Anilhas</button>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${ex.sets.map((set, sIdx) => `
              <div style="display:flex;align-items:center;gap:8px;font-size:13px">
                <span style="width:24px;color:var(--soft)">#${sIdx + 1}</span>
                <input type="number" class="f-in sm" style="width:70px" value="${set.kg || ''}" placeholder="kg" data-exidx="${exIdx}" data-sidx="${sIdx}" data-field="kg">
                <input type="number" class="f-in sm" style="width:60px" value="${set.reps || ''}" placeholder="reps" data-exidx="${exIdx}" data-sidx="${sIdx}" data-field="reps">
                <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
                  <input type="checkbox" ${set.done ? 'checked' : ''} data-action="toggle-set" data-exidx="${exIdx}" data-sidx="${sIdx}">
                  <span>Feito</span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');

      planActEl.innerHTML = `
        <div style="display:flex;gap:10px;margin-top:16px">
          <button type="button" class="btn pri flex1" id="btnFinishWorkout">Concluir treino</button>
          <button type="button" class="btn sec" id="btnCancelWorkout">Cancelar</button>
        </div>
      `;
    }
  }

  handlePlanClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const idx = Number(btn.dataset.idx);
    const state = this._storage.loadState();

    if (action === 'inc-sets') {
      if (state.plan[idx]) {
        state.plan[idx].sets = Math.min(10, (state.plan[idx].sets || 3) + 1);
        this._storage.saveState(state);
        this.renderPlanView();
      }
    } else if (action === 'dec-sets') {
      if (state.plan[idx]) {
        state.plan[idx].sets = Math.max(1, (state.plan[idx].sets || 3) - 1);
        this._storage.saveState(state);
        this.renderPlanView();
      }
    } else if (action === 'del-plan') {
      state.plan.splice(idx, 1);
      this._storage.saveState(state);
      this.renderPlanView();
    } else if (action === 'open-plates') {
      this.openPlateCalculator();
    }
  }

  handlePlanActions(e) {
    const btnStart = e.target.closest('#btnStartWorkout');
    if (btnStart) {
      const state = this._storage.loadState();
      this._workoutService.startSession(state.plan, state.met || 3.5);
      this._isLiveTraining = true;
      this._liveStartTime = Date.now();
      this.renderPlanView();
      this._toast.show('Treino iniciado! Registre as séries concluídas.');
      return;
    }

    const btnClear = e.target.closest('#btnClearPlan');
    if (btnClear) {
      const state = this._storage.loadState();
      state.plan = [];
      this._storage.saveState(state);
      this.renderPlanView();
      this._toast.show('Plano de treino limpo.');
      return;
    }

    const btnFinish = e.target.closest('#btnFinishWorkout');
    if (btnFinish) {
      this.finishActiveWorkout();
      return;
    }

    const btnCancel = e.target.closest('#btnCancelWorkout');
    if (btnCancel) {
      this._workoutService.cancelActiveSession();
      this._isLiveTraining = false;
      this.renderPlanView();
      this._toast.show('Treino cancelado.');
    }
  }

  finishActiveWorkout() {
    const durationMinutes = Math.max(1, Math.round((Date.now() - this._liveStartTime) / 60000));
    const state = this._storage.loadState();
    const weightKg = Number(state.peso) || this._storage.getCrossAppWeight() || 80;

    const completed = this._workoutService.finishSession(durationMinutes, weightKg);
    this._isLiveTraining = false;
    this.renderPlanView();

    const summaryContent = `
      <div style="text-align:center;padding:12px 0">
        <h3 style="margin-top:0">Treino Concluído!</h3>
        <p style="color:var(--soft)">Duração: <b>${durationMinutes} min</b> · Gasto: <b>${completed.caloriesBurned} kcal</b></p>
        <div style="font-size:24px;font-weight:700;color:var(--ok);margin:16px 0">${completed.totalSetsCount} séries registradas</div>
        <button type="button" class="btn pri block" id="btnCloseSummary">Fechar</button>
      </div>
    `;

    this._sheet.open(summaryContent);
    const btnClose = document.querySelector('#btnCloseSummary');
    if (btnClose) {
      btnClose.onclick = () => this._sheet.close();
    }
  }

  openPlateCalculator() {
    const content = `
      <h3 style="margin-top:0">Calculadora de Anilhas</h3>
      <p style="font-size:13px;color:var(--soft)">Descubra a combinação ideal de anilhas para cada lado da barra (barra olímpica 20 kg).</p>
      <div style="display:flex;gap:10px;align-items:center;margin:16px 0">
        <label style="font-weight:600">Carga total:</label>
        <input type="number" id="inpPlateTotal" class="f-in" style="width:100px" value="60" step="2.5">
        <span>kg</span>
      </div>
      <div id="plateResultBox" class="glass pad" style="min-height:50px"></div>
    `;

    this._sheet.open(content);

    const inp = document.querySelector('#inpPlateTotal');
    const resBox = document.querySelector('#plateResultBox');

    const updatePlates = () => {
      const targetKg = Number(inp ? inp.value : 60);
      const res = PlateCalculatorModel.calculatePlates(targetKg, 20);

      if (targetKg < 20) {
        resBox.innerHTML = '<span style="color:var(--bad)">A carga mínima é o peso da barra (20 kg).</span>';
        return;
      }

      if (!res.plates.length) {
        resBox.innerHTML = '<span>Somente a barra pura (20 kg), sem anilhas.</span>';
        return;
      }

      resBox.innerHTML = `
        <div><b>Cada lado da barra:</b></div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">
          ${res.plates.map(p => `
            <span class="badge" style="background:var(--surface-2);border:1px solid var(--line);padding:4px 8px;border-radius:4px">
              ${p.count}× <b>${p.kg} kg</b>
            </span>
          `).join('')}
        </div>
        <div style="font-size:12px;color:var(--soft);margin-top:8px">Total atingido: ${res.achievedTotalKg} kg (${res.perSideTotalKg} kg por lado)</div>
      `;
    };

    if (inp) inp.addEventListener('input', updatePlates);
    updatePlates();
  }

  openAddExerciseSheet() {
    const exercises = this._exerciseService.getAllExercises();
    const content = `
      <h3 style="margin-top:0">Adicionar exercício ao plano</h3>
      <input type="text" id="inpSearchExPlan" class="f-in block" placeholder="Buscar exercício..." style="margin-bottom:12px">
      <div id="listAddExPlan" style="max-height:260px;overflow-y:auto">
        ${exercises.slice(0, 30).map(e => `
          <div class="exrow" style="cursor:pointer" data-addex="${FormatUtils.escapeHtml(e.name)}">
            <div class="t">
              <b>${FormatUtils.escapeHtml(e.name)}</b>
              <small>${FormatUtils.escapeHtml(e.group)} · ${FormatUtils.escapeHtml(e.defaultSeriesRaw)}</small>
            </div>
            <button type="button" class="btn sm pri" data-addex="${FormatUtils.escapeHtml(e.name)}">Adicionar</button>
          </div>
        `).join('')}
      </div>
    `;

    this._sheet.open(content);

    const listContainer = document.querySelector('#listAddExPlan');
    if (listContainer) {
      listContainer.onclick = e => {
        const target = e.target.closest('[data-addex]');
        if (target) {
          const exName = target.dataset.addex;
          const state = this._storage.loadState();
          state.plan = state.plan || [];
          state.plan.push({ n: exName, sets: 3 });
          this._storage.saveState(state);
          this._sheet.close();
          this.renderPlanView();
          this._toast.show(`${exName} adicionado ao plano.`);
        }
      };
    }
  }

  renderHistoryView() {
    const state = this._storage.loadState();
    const histEl = document.querySelector('#hist');
    const hCnt = document.querySelector('#hCnt');
    if (!histEl) return;

    const log = state.log || [];
    if (hCnt) hCnt.textContent = `${log.length} treino${log.length === 1 ? '' : 's'}`;

    if (!log.length) {
      histEl.innerHTML = '<p class="note">Nenhum treino registrado no histórico.</p>';
      return;
    }

    histEl.innerHTML = log.map(w => {
      const d = new Date(w.t).toLocaleDateString('pt-BR');
      const setsCount = (w.ex || []).reduce((acc, e) => acc + (e.sets || []).length, 0);
      return `
        <div class="glass pad" style="margin-bottom:8px">
          <div style="display:flex;justify-content:space-between">
            <strong>${d}</strong>
            <small style="color:var(--soft)">${w.min || 0} min · ${w.kcal || 0} kcal</small>
          </div>
          <div style="font-size:12px;color:var(--soft);margin-top:4px">${(w.ex || []).length} exercício(s) · ${setsCount} séries</div>
        </div>
      `;
    }).join('');
  }

  renderFichasView() {
    const el = document.querySelector('#tv-fichas');
    if (!el) return;
    el.innerHTML = '<div class="glass pad"><p class="note">Módulo de Fichas (prescrições salvas). Carregue treinos predefinidos com 1 toque.</p></div>';
  }

  renderExercisesView() {
    const el = document.querySelector('#tv-ex');
    if (!el) return;
    const exercises = this._exerciseService.getAllExercises();
    el.innerHTML = `
      <div class="glass pad" style="margin-bottom:12px">
        <h4 style="margin-top:0">Banco de Exercícios (${exercises.length})</h4>
        <div style="max-height:300px;overflow-y:auto">
          ${exercises.map(e => `
            <div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:13px;display:flex;justify-content:space-between">
              <div>
                <b>${FormatUtils.escapeHtml(e.name)}</b>
                <div style="font-size:11px;color:var(--soft)">${FormatUtils.escapeHtml(e.group)}</div>
              </div>
              <small>${FormatUtils.escapeHtml(e.defaultSeriesRaw)}</small>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}
