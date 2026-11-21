import { CalorieCalculatorModel } from '../../domain/models/CalorieCalculatorModel.js';
import { FormatUtils } from '../../domain/utils/FormatUtils.js';

/**
 * Controller da Aba "Semana" (Análises, Balanço Empurrar/Puxar e Volume 7 Dias)
 */
export class WeekViewController {
  constructor(storageAdapter, readinessService, exerciseService, bottomSheet) {
    this._storage = storageAdapter;
    this._readinessService = readinessService;
    this._exerciseService = exerciseService;
    this._sheet = bottomSheet;
  }

  init() {
    const vSemana = document.querySelector('#v-semana');
    if (vSemana) {
      vSemana.addEventListener('click', e => {
        const calInfoBtn = e.target.closest('[data-calinfo]');
        if (calInfoBtn) {
          this.openCalorieExplanationModal();
        }
      });
    }
  }

  render() {
    const report = this._readinessService.getWeeklyVolumeReport();
    const forgotten = this._readinessService.getForgottenMusclesReport();
    const state = this._storage.loadState();

    // 1. Box de Calorias e Resumo
    const kcBox = document.querySelector('#kcBox');
    if (kcBox) {
      const weightKg = Number(state.peso) || this._storage.getCrossAppWeight() || 80;
      kcBox.innerHTML = `
        <div class="kc glass">
          <div><small>Calorias</small><b class="num">${FormatUtils.formatNumber(report.totalCalories7Days)} kcal</b></div>
          <div><small>Treinos</small><b class="num">${report.recentWorkoutsCount}</b></div>
          <div><small>MET Médio</small><b class="num">${FormatUtils.formatNumber(state.met || 3.5, 1)}</b></div>
        </div>
        <p class="note" style="margin-top:8px">
          Estimativa: MET ${FormatUtils.formatNumber(state.met || 3.5, 1)} × ${FormatUtils.formatNumber(weightKg, 1)} kg × tempo de treino.
          <button type="button" class="link" data-calinfo="1" style="padding:0;margin-left:4px">Como calculamos</button>
        </p>
      `;
    }

    // 2. Séries por Grupo (Faixa tracejada 10 a 20 séries)
    const volEl = document.querySelector('#vol');
    if (volEl) {
      const groups = Object.entries(report.groupSets || {});
      if (!groups.length) {
        volEl.innerHTML = '<p class="note" style="padding:10px">Nenhum treino registrado nos últimos 7 dias.</p>';
      } else {
        volEl.innerHTML = groups.map(([grp, sets]) => {
          const pct = Math.min(100, Math.round((sets / 20) * 100));
          return `
            <div style="margin-bottom:8px">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
                <span>${FormatUtils.escapeHtml(grp)}</span>
                <b>${sets} séries</b>
              </div>
              <div style="height:8px;background:var(--surface-2);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${pct}%;background:${sets >= 10 ? 'var(--ok)' : 'var(--warn)'}"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 3. Balanço Empurrar × Puxar
    const balBox = document.querySelector('#balBox');
    if (balBox) {
      const push = report.pushSets || 0;
      const pull = report.pullSets || 0;
      const total = push + pull || 1;
      const pushPct = Math.round((push / total) * 100);
      const pullPct = Math.round((pull / total) * 100);

      balBox.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
          <span>Empurrar: <b>${push} séries</b> (${pushPct}%)</span>
          <span>Puxar: <b>${pull} séries</b> (${pullPct}%)</span>
        </div>
        <div style="height:10px;display:flex;border-radius:5px;overflow:hidden">
          <div style="width:${pushPct}%;background:var(--info)"></div>
          <div style="width:${pullPct}%;background:var(--accent)"></div>
        </div>
      `;
    }

    // 4. Músculos sem treino há mais de 14 dias
    const esqEl = document.querySelector('#esq');
    if (esqEl) {
      if (!forgotten.length) {
        esqEl.innerHTML = '<p class="note" style="padding:10px">Todos os músculos receberam estímulo recente.</p>';
      } else {
        esqEl.innerHTML = forgotten.slice(0, 8).map(item => `
          <div style="padding:6px 12px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;font-size:13px">
            <span>${FormatUtils.escapeHtml(item.muscle.n)}</span>
            <small style="color:var(--bad)">${item.daysSince ? item.daysSince + ' dias atrás' : 'Nunca estimulado'}</small>
          </div>
        `).join('');
      }
    }
  }

  openCalorieExplanationModal() {
    const content = `
      <h3 style="margin-top:0">Como calculamos as calorias</h3>
      <p style="font-size:13px;color:var(--soft)">O cálculo baseia-se no Compêndio de Atividades Físicas (Herrmann SD et al., 2024):</p>
      <div class="glass pad" style="font-family:var(--font-mono);font-size:12px;margin:12px 0">
        kcal = MET × Peso (kg) × Duração (min) / 60
      </div>
      <table style="width:100%;font-size:12px;border-collapse:collapse;margin:12px 0">
        <tr style="border-bottom:1px solid var(--line);text-align:left">
          <th style="padding:6px">MET</th>
          <th style="padding:6px">Classificação</th>
          <th style="padding:6px">Exemplo</th>
        </tr>
        <tr style="border-bottom:1px solid var(--line)">
          <td style="padding:6px"><b>3.5</b></td>
          <td style="padding:6px">Leve</td>
          <td style="padding:6px">Musculação padrão com descansos normais</td>
        </tr>
        <tr style="border-bottom:1px solid var(--line)">
          <td style="padding:6px"><b>5.0</b></td>
          <td style="padding:6px">Moderado</td>
          <td style="padding:6px">Compostos pesados (Supino, Agachamento, Terra)</td>
        </tr>
        <tr>
          <td style="padding:6px"><b>6.0</b></td>
          <td style="padding:6px">Vigoroso</td>
          <td style="padding:6px">Circuitos intensos e descanso curto</td>
        </tr>
      </table>
      <button type="button" class="btn pri block" id="btnCloseCalInfo">Entendido</button>
    `;

    this._sheet.open(content);
    const btn = document.querySelector('#btnCloseCalInfo');
    if (btn) {
      btn.onclick = () => this._sheet.close();
    }
  }
}
