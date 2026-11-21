import { CsvExporterAdapter } from '../../infrastructure/export/CsvExporterAdapter.js';
import { FormatUtils } from '../../domain/utils/FormatUtils.js';

/**
 * Controller de Configurações e Preferências Globais
 */
export class SettingsViewController {
  constructor(storageAdapter, bottomSheet, toast) {
    this._storage = storageAdapter;
    this._sheet = bottomSheet;
    this._toast = toast;
  }

  init() {
    const gearBtn = document.querySelector('#gear');
    if (gearBtn) {
      gearBtn.addEventListener('click', () => this.openSettingsSheet());
    }
  }

  openSettingsSheet() {
    const state = this._storage.loadState();
    const crossWeight = this._storage.getCrossAppWeight();
    const currentWeight = state.peso || crossWeight || 80;

    const content = `
      <h3 style="margin-top:0">Configurações · Fit Força</h3>
      
      <div style="margin-bottom:14px">
        <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Peso corporal (para cálculo de calorias):</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="number" id="inpSetWeight" class="f-in" style="width:100px" value="${currentWeight}" step="0.5">
          <span>kg</span>
          ${crossWeight ? `<small style="color:var(--ok);margin-left:8px">(Sincronizado do Fit Systekna: ${crossWeight} kg)</small>` : ''}
        </div>
      </div>

      <div style="margin-bottom:14px">
        <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Descanso padrão entre séries:</label>
        <div style="display:flex;gap:8px;align-items:center">
          <input type="number" id="inpSetRest" class="f-in" style="width:100px" value="${state.rest || 90}" step="15">
          <span>segundos</span>
        </div>
      </div>

      <div style="margin-bottom:14px">
        <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">MET padrão de intensidade:</label>
        <select id="selSetMet" class="f-in" style="width:100%">
          <option value="3.5" ${state.met === 3.5 ? 'selected' : ''}>3.5 — Leve (Musculação padrão / descansos normais)</option>
          <option value="5.0" ${state.met === 5.0 ? 'selected' : ''}>5.0 — Moderado (Compostos pesados / supersets)</option>
          <option value="6.0" ${state.met === 6.0 ? 'selected' : ''}>6.0 — Vigoroso (Circuitos / alta intensidade)</option>
        </select>
      </div>

      <div style="border-top:1px solid var(--line);padding-top:14px;margin-top:14px">
        <h4 style="margin:0 0 10px">Backup e Exportação</h4>
        <div style="display:flex;gap:10px">
          <button type="button" class="btn sec flex1" id="btnExportJson">Backup JSON</button>
          <button type="button" class="btn sec flex1" id="btnExportCsv">Exportar CSV</button>
        </div>
      </div>

      <div style="margin-top:20px">
        <button type="button" class="btn pri block" id="btnSaveSettings">Salvar Configurações</button>
      </div>
    `;

    this._sheet.open(content);

    const btnSave = document.querySelector('#btnSaveSettings');
    if (btnSave) {
      btnSave.onclick = () => {
        const inpWeight = document.querySelector('#inpSetWeight');
        const inpRest = document.querySelector('#inpSetRest');
        const selMet = document.querySelector('#selSetMet');

        if (inpWeight) state.peso = Number(inpWeight.value) || 80;
        if (inpRest) state.rest = Number(inpRest.value) || 90;
        if (selMet) state.met = Number(selMet.value) || 3.5;

        this._storage.saveState(state);
        this._sheet.close();
        this._toast.show('Configurações salvas com sucesso.');
      };
    }

    const btnJson = document.querySelector('#btnExportJson');
    if (btnJson) {
      btnJson.onclick = () => {
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        CsvExporterAdapter.downloadBlob(blob, `fit-forca-backup-${FormatUtils.getTodayIso()}.json`);
      };
    }

    const btnCsv = document.querySelector('#btnExportCsv');
    if (btnCsv) {
      btnCsv.onclick = () => {
        const rows = [
          ['Data', 'Duração (min)', 'Calorias (kcal)', 'Exercício', 'Série', 'Carga (kg)', 'Repetições']
        ];
        (state.log || []).forEach(w => {
          const d = new Date(w.t).toISOString().slice(0, 10);
          (w.ex || []).forEach(e => {
            (e.sets || []).forEach((s, idx) => {
              rows.push([d, w.min || 0, w.kcal || 0, e.n, idx + 1, s.kg || 0, s.reps || 0]);
            });
          });
        });
        const blob = CsvExporterAdapter.createCsvBlob(rows);
        CsvExporterAdapter.downloadBlob(blob, `fit-forca-treinos-${FormatUtils.getTodayIso()}.csv`);
      };
    }
  }
}
