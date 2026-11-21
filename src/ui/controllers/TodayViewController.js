import { SvgBodyRenderer } from '../components/SvgBodyRenderer.js';
import { MUSCLE_CATALOG } from '../../domain/catalogs/MuscleCatalog.js';
import { SPLIT_SUGGESTIONS } from '../../domain/catalogs/ExerciseCatalog.js';
import { MuscleRecoveryModel } from '../../domain/models/MuscleRecoveryModel.js';
import { FormatUtils } from '../../domain/utils/FormatUtils.js';

/**
 * Controller da Aba "Hoje" (Visão Geral de Prontidão e Sugestões)
 */
export class TodayViewController {
  constructor(storageAdapter, readinessService, exerciseService, bottomSheet, toast) {
    this._storage = storageAdapter;
    this._readinessService = readinessService;
    this._exerciseService = exerciseService;
    this._sheet = bottomSheet;
    this._toast = toast;
    this._currentView = 'front';
    this._currentSplit = 'push';
  }

  init() {
    const segContainer = document.querySelector('#vHojeSeg');
    if (segContainer) {
      segContainer.innerHTML = `
        <div class="seg" role="tablist">
          <button type="button" class="on" data-view="front">Frente</button>
          <button type="button" data-view="back">Costas</button>
        </div>
      `;
      segContainer.addEventListener('click', e => {
        const btn = e.target.closest('button[data-view]');
        if (!btn) return;
        segContainer.querySelectorAll('button').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        this._currentView = btn.dataset.view;
        this.renderBody();
      });
    }

    const stAllBtn = document.querySelector('#stAll');
    if (stAllBtn) {
      stAllBtn.addEventListener('click', () => this.openBatchAdjustModal());
    }

    const sugTabsContainer = document.querySelector('#sugTabs');
    if (sugTabsContainer) {
      sugTabsContainer.innerHTML = `
        <div class="seg" role="tablist">
          <button type="button" class="on" data-split="push">Push</button>
          <button type="button" data-split="pull">Pull</button>
          <button type="button" data-split="legs">Pernas</button>
          <button type="button" data-split="core">Core</button>
        </div>
      `;
      sugTabsContainer.addEventListener('click', e => {
        const btn = e.target.closest('button[data-split]');
        if (!btn) return;
        sugTabsContainer.querySelectorAll('button').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        this._currentSplit = btn.dataset.split;
        this.renderSuggestions();
      });
    }
  }

  render() {
    const state = this._storage.loadState();
    const fatigue = this._readinessService.getFatigueMap();

    // 1. Contador de Músculos por Estado
    const counts = { ok: 0, warn: 0, bad: 0, new: 0 };
    MUSCLE_CATALOG.forEach(m => {
      const st = MuscleRecoveryModel.getMuscleStatus(m.id, fatigue, state.stO);
      counts[st.key]++;
    });

    const rkEl = document.querySelector('#rk');
    if (rkEl) {
      const labels = [
        ['ok', 'Prontos'],
        ['warn', 'Quase prontos'],
        ['bad', 'Recuperando'],
        ['new', 'Sem registro']
      ];
      rkEl.innerHTML = labels.map(([k, l]) => `
        <div>
          <span class="sti k-${k}"><span class="ms" aria-hidden="true">${MuscleRecoveryModel.STATUS_ICONS[k]}</span></span>
          <b class="num">${counts[k]}</b>
          <small>${l}</small>
        </div>
      `).join('');
    }

    // 2. Banner de Exemplo
    const sampleBox = document.querySelector('#sampleBox');
    if (sampleBox) {
      sampleBox.innerHTML = state.sample ? `
        <div class="sample">
          <span class="t">Mostrando 3 treinos de exemplo.</span>
          <button class="link" id="clrSampleBtn">Limpar exemplo</button>
        </div>
      ` : '';

      const clrBtn = document.querySelector('#clrSampleBtn');
      if (clrBtn) {
        clrBtn.addEventListener('click', () => {
          state.sample = false;
          state.log = [];
          this._storage.saveState(state);
          this.render();
          this._toast.show('Exemplo removido com sucesso.');
        });
      }
    }

    // 3. Renderizar Corpo e Sugestões
    this.renderBody();
    this.renderSuggestions();
  }

  renderBody() {
    const bodyHojeEl = document.querySelector('#bodyHoje');
    if (!bodyHojeEl) return;

    const state = this._storage.loadState();
    const fatigue = this._readinessService.getFatigueMap();
    const statusMap = {};

    MUSCLE_CATALOG.forEach(m => {
      statusMap[m.id] = MuscleRecoveryModel.getMuscleStatus(m.id, fatigue, state.stO);
    });

    bodyHojeEl.innerHTML = SvgBodyRenderer.renderFullInteractiveView(this._currentView, statusMap);
  }

  renderSuggestions() {
    const sugEl = document.querySelector('#sug');
    if (!sugEl) return;

    const muscleIds = SPLIT_SUGGESTIONS[this._currentSplit] || [];
    const state = this._storage.loadState();
    const fatigue = this._readinessService.getFatigueMap();

    const exercises = this._exerciseService.getAllExercises();
    const suggestedExercises = exercises.filter(e =>
      muscleIds.includes(e.primaryMuscleId) || (e.secondaryMuscleIds || []).some(m => muscleIds.includes(m))
    ).slice(0, 5);

    if (!suggestedExercises.length) {
      sugEl.innerHTML = '<p class="note">Nenhum exercício sugerido para este grupamento.</p>';
      return;
    }

    sugEl.innerHTML = `
      <div class="glass pad">
        <ul style="list-style:none;padding:0;margin:0">
          ${suggestedExercises.map(e => {
            const st = MuscleRecoveryModel.getMuscleStatus(e.primaryMuscleId, fatigue, state.stO);
            return `
              <li style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line)">
                <div>
                  <strong>${FormatUtils.escapeHtml(e.name)}</strong>
                  <div style="font-size:12px;color:var(--soft)">${FormatUtils.escapeHtml(e.defaultSeriesRaw)}</div>
                </div>
                <span class="sti k-${st.key}"><span class="ms" aria-hidden="true">${MuscleRecoveryModel.STATUS_ICONS[st.key]}</span></span>
              </li>
            `;
          }).join('')}
        </ul>
      </div>
    `;
  }

  openBatchAdjustModal() {
    const content = `
      <h3 style="margin-top:0">Ajustar prontidão de todos os músculos</h3>
      <p style="color:var(--soft);font-size:13px">Altere o estado de recuperação em massa caso tenha treinado fora do app ou descansado mais.</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
        <button type="button" class="btn pri" id="btnMarkAllReady">Marcar todos como prontos</button>
        <button type="button" class="btn sec" id="btnResetAllAuto">Voltar todos ao cálculo automático</button>
      </div>
    `;

    this._sheet.open(content);

    const markBtn = document.querySelector('#btnMarkAllReady');
    if (markBtn) {
      markBtn.onclick = () => {
        this._readinessService.setAllReady();
        this._sheet.close();
        this.render();
        this._toast.show('Todos os músculos marcados como prontos.');
      };
    }

    const resetBtn = document.querySelector('#btnResetAllAuto');
    if (resetBtn) {
      resetBtn.onclick = () => {
        this._readinessService.resetAllToAutomatic();
        this._sheet.close();
        this.render();
        this._toast.show('Prontidão restaurada para o cálculo automático.');
      };
    }
  }
}
