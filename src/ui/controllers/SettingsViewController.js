import { CsvExporterAdapter } from '../../infrastructure/export/CsvExporterAdapter.js';
import { FormatUtils } from '../../domain/utils/FormatUtils.js';
import { SecurityRecoveryService } from '../../infrastructure/security/SecurityRecoveryService.js';
import { BiometricsAdapter } from '../../infrastructure/security/BiometricsAdapter.js';
import { PinPad } from '../components/PinPad.js';

/**
 * Controller de Configurações, Preferências Globais e Segurança (LGPD / Zero-Knowledge)
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

      <!-- SEÇÃO DE SEGURANÇA E PRIVACIDADE -->
      <div style="border-top:1px solid var(--line);padding-top:14px;margin-top:14px">
        <h4 style="margin:0 0 10px;font-size:14px;color:var(--accent);display:flex;align-items:center;gap:6px">
          <span class="ms" aria-hidden="true">shield</span> Segurança & Privacidade
        </h4>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
            <span><b>Bloqueio por PIN ao abrir</b><br><small style="color:var(--soft)">Protege treinos e cargas contra olhares curiosos</small></span>
            <input type="checkbox" id="chkLockPin" ${state.lockEnabled !== false && state.pin ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer">
          </label>
          <button type="button" class="btn sec" id="btnChangePin">${state.pin ? 'Alterar PIN de Acesso' : 'Definir PIN de Acesso'}</button>
          <button type="button" class="btn sec" id="btnCertPdf">Emitir Certificado de Segurança (PDF)</button>
          <button type="button" class="btn sec" id="btnViewWords">Ver 12 Palavras de Recuperação</button>
          <button type="button" class="btn sec" id="btnPrivacyPolicy">Política de Privacidade (LGPD)</button>
        </div>
      </div>

      <!-- SEÇÃO DE BACKUP E EXPORTAÇÃO -->
      <div style="border-top:1px solid var(--line);padding-top:14px;margin-top:14px">
        <h4 style="margin:0 0 10px;font-size:14px">Backup e Exportação</h4>
        <div style="display:flex;gap:10px">
          <button type="button" class="btn sec flex1" id="btnExportJson">Backup JSON</button>
          <button type="button" class="btn sec flex1" id="btnExportCsv">Exportar CSV</button>
        </div>
      </div>

      <div style="border-top:1px solid var(--line);padding-top:14px;margin-top:14px">
        <button type="button" class="btn dng block" id="btnResetData">Apagar Todos os Dados Locais</button>
      </div>

      <div style="margin-top:18px">
        <button type="button" class="btn pri block" id="btnSaveSettings">Salvar Configurações</button>
      </div>
    `;

    this._sheet.open(content);

    // Salvar Preferências
    const btnSave = document.querySelector('#btnSaveSettings');
    if (btnSave) {
      btnSave.onclick = () => {
        const inpWeight = document.querySelector('#inpSetWeight');
        const inpRest = document.querySelector('#inpSetRest');
        const selMet = document.querySelector('#selSetMet');
        const chkLock = document.querySelector('#chkLockPin');

        if (inpWeight) state.peso = Number(inpWeight.value) || 80;
        if (inpRest) state.rest = Number(inpRest.value) || 90;
        if (selMet) state.met = Number(selMet.value) || 3.5;
        if (chkLock) state.lockEnabled = chkLock.checked;

        this._storage.saveState(state);
        this._sheet.close();
        this._toast.show('Configurações salvas com sucesso.');
      };
    }

    // Toggle de Bloqueio
    const chkLock = document.querySelector('#chkLockPin');
    if (chkLock) {
      chkLock.onchange = () => {
        if (chkLock.checked && !state.pin) {
          this.promptCreatePinFlow(state);
        } else {
          state.lockEnabled = chkLock.checked;
          this._storage.saveState(state);
        }
      };
    }

    // Botão Definir / Alterar PIN
    const btnPin = document.querySelector('#btnChangePin');
    if (btnPin) {
      btnPin.onclick = () => this.promptCreatePinFlow(state);
    }

    // Botão Emitir Certificado PDF
    const btnPdf = document.querySelector('#btnCertPdf');
    if (btnPdf) {
      btnPdf.onclick = async () => {
        await this.ensureSeed(state);
        try {
          await SecurityRecoveryService.downloadSecurityCertificate({
            appName: 'Fit Força',
            words: state.seedWords,
            hash: state.seedHash
          });
          this._toast.show('Certificado de Segurança baixado.');
        } catch (e) {
          this._toast.show('Erro ao emitir PDF: ' + e.message);
        }
      };
    }

    // Botão Ver 12 Palavras de Recuperação
    const btnWords = document.querySelector('#btnViewWords');
    if (btnWords) {
      btnWords.onclick = async () => {
        await this.ensureSeed(state);
        if (state.pin) {
          // Exige confirmação de PIN para proteção contra olhares curiosos
          this._sheet.open(`
            <h3 style="margin-top:0">Confirmação de Segurança</h3>
            <p style="color:var(--soft);font-size:13px">Digite seu PIN para visualizar suas 12 palavras de recuperação:</p>
            <div id="pinBoxAuth"></div>
          `);
          const box = document.querySelector('#pinBoxAuth');
          if (box) {
            PinPad.render(box, {
              mode: 'verify',
              title: 'Confirmar PIN',
              sub: 'Apenas você deve visualizar este segredo.',
              len: state.pinLen,
              check: async v => {
                const h = await BiometricsAdapter.hashPin(v);
                return h === state.pin;
              },
              onOk: () => this.displayWordsModal(state)
            });
          }
        } else {
          this.displayWordsModal(state);
        }
      };
    }

    // Botão Política de Privacidade (LGPD)
    const btnPriv = document.querySelector('#btnPrivacyPolicy');
    if (btnPriv) {
      btnPriv.onclick = async () => {
        const policy = await SecurityRecoveryService.getPrivacyPolicy('Fit Força');
        this._sheet.open(`
          <h3 style="margin-top:0">${policy.title}</h3>
          <p style="font-size:13px;color:var(--accent);margin-bottom:14px">${policy.summary}</p>
          <div style="max-height:60vh;overflow-y:auto;padding-right:6px">
            ${policy.sections.map(s => `
              <div style="margin-bottom:12px;background:var(--surface-2, rgba(255,255,255,0.04));padding:10px 12px;border-radius:10px">
                <b style="font-size:13px;display:block;margin-bottom:4px">${s.heading}</b>
                <p style="font-size:12px;color:var(--soft);margin:0;line-height:1.4">${s.text}</p>
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn pri block" id="btnClosePriv" style="margin-top:14px">Entendido</button>
        `);
        const btnClose = document.querySelector('#btnClosePriv');
        if (btnClose) btnClose.onclick = () => this.openSettingsSheet();
      };
    }

    // Botão Reset de Dados
    const btnReset = document.querySelector('#btnResetData');
    if (btnReset) {
      btnReset.onclick = () => {
        this._sheet.open(`
          <h3 style="margin-top:0;color:var(--bad)">Apagar Todos os Dados</h3>
          <p style="color:var(--soft);font-size:13px">Esta ação apagará permanentemente todos os seus treinos, cargas, histórico e chaves de segurança deste aparelho. Esta operação é irreversível.</p>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button type="button" class="btn sec flex1" id="btnCancelReset">Cancelar</button>
            <button type="button" class="btn dng flex1" id="btnConfirmReset">Sim, Apagar Tudo</button>
          </div>
        `);
        const btnCancel = document.querySelector('#btnCancelReset');
        if (btnCancel) btnCancel.onclick = () => this.openSettingsSheet();
        const btnConfirm = document.querySelector('#btnConfirmReset');
        if (btnConfirm) {
          btnConfirm.onclick = () => {
            localStorage.removeItem('fit-forca-v1');
            window.location.reload();
          };
        }
      };
    }

    // Exportar JSON
    const btnJson = document.querySelector('#btnExportJson');
    if (btnJson) {
      btnJson.onclick = () => {
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        CsvExporterAdapter.downloadBlob(blob, `fit-forca-backup-${FormatUtils.getTodayIso()}.json`);
      };
    }

    // Exportar CSV
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

  async ensureSeed(state) {
    if (!state.seedWords || state.seedWords.length !== 12 || !state.seedHash) {
      const seed = await SecurityRecoveryService.generateSeed();
      state.seedWords = seed.words;
      state.seedHash = seed.hash;
      this._storage.saveState(state);
    }
  }

  promptCreatePinFlow(state) {
    this._sheet.open(`
      <h3 style="margin-top:0">Segurança contra Olhares Curiosos</h3>
      <p style="color:var(--soft);font-size:13px">Defina um PIN de 4 a 6 dígitos numéricos:</p>
      <div id="pinBoxFlow"></div>
    `);
    const box = document.querySelector('#pinBoxFlow');
    if (box) {
      PinPad.renderCreationFlow(box, {
        onDone: async p => {
          await this.ensureSeed(state);
          state.pin = await BiometricsAdapter.hashPin(p);
          state.pinLen = p.length;
          state.lockEnabled = true;
          this._storage.saveState(state);
          this.displayWordsModal(state, true);
        }
      });
    }
  }

  displayWordsModal(state, wasJustCreated = false) {
    const wordsList = state.seedWords || [];
    this._sheet.open(`
      <h3 style="margin-top:0">Suas 12 Palavras de Recuperação</h3>
      <p style="font-size:12px;color:var(--soft);margin-bottom:12px">Guarde estas palavras em local seguro. Elas são a única chave para recuperar o PIN se esquecido:</p>
      
      <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:8px;margin-bottom:14px;background:var(--surface-2, rgba(255,255,255,0.05));padding:12px;border-radius:10px">
        ${wordsList.map((w, idx) => `
          <div style="font-family:monospace;font-size:12px;color:var(--ink)">
            <span style="color:var(--soft)">${idx + 1}.</span> <b>${w}</b>
          </div>
        `).join('')}
      </div>

      <div style="background:var(--surface, rgba(0,0,0,0.2));padding:8px 12px;border-radius:8px;margin-bottom:14px;border:1px solid var(--line)">
        <small style="display:block;color:var(--soft);font-size:11px">Código Hash de Validação:</small>
        <code style="font-size:16px;font-weight:700;color:var(--accent);letter-spacing:1px">${state.seedHash || 'XXXX-XXXX-XXXX'}</code>
      </div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <button type="button" class="btn pri block" id="btnDownloadCertModal">Baixar Certificado em PDF (A4)</button>
        <button type="button" class="btn sec block" id="btnDoneWords">${wasJustCreated ? 'Guardei as palavras e o PIN' : 'Fechar'}</button>
      </div>
    `);

    const btnDl = document.querySelector('#btnDownloadCertModal');
    if (btnDl) {
      btnDl.onclick = async () => {
        await SecurityRecoveryService.downloadSecurityCertificate({
          appName: 'Fit Força',
          words: state.seedWords,
          hash: state.seedHash
        });
        this._toast.show('Download do Certificado iniciado.');
      };
    }

    const btnDone = document.querySelector('#btnDoneWords');
    if (btnDone) {
      btnDone.onclick = () => {
        this._sheet.close();
        if (wasJustCreated) {
          this._toast.show('PIN e Certificado configurados com sucesso.');
        }
      };
    }
  }
}
