import { MUSCLE_CATALOG, MUSCLE_BY_ID } from '../../domain/catalogs/MuscleCatalog.js';
import { MUSCLE_CATEGORIES } from '../../domain/catalogs/ExerciseCatalog.js';
import { HevyMuscleRenderer } from '../components/HevyMuscleRenderer.js';
import { MuscleRecoveryModel } from '../../domain/models/MuscleRecoveryModel.js';
import { FormatUtils } from '../../domain/utils/FormatUtils.js';

/**
 * Controller da Aba "Músculos" (Catálogo Anatômico dos 41 Músculos e Ficha Detalhada)
 */
export class MusclesViewController {
  constructor(storageAdapter, readinessService, exerciseService, bottomSheet, toast) {
    this._storage = storageAdapter;
    this._readinessService = readinessService;
    this._exerciseService = exerciseService;
    this._sheet = bottomSheet;
    this._toast = toast;
    this._currentCategory = 'all';
    this._currentQuery = '';
  }

  init() {
    const searchInput = document.querySelector('#mq');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        this._currentQuery = e.target.value || '';
        this.render();
      });
    }

    const catTabs = document.querySelector('#catTabs');
    if (catTabs) {
      catTabs.innerHTML = `
        <div class="tabs" role="tablist">
          ${MUSCLE_CATEGORIES.map(([id, label]) => `
            <button type="button" class="${id === this._currentCategory ? 'on' : ''}" data-cat="${id}">${label}</button>
          `).join('')}
        </div>
      `;
      catTabs.addEventListener('click', e => {
        const btn = e.target.closest('button[data-cat]');
        if (!btn) return;
        catTabs.querySelectorAll('button').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        this._currentCategory = btn.dataset.cat;
        this.render();
      });
    }

    const mgrid = document.querySelector('#mgrid');
    if (mgrid) {
      mgrid.addEventListener('click', e => {
        const card = e.target.closest('.mcard[data-mus]');
        if (card) {
          this.openMuscleDetailSheet(card.dataset.mus);
        }
      });
    }
  }

  render() {
    const state = this._storage.loadState();
    const fatigue = this._readinessService.getFatigueMap();
    const query = FormatUtils.normalizeText(this._currentQuery);

    const filteredMuscles = MUSCLE_CATALOG.filter(m => {
      const matchCat = this._currentCategory === 'all' || m.c === this._currentCategory;
      if (!matchCat) return false;
      if (!query) return true;

      const exNames = this._exerciseService.getExercisesForMuscle(m.id).map(e => e.name).join(' ');
      const searchTarget = FormatUtils.normalizeText(`${m.n} ${m.r} ${m.c} ${exNames}`);
      return searchTarget.includes(query);
    });

    const mcnt = document.querySelector('#mcnt');
    if (mcnt) {
      mcnt.textContent = `${filteredMuscles.length} músculo${filteredMuscles.length === 1 ? '' : 's'}`;
    }

    const mgrid = document.querySelector('#mgrid');
    if (mgrid) {
      if (!filteredMuscles.length) {
        mgrid.innerHTML = '<p class="note" style="grid-column:1/-1">Nenhum músculo encontrado para esta busca.</p>';
        return;
      }

      mgrid.innerHTML = filteredMuscles.map(m => {
        const st = MuscleRecoveryModel.getMuscleStatus(m.id, fatigue, state.stO);
        const stIconSvg = MuscleRecoveryModel.getStatusIconSvg(st.key);
        const muscle2dSvg = HevyMuscleRenderer.renderMiniCard(m.reg, st.key);
        return `
          <button type="button" class="mcard" data-mus="${m.id}">
            <div class="mimg" style="background:transparent;border:none;overflow:visible">
              ${muscle2dSvg}
              <span class="st"><span class="sti k-${st.key}">${stIconSvg}</span></span>
            </div>
            <b>${FormatUtils.escapeHtml(m.n)}</b>
            <small>${st.label}</small>
          </button>
        `;
      }).join('');
    }
  }

  openMuscleDetailSheet(muscleId) {
    const muscle = MUSCLE_BY_ID[muscleId];
    if (!muscle) return;

    const state = this._storage.loadState();
    const fatigue = this._readinessService.getFatigueMap();
    const st = MuscleRecoveryModel.getMuscleStatus(muscle.id, fatigue, state.stO);
    const exercises = this._exerciseService.getExercisesForMuscle(muscle.id);
    const stIconSvg = MuscleRecoveryModel.getStatusIconSvg(st.key);
    const detail2dSvg = HevyMuscleRenderer.renderMiniCard(muscle.reg, st.key);

    const content = `
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px">
        <div style="width:72px;height:96px;flex:none;background:var(--surface-2);border-radius:10px;padding:4px;border:1px solid var(--line);display:flex;align-items:center;justify-content:center">
          ${detail2dSvg}
        </div>
        <div>
          <h3 style="margin:0">${FormatUtils.escapeHtml(muscle.n)}</h3>
          <div style="font-size:13px;color:var(--soft)">${FormatUtils.escapeHtml(muscle.c)} · ${FormatUtils.escapeHtml(muscle.r)}</div>
          <div style="margin-top:6px;display:flex;align-items:center;gap:6px"><span class="sti k-${st.key}">${stIconSvg}</span> <b>${st.label}</b></div>
        </div>
      </div>

      <p style="font-size:13px;line-height:1.4">${FormatUtils.escapeHtml(muscle.d || '')}</p>
      ${muscle.dica ? `<div class="glass pad" style="font-size:12px;margin:10px 0"><b>Dica:</b> ${FormatUtils.escapeHtml(muscle.dica)}</div>` : ''}

      <div style="margin:16px 0">
        <h4 style="margin:0 0 8px">Ajuste manual de prontidão</h4>
        <div style="display:flex;gap:8px">
          <button type="button" class="btn sm sec" id="btnStReady">Pronto</button>
          <button type="button" class="btn sm sec" id="btnStWarn">Quase pronto</button>
          <button type="button" class="btn sm sec" id="btnStBad">Recuperando</button>
          ${st.isManual ? `<button type="button" class="btn sm" id="btnStClear">Automático</button>` : ''}
        </div>
      </div>

      <div>
        <h4 style="margin:16px 0 8px">Exercícios associados (${exercises.length})</h4>
        <div style="max-height:180px;overflow-y:auto">
          ${exercises.map(e => `
            <div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:13px;display:flex;justify-content:space-between">
              <span>${FormatUtils.escapeHtml(e.name)}</span>
              <small style="color:var(--soft)">${e.isPrimaryFor(muscle) ? 'Principal' : 'Sinérgico'}</small>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this._sheet.open(content);

    const btnReady = document.querySelector('#btnStReady');
    if (btnReady) {
      btnReady.onclick = () => {
        this._readinessService.setManualOverride(muscle.id, 'ok');
        this._sheet.close();
        this.render();
        this._toast.show(`Status de ${muscle.n} ajustado para Pronto.`);
      };
    }

    const btnWarn = document.querySelector('#btnStWarn');
    if (btnWarn) {
      btnWarn.onclick = () => {
        this._readinessService.setManualOverride(muscle.id, 'warn');
        this._sheet.close();
        this.render();
        this._toast.show(`Status de ${muscle.n} ajustado para Quase pronto.`);
      };
    }

    const btnBad = document.querySelector('#btnStBad');
    if (btnBad) {
      btnBad.onclick = () => {
        this._readinessService.setManualOverride(muscle.id, 'bad');
        this._sheet.close();
        this.render();
        this._toast.show(`Status de ${muscle.n} ajustado para Recuperando.`);
      };
    }

    const btnClear = document.querySelector('#btnStClear');
    if (btnClear) {
      btnClear.onclick = () => {
        this._readinessService.clearManualOverride(muscle.id);
        this._sheet.close();
        this.render();
        this._toast.show(`Status de ${muscle.n} restaurado para cálculo automático.`);
      };
    }
  }
}
