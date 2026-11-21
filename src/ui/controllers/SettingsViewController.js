import { CsvExporterAdapter } from '../../infrastructure/export/CsvExporterAdapter.js';
import { FormatUtils } from '../../domain/utils/FormatUtils.js';
import { SecurityRecoveryService } from '../../infrastructure/security/SecurityRecoveryService.js';
import { BiometricsAdapter } from '../../infrastructure/security/BiometricsAdapter.js';
import { PinPad } from '../components/PinPad.js';

/**
 * Controller de Configurações, Preferências Globais e Segurança em Tela Dedicada (LGPD / Zero-Knowledge)
 */
export class SettingsViewController {
  constructor(storageAdapter, bottomSheet, toast) {
    this._storage = storageAdapter;
    this._sheet = bottomSheet;
    this._toast = toast;
    this._activeSubTab = 'treino';
  }

  init() {
    // Inicialização da tela única contínua de configurações
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      window.deferredPwaPromptForce = e;
    });
  }

  render() {
    const container = document.querySelector('#cfgContent');
    if (!container) return;

    const state = this._storage.loadState();
    const crossWeight = this._storage.getCrossAppWeight();

    const currentWeight = state.peso || crossWeight || 80;
    const rest = state.rest || 90;
    const met = state.met || 3.5;
    const prog = state.prog || { on: true, inc: 2.5 };
    const isLocked = state.lockEnabled !== false && !!state.pin;

    container.innerHTML = `
      <!-- SEÇÃO 1: TREINO E FISIOLOGIA -->
      <div class="sec-h" style="margin-top:0"><b>Treino &amp; Recuperação</b></div>
      <div class="glass pad form" style="margin-bottom:14px">
        <div style="margin-bottom:14px">
          <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Peso corporal (para cálculo calórico):</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="number" id="inpSetWeight" class="f-in" style="width:110px;font-weight:600" value="${currentWeight}" step="0.5">
            <span style="font-size:14px">kg</span>
            ${crossWeight ? `<small style="color:var(--ok);margin-left:8px">(Sincronizado: ${crossWeight} kg)</small>` : ''}
          </div>
        </div>

        <div style="margin-bottom:14px">
          <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Intensidade de treino (MET Compêndio 2024):</label>
          <select id="selSetMet" class="f-in" style="width:100%">
            <option value="3.5" ${met === 3.5 ? 'selected' : ''}>3.5 — Leve (Musculação padrão)</option>
            <option value="5.0" ${met === 5.0 ? 'selected' : ''}>5.0 — Moderado (Compostos pesados)</option>
            <option value="6.0" ${met === 6.0 ? 'selected' : ''}>6.0 — Vigoroso (Alta intensidade)</option>
          </select>
        </div>

        <div style="margin-bottom:14px">
          <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Descanso padrão entre séries:</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="number" id="inpSetRest" class="f-in" style="width:110px;font-weight:600" value="${rest}" step="15" min="15" max="600">
            <span style="font-size:14px">segundos (${Math.floor(rest/60)}m ${rest%60}s)</span>
          </div>
        </div>

        <div style="margin-bottom:14px">
          <label style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
            <span><b>Progressão automática de carga</b><br><small style="color:var(--soft)">Sugere aumento de carga ao atingir as repetições</small></span>
            <input type="checkbox" id="chkProgOn" ${prog.on ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer">
          </label>
        </div>

        <div style="margin-bottom:16px">
          <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Aumento sugerido por padrão:</label>
          <select id="selProgInc" class="f-in" style="width:100%">
            <option value="1" ${prog.inc === 1 ? 'selected' : ''}>1 kg (Halteres / Isolados)</option>
            <option value="2.5" ${prog.inc === 2.5 ? 'selected' : ''}>2.5 kg (Recomendado / Compostos)</option>
            <option value="5" ${prog.inc === 5 ? 'selected' : ''}>5 kg (Agachamento / Terra)</option>
          </select>
        </div>

        <button type="button" class="btn pri block" id="btnSaveTreinoCfg">Salvar Preferências de Treino</button>
      </div>

      <!-- SEÇÃO 2: SEGURANÇA E PRIVACIDADE -->
      <div class="sec-h"><b>Segurança &amp; Privacidade</b></div>
      <div class="glass pad form" style="margin-bottom:14px">
        <div style="margin-bottom:12px">
          <label style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
            <div>
              <b style="font-size:14px">Bloqueio por PIN para Proteção</b>
              <div style="color:var(--soft);font-size:12px;margin-top:2px">Exige PIN numérico ao retornar ao app</div>
            </div>
            <input type="checkbox" id="chkLockPinForce" ${isLocked ? 'checked' : ''} style="width:22px;height:22px;cursor:pointer">
          </label>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px">
          <button type="button" class="btn sec block" id="btnChangePinForce">
            ${state.pin ? 'Alterar PIN de Acesso' : 'Definir PIN de Acesso'}
          </button>
          <button type="button" class="btn sec block" id="btnCertPdfForce">
            Emitir Certificado de Segurança (PDF com QR &amp; Hash)
          </button>
          <button type="button" class="btn sec block" id="btnViewWordsForce">
            Ver 12 Palavras de Recuperação (BIP39)
          </button>
        </div>
        <p class="note" style="margin-top:12px">Todas as chaves permanecem 100% locais no dispositivo com derivação PBKDF2 e sanitização de memória.</p>
      </div>

      <!-- SEÇÃO 3: INSTALAÇÃO DO APP (PWA) -->
      <div class="sec-h"><b>Instalação do Aplicativo</b></div>
      <div class="glass pad" style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="stat"><span class="ic t-acc"><span class="ms" aria-hidden="true">install_mobile</span></span></span>
          <div style="flex:1">
            <b>Adicionar Fit Força à Tela Inicial</b>
            <small style="display:block;color:var(--soft);font-size:12px">PWA offline com acesso rápido instantâneo</small>
          </div>
        </div>
        <button type="button" class="btn sec block" id="btnInstalarPwaForce" style="display:flex;align-items:center;justify-content:center;gap:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><line x1="12" x2="12.01" y1="18" y2="18"/></svg>
          Instalar / Como Adicionar
        </button>
      </div>

      <!-- SEÇÃO 4: DADOS E BACKUP -->
      <div class="sec-h"><b>Dados &amp; Backup</b></div>
      <div class="glass pad form" style="margin-bottom:14px">
        <p style="font-size:13px;color:var(--soft);margin-bottom:12px">Seus treinos, séries e cargas são armazenados exclusivamente na memória segura do seu navegador.</p>
        <div style="display:flex;flex-direction:column;gap:10px">
          <button type="button" class="btn sec block" id="btnExportJsonForce">Fazer Backup Completo (JSON)</button>
          <button type="button" class="btn sec block" id="btnExportCsvForce">Exportar Histórico de Séries e Cargas (CSV)</button>
          <label class="btn sec block" style="cursor:pointer;text-align:center;position:relative">
            Restaurar Backup de Arquivo (JSON)
            <input type="file" id="inpImportJsonForce" accept=".json" style="position:absolute;inset:0;opacity:0;cursor:pointer">
          </label>
        </div>
        <div style="border-top:1px solid var(--line);margin-top:18px;padding-top:14px">
          <button type="button" class="btn dng block" id="btnResetDataForce">Apagar Todos os Dados Locais</button>
        </div>
      </div>

      <!-- SEÇÃO 5: SOBRE E VERSÃO -->
      <div class="sec-h"><b>Sobre o Aplicativo</b></div>
      <div class="glass list" style="margin-bottom:14px">
        <div class="it"><div class="t"><b>Fit Força</b><small>Versão 1.5 · Musculação Inteligente &amp; Sobrecarga Progressiva</small></div></div>
        <button type="button" class="row" id="btnPrivacyPolicyForce"><div class="t"><b>Política de Privacidade (LGPD)</b><small>Zero-Knowledge, Local-First e sem rastreadores</small></div><span class="ms go" aria-hidden="true">chevron_right</span></button>
        <div class="it"><div class="t"><b>Catálogo Anatômico</b><small>41 músculos mapeados com estimativa de recuperação neuromuscular</small></div></div>
      </div>

      <!-- SEÇÃO 6: APOIO E COMUNIDADE -->
      <div class="sec-h"><b>Apoio &amp; Comunidade</b></div>
      <div class="glass pad" style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
        <p style="font-size:13px;color:var(--soft);margin:0 0 4px">Este app é gratuito e independente. Você pode apoiar o desenvolvimento ou avaliar a sua experiência:</p>
        
        <button type="button" class="btn pri block" id="btnApoiarPixForce" style="display:flex;align-items:center;justify-content:center;gap:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          Apoiar com PIX ou Bitcoin
        </button>

        <div style="display:flex;gap:10px">
          <button type="button" class="btn sec flex1" id="btnAvaliarAppForce" style="display:flex;align-items:center;justify-content:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Avaliar (1 a 5 ★)
          </button>
          <button type="button" class="btn sec flex1" id="btnSugerirForce" style="display:flex;align-items:center;justify-content:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Sugerir / Feedback
          </button>
        </div>
      </div>
    `;

    // Conecta todos os listeners
    this._bindAllSettingsEvents(container, state);
  }

  _bindAllSettingsEvents(container, state) {
    // 1. Salvar Preferências de Treino
    const btnSave = container.querySelector('#btnSaveTreinoCfg');
    if (btnSave) {
      btnSave.onclick = () => {
        const inpWeight = container.querySelector('#inpSetWeight');
        const inpRest = container.querySelector('#inpSetRest');
        const selMet = container.querySelector('#selSetMet');
        const chkProg = container.querySelector('#chkProgOn');
        const selInc = container.querySelector('#selProgInc');

        if (inpWeight) state.peso = Number(inpWeight.value) || 80;
        if (inpRest) state.rest = Number(inpRest.value) || 90;
        if (selMet) state.met = Number(selMet.value) || 3.5;
        state.prog = {
          on: chkProg ? chkProg.checked : true,
          inc: selInc ? Number(selInc.value) || 2.5 : 2.5
        };

        this._storage.saveState(state);
        this._toast.show('Preferências de treino salvas com sucesso.');
      };
    }

    // 2. Segurança - Toggle Bloqueio PIN
    const chkLock = container.querySelector('#chkLockPinForce');
    if (chkLock) {
      chkLock.onchange = () => {
        if (chkLock.checked && !state.pin) {
          this.promptCreatePinFlow(state);
        } else {
          state.lockEnabled = chkLock.checked;
          this._storage.saveState(state);
          this._toast.show(state.lockEnabled ? 'Bloqueio por PIN ativado.' : 'Bloqueio por PIN desativado.');
        }
      };
    }

    // Alterar PIN
    const btnPin = container.querySelector('#btnChangePinForce');
    if (btnPin) {
      btnPin.onclick = () => this.promptCreatePinFlow(state);
    }

    // Emitir Certificado PDF
    const btnPdf = container.querySelector('#btnCertPdfForce');
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

    // Ver 12 Palavras
    const btnWords = container.querySelector('#btnViewWordsForce');
    if (btnWords) {
      btnWords.onclick = async () => {
        await this.ensureSeed(state);
        if (state.pin) {
          this._sheet.open(`
            <h3 style="margin-top:0">Confirmação de Segurança</h3>
            <p style="color:var(--soft);font-size:13px">Digite seu PIN para visualizar suas 12 palavras de recuperação:</p>
            <div id="pinBoxAuthForce"></div>
          `);
          const box = document.querySelector('#pinBoxAuthForce');
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

    // 3. Instalação PWA
    const btnInstPwa = container.querySelector('#btnInstalarPwaForce');
    if (btnInstPwa) {
      btnInstPwa.onclick = () => {
        if (window.deferredPwaPromptForce) {
          window.deferredPwaPromptForce.prompt();
          window.deferredPwaPromptForce.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
              this._toast.show('Instalação iniciada!');
            }
            window.deferredPwaPromptForce = null;
          });
        } else {
          this._sheet.open(`
            <h3 style="margin-top:0">Instalação do Fit Força</h3>
            <p style="font-size:14px;color:var(--soft);line-height:1.5">
              Para instalar este aplicativo no seu aparelho:
            </p>
            <div class="glass pad" style="margin:12px 0;font-size:13px;line-height:1.6">
              <b>No Chrome / Android:</b> Toque no menu (três pontos) e selecione <b>"Instalar aplicativo"</b>.<br><br>
              <b>No Safari / iOS:</b> Toque em <b>Compartilhar</b> e selecione <b>"Adicionar à Tela de Início"</b>.
            </div>
            <button class="btn pri block" id="bOkInstF">Entendido</button>
          `);
          const bOkInstF = document.querySelector('#bOkInstF');
          if (bOkInstF) bOkInstF.onclick = () => this._sheet.close();
        }
      };
    }

    // 4. Dados e Backup - Exportar JSON
    const btnJson = container.querySelector('#btnExportJsonForce');
    if (btnJson) {
      btnJson.onclick = () => {
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        CsvExporterAdapter.downloadBlob(blob, `fit-forca-backup-${FormatUtils.getTodayIso()}.json`);
        this._toast.show('Backup JSON gerado com sucesso.');
      };
    }

    // Exportar CSV
    const btnCsv = container.querySelector('#btnExportCsvForce');
    if (btnCsv) {
      btnCsv.onclick = () => {
        const rows = [
          ['Data', 'Duração (min)', 'Calorias (kcal)', 'Exercício', 'Série', 'Carga (kg)', 'Repetições']
        ];
        (state.log || []).forEach(w => {
          const d = new Date(w.t).toISOString().slice(0, 10);
          (w.ex || []).forEach(e => {
            (e.s || []).forEach((s, idx) => {
              rows.push([
                d,
                w.min || 0,
                w.kc || 0,
                `"${(e.n || '').replace(/"/g, '""')}"`,
                idx + 1,
                s.kg || 0,
                s.r || 0
              ]);
            });
          });
        });

        const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        CsvExporterAdapter.downloadBlob(blob, `fit-forca-series-${FormatUtils.getTodayIso()}.csv`);
        this._toast.show('Exportação CSV gerada com sucesso.');
      };
    }

    // Importar JSON
    const inpImport = container.querySelector('#inpImportJsonForce');
    if (inpImport) {
      inpImport.onchange = ev => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const imported = JSON.parse(e.target.result);
            if (imported && (imported.log || imported.plan || imported.mSt)) {
              this._storage.saveState(imported);
              this._toast.show('Backup restaurado! Recarregando...');
              setTimeout(() => window.location.reload(), 1000);
            } else {
              this._toast.show('Arquivo de backup inválido.');
            }
          } catch (err) {
            this._toast.show('Erro ao ler JSON: ' + err.message);
          }
        };
        reader.readAsText(file);
      };
    }

    // Reset de Dados
    const btnReset = container.querySelector('#btnResetDataForce');
    if (btnReset) {
      btnReset.onclick = () => {
        this._sheet.open(`
          <h3 style="margin-top:0;color:var(--bad)">Apagar Todos os Dados</h3>
          <p style="color:var(--soft);font-size:13px">Esta ação apagará permanentemente todos os seus treinos, cargas, histórico e chaves de segurança deste aparelho. Esta operação é irreversível.</p>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button type="button" class="btn sec flex1" id="btnCancelResetForce">Cancelar</button>
            <button type="button" class="btn dng flex1" id="btnConfirmResetForce">Sim, Apagar Tudo</button>
          </div>
        `);
        const btnCancel = document.querySelector('#btnCancelResetForce');
        if (btnCancel) btnCancel.onclick = () => this._sheet.close();
        const btnConfirm = document.querySelector('#btnConfirmResetForce');
        if (btnConfirm) {
          btnConfirm.onclick = () => {
            localStorage.removeItem('fit-forca-v1');
            window.location.reload();
          };
        }
      };
    }

    // 5. Política de Privacidade
    const btnPriv = container.querySelector('#btnPrivacyPolicyForce');
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
          <button type="button" class="btn pri block" id="btnClosePrivModal" style="margin-top:14px">Fechar</button>
        `);
        const btnClose = document.querySelector('#btnClosePrivModal');
        if (btnClose) btnClose.onclick = () => this._sheet.close();
      };
    }

    // 6. Apoio e Feedback
    const btnApoiar = container.querySelector('#btnApoiarPixForce');
    if (btnApoiar) {
      btnApoiar.onclick = () => {
        if (window.Doacao && typeof window.Doacao.abrir === 'function') {
          window.Doacao.abrir();
        } else {
          this._toast.show('Módulo de doação indisponível.');
        }
      };
    }

    const btnAvaliar = container.querySelector('#btnAvaliarAppForce');
    if (btnAvaliar) {
      btnAvaliar.onclick = () => {
        if (window.Doacao && typeof window.Doacao.abrir === 'function') {
          window.Doacao.abrir('avaliar');
        } else {
          this._toast.show('Módulo de avaliação indisponível.');
        }
      };
    }

    const btnSugerir = container.querySelector('#btnSugerirForce');
    if (btnSugerir) {
      btnSugerir.onclick = () => {
        if (window.Doacao && typeof window.Doacao.abrir === 'function') {
          window.Doacao.abrir('feedback');
        } else {
          this._toast.show('Módulo de feedback indisponível.');
        }
      };
    }
  }

  renderTreinoTab(container, state, crossWeight) {
    const currentWeight = state.peso || crossWeight || 80;
    const rest = state.rest || 90;
    const met = state.met || 3.5;
    const prog = state.prog || { on: true, inc: 2.5 };

    container.innerHTML = `
      <div class="glass pad form">
        <div class="sec-h" style="margin-top:0"><b>Fisiologia & Calorias</b></div>
        
        <div style="margin-bottom:14px">
          <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Peso corporal (para cálculo de calorias):</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="number" id="inpSetWeight" class="f-in" style="width:110px;font-weight:600" value="${currentWeight}" step="0.5">
            <span style="font-size:14px">kg</span>
            ${crossWeight ? `<small style="color:var(--ok);margin-left:8px">(Sincronizado do Fit Systekna: ${crossWeight} kg)</small>` : ''}
          </div>
        </div>

        <div style="margin-bottom:14px">
          <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Intensidade de treino (MET Compêndio 2024):</label>
          <select id="selSetMet" class="f-in" style="width:100%">
            <option value="3.5" ${met === 3.5 ? 'selected' : ''}>3.5 — Leve (Musculação padrão / descansos normais)</option>
            <option value="5.0" ${met === 5.0 ? 'selected' : ''}>5.0 — Moderado (Compostos pesados / supersets)</option>
            <option value="6.0" ${met === 6.0 ? 'selected' : ''}>6.0 — Vigoroso (Circuitos / alta intensidade)</option>
          </select>
        </div>

        <div class="sec-h" style="margin-top:16px"><b>Descanso & Cargas</b></div>

        <div style="margin-bottom:14px">
          <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Descanso padrão entre séries:</label>
          <div style="display:flex;gap:8px;align-items:center">
            <input type="number" id="inpSetRest" class="f-in" style="width:110px;font-weight:600" value="${rest}" step="15" min="15" max="600">
            <span style="font-size:14px">segundos (${Math.floor(rest/60)}m ${rest%60}s)</span>
          </div>
        </div>

        <div style="margin-bottom:14px">
          <label style="display:flex;align-items:center;justify-content:space-between;padding:4px 0">
            <span><b>Progressão automática de carga</b><br><small style="color:var(--soft)">Sugere aumento de carga ao bater as repetições alvo</small></span>
            <input type="checkbox" id="chkProgOn" ${prog.on ? 'checked' : ''} style="width:20px;height:20px;cursor:pointer">
          </label>
        </div>

        <div style="margin-bottom:18px">
          <label style="display:block;font-size:12px;color:var(--soft);margin-bottom:4px">Aumento sugerido por padrão:</label>
          <select id="selProgInc" class="f-in" style="width:100%">
            <option value="1" ${prog.inc === 1 ? 'selected' : ''}>1 kg (Halteres / Isolados)</option>
            <option value="2.5" ${prog.inc === 2.5 ? 'selected' : ''}>2.5 kg (Recomendado / Compostos)</option>
            <option value="5" ${prog.inc === 5 ? 'selected' : ''}>5 kg (Agachamento / Levantamento Terra)</option>
          </select>
        </div>

        <button type="button" class="btn pri block" id="btnSaveTreinoCfg">Salvar Preferências de Treino</button>
      </div>
    `;

    const btnSave = container.querySelector('#btnSaveTreinoCfg');
    if (btnSave) {
      btnSave.onclick = () => {
        const inpWeight = container.querySelector('#inpSetWeight');
        const inpRest = container.querySelector('#inpSetRest');
        const selMet = container.querySelector('#selSetMet');
        const chkProg = container.querySelector('#chkProgOn');
        const selInc = container.querySelector('#selProgInc');

        if (inpWeight) state.peso = Number(inpWeight.value) || 80;
        if (inpRest) state.rest = Number(inpRest.value) || 90;
        if (selMet) state.met = Number(selMet.value) || 3.5;
        state.prog = {
          on: chkProg ? chkProg.checked : true,
          inc: selInc ? Number(selInc.value) || 2.5 : 2.5
        };

        this._storage.saveState(state);
        this._toast.show('Preferências de treino salvas com sucesso.');
      };
    }
  }

  renderSegurancaTab(container, state) {
    const isLocked = state.lockEnabled !== false && !!state.pin;

    container.innerHTML = `
      <div class="glass pad form">
        <div class="sec-h" style="margin-top:0"><b>Segurança & Proteção de Acesso</b></div>
        
        <div style="margin-bottom:14px">
          <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line)">
            <div>
              <b style="font-size:14px">Bloqueio por PIN para Olhares Curiosos</b>
              <div style="color:var(--soft);font-size:12px;margin-top:2px">Exige PIN numérico tátil ao abrir e ao retornar ao app</div>
            </div>
            <input type="checkbox" id="chkLockPinForce" ${isLocked ? 'checked' : ''} style="width:22px;height:22px;cursor:pointer">
          </label>
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">
          <button type="button" class="btn sec block" id="btnChangePinForce">
            ${state.pin ? 'Alterar PIN de Acesso' : 'Definir PIN de Acesso'}
          </button>
          <button type="button" class="btn sec block" id="btnCertPdfForce">
            Emitir Certificado de Segurança (PDF com QR & Hash)
          </button>
          <button type="button" class="btn sec block" id="btnViewWordsForce">
            Ver 12 Palavras de Recuperação (BIP39)
          </button>
          <button type="button" class="btn sec block" id="btnPrivacyPolicyForce">
            Política de Privacidade (LGPD Zero-Knowledge)
          </button>
        </div>

        <p class="note" style="margin-top:14px">
          Padrão Systekna: Todas as chaves e dados permanecem 100% locais no dispositivo com derivação PBKDF2 e sanitização em memória.
        </p>
      </div>
    `;

    // Toggle Bloqueio PIN
    const chkLock = container.querySelector('#chkLockPinForce');
    if (chkLock) {
      chkLock.onchange = () => {
        if (chkLock.checked && !state.pin) {
          this.promptCreatePinFlow(state);
        } else {
          state.lockEnabled = chkLock.checked;
          this._storage.saveState(state);
          this._toast.show(state.lockEnabled ? 'Bloqueio por PIN ativado.' : 'Bloqueio por PIN desativado.');
        }
      };
    }

    // Alterar PIN
    const btnPin = container.querySelector('#btnChangePinForce');
    if (btnPin) {
      btnPin.onclick = () => this.promptCreatePinFlow(state);
    }

    // Emitir Certificado PDF
    const btnPdf = container.querySelector('#btnCertPdfForce');
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

    // Ver 12 Palavras
    const btnWords = container.querySelector('#btnViewWordsForce');
    if (btnWords) {
      btnWords.onclick = async () => {
        await this.ensureSeed(state);
        if (state.pin) {
          this._sheet.open(`
            <h3 style="margin-top:0">Confirmação de Segurança</h3>
            <p style="color:var(--soft);font-size:13px">Digite seu PIN para visualizar suas 12 palavras de recuperação:</p>
            <div id="pinBoxAuthForce"></div>
          `);
          const box = document.querySelector('#pinBoxAuthForce');
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

    // Política de Privacidade
    const btnPriv = container.querySelector('#btnPrivacyPolicyForce');
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
          <button type="button" class="btn pri block" id="btnClosePrivModal" style="margin-top:14px">Fechar</button>
        `);
        const btnClose = document.querySelector('#btnClosePrivModal');
        if (btnClose) btnClose.onclick = () => this._sheet.close();
      };
    }
  }

  renderDadosTab(container, state) {
    container.innerHTML = `
      <div class="glass pad form">
        <div class="sec-h" style="margin-top:0"><b>Exportação & Importação de Dados</b></div>
        
        <p style="font-size:13px;color:var(--soft);margin-bottom:14px">
          Seus treinos, séries e cargas são armazenados exclusivamente na memória segura do seu navegador.
        </p>

        <div style="display:flex;flex-direction:column;gap:10px">
          <button type="button" class="btn sec block" id="btnExportJsonForce">
            Fazer Backup Completo (JSON)
          </button>
          <button type="button" class="btn sec block" id="btnExportCsvForce">
            Exportar Histórico de Séries e Cargas (CSV)
          </button>

          <label class="btn sec block" style="cursor:pointer;text-align:center;position:relative">
            Restaurar Backup de Arquivo (JSON)
            <input type="file" id="inpImportJsonForce" accept=".json" style="position:absolute;inset:0;opacity:0;cursor:pointer">
          </label>
        </div>

        <div style="border-top:1px solid var(--line);margin-top:20px;padding-top:16px">
          <div class="sec-h" style="margin-top:0"><b style="color:var(--bad)">Zona de Risco</b></div>
          <button type="button" class="btn dng block" id="btnResetDataForce">
            Apagar Todos os Dados Locais
          </button>
        </div>
      </div>
    `;

    // Exportar JSON
    const btnJson = container.querySelector('#btnExportJsonForce');
    if (btnJson) {
      btnJson.onclick = () => {
        const jsonStr = JSON.stringify(state, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        CsvExporterAdapter.downloadBlob(blob, `fit-forca-backup-${FormatUtils.getTodayIso()}.json`);
        this._toast.show('Backup JSON gerado com sucesso.');
      };
    }

    // Exportar CSV
    const btnCsv = container.querySelector('#btnExportCsvForce');
    if (btnCsv) {
      btnCsv.onclick = () => {
        const rows = [
          ['Data', 'Duração (min)', 'Calorias (kcal)', 'Exercício', 'Série', 'Carga (kg)', 'Repetições']
        ];
        (state.log || []).forEach(w => {
          const d = new Date(w.t).toISOString().slice(0, 10);
          (w.ex || []).forEach(e => {
            (e.s || []).forEach((s, idx) => {
              rows.push([
                d,
                w.min || 0,
                w.kc || 0,
                `"${(e.n || '').replace(/"/g, '""')}"`,
                idx + 1,
                s.kg || 0,
                s.r || 0
              ]);
            });
          });
        });

        const csvContent = '\uFEFF' + rows.map(r => r.join(';')).join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        CsvExporterAdapter.downloadBlob(blob, `fit-forca-series-${FormatUtils.getTodayIso()}.csv`);
        this._toast.show('Exportação CSV gerada com sucesso.');
      };
    }

    // Importar JSON
    const inpImport = container.querySelector('#inpImportJsonForce');
    if (inpImport) {
      inpImport.onchange = ev => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const imported = JSON.parse(e.target.result);
            if (imported && (imported.log || imported.plan || imported.mSt)) {
              this._storage.saveState(imported);
              this._toast.show('Backup restaurado! Recarregando...');
              setTimeout(() => window.location.reload(), 1000);
            } else {
              this._toast.show('Arquivo de backup inválido.');
            }
          } catch (err) {
            this._toast.show('Erro ao ler JSON: ' + err.message);
          }
        };
        reader.readAsText(file);
      };
    }

    // Reset de Dados
    const btnReset = container.querySelector('#btnResetDataForce');
    if (btnReset) {
      btnReset.onclick = () => {
        this._sheet.open(`
          <h3 style="margin-top:0;color:var(--bad)">Apagar Todos os Dados</h3>
          <p style="color:var(--soft);font-size:13px">Esta ação apagará permanentemente todos os seus treinos, cargas, histórico e chaves de segurança deste aparelho. Esta operação é irreversível.</p>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button type="button" class="btn sec flex1" id="btnCancelResetForce">Cancelar</button>
            <button type="button" class="btn dng flex1" id="btnConfirmResetForce">Sim, Apagar Tudo</button>
          </div>
        `);
        const btnCancel = document.querySelector('#btnCancelResetForce');
        if (btnCancel) btnCancel.onclick = () => this._sheet.close();
        const btnConfirm = document.querySelector('#btnConfirmResetForce');
        if (btnConfirm) {
          btnConfirm.onclick = () => {
            localStorage.removeItem('fit-forca-v1');
            window.location.reload();
          };
        }
      };
    }
  }

  renderSobreTab(container, state) {
    container.innerHTML = `
      <div class="glass list" style="margin-bottom:16px">
        <div class="it">
          <div class="t">
            <b>Fit Força</b>
            <small>Versão 1.5 · Musculação Inteligente & Sobrecarga Progressiva</small>
          </div>
        </div>
        <div class="it">
          <div class="t">
            <b>Catálogo Anatômico</b>
            <small>41 músculos mapeados com estimativa de recuperação e prontidão neuromuscular</small>
          </div>
        </div>
        <div class="it">
          <div class="t">
            <b>Arquitetura & Privacidade</b>
            <small>Zero-Knowledge, Local-First, derivação PBKDF2 e sem rastreamento ou telemetria</small>
          </div>
        </div>
        <div class="it">
          <div class="t">
            <b>Desenvolvimento</b>
            <small>Systekna Technologies · Padrão Open Source</small>
          </div>
        </div>
      </div>

      <div class="sec-h"><b>Apoio &amp; Comunidade</b></div>
      <div class="glass pad" style="display:flex;flex-direction:column;gap:10px">
        <p style="font-size:13px;color:var(--soft);margin:0 0 4px">Este app é gratuito e independente. Você pode apoiar o desenvolvimento ou avaliar a sua experiência:</p>
        
        <button type="button" class="btn pri block" id="btnApoiarPixForce" style="display:flex;align-items:center;justify-content:center;gap:8px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
          Apoiar com PIX ou Bitcoin
        </button>

        <div style="display:flex;gap:10px">
          <button type="button" class="btn sec flex1" id="btnAvaliarAppForce" style="display:flex;align-items:center;justify-content:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            Avaliar (1 a 5 ★)
          </button>
          <button type="button" class="btn sec flex1" id="btnSugerirForce" style="display:flex;align-items:center;justify-content:center;gap:6px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Sugerir / Feedback
          </button>
        </div>
      </div>
    `;

    const btnApoiar = container.querySelector('#btnApoiarPixForce');
    if (btnApoiar) {
      btnApoiar.onclick = () => {
        if (window.Doacao && typeof window.Doacao.abrir === 'function') {
          window.Doacao.abrir();
        } else {
          this._toast.show('Módulo de doação indisponível');
        }
      };
    }

    const btnAvaliar = container.querySelector('#btnAvaliarAppForce');
    if (btnAvaliar) {
      btnAvaliar.onclick = () => {
        if (window.Doacao && typeof window.Doacao.abrir === 'function') {
          window.Doacao.abrir('avaliar');
        } else {
          this._toast.show('Módulo de avaliação indisponível');
        }
      };
    }

    const btnSugerir = container.querySelector('#btnSugerirForce');
    if (btnSugerir) {
      btnSugerir.onclick = () => {
        if (window.Doacao && typeof window.Doacao.abrir === 'function') {
          window.Doacao.abrir('sugerir');
        } else {
          this._toast.show('Módulo de sugestões indisponível');
        }
      };
    }
  }

  promptCreatePinFlow(state) {
    this._sheet.open(`
      <h3 style="margin-top:0">Definir PIN de Acesso</h3>
      <p style="font-size:13px;color:var(--soft)">Digite de 4 a 6 dígitos para o seu PIN:</p>
      <div id="pinBoxCreateForce"></div>
    `);

    const box = document.querySelector('#pinBoxCreateForce');
    if (box) {
      PinPad.renderCreationFlow(box, {
        onDone: async pinValue => {
          state.pin = await BiometricsAdapter.hashPin(pinValue);
          state.pinLen = pinValue.length;
          state.lockEnabled = true;
          await this.ensureSeed(state);
          this._storage.saveState(state);
          PinPad.clearActive();
          this._sheet.close();
          this._toast.show('PIN de Acesso definido com sucesso!');
          this.render();
        }
      });
    }
  }

  async ensureSeed(state) {
    if (!state.seedWords || !state.seedHash) {
      const entropy = SecurityRecoveryService.generateEntropyWords();
      state.seedWords = entropy.words;
      state.seedHash = await SecurityRecoveryService.computeSeedHash(entropy.words);
      this._storage.saveState(state);
    }
  }

  displayWordsModal(state) {
    const words = (state.seedWords || []).join(' ');
    this._sheet.open(`
      <h3 style="margin-top:0;color:var(--accent)">12 Palavras de Recuperação</h3>
      <p style="font-size:13px;color:var(--soft);margin-bottom:12px">
        Anote estas palavras em ordem segura ou guarde o Certificado de Segurança:
      </p>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;background:var(--surface-2, rgba(255,255,255,0.04));padding:12px;border-radius:12px;margin-bottom:14px">
        ${(state.seedWords || []).map((w, i) => `
          <div style="font-size:13px;font-family:monospace;padding:4px 6px;background:rgba(255,255,255,0.06);border-radius:6px">
            <span style="color:var(--soft);font-size:11px">${i + 1}.</span> <b>${w}</b>
          </div>
        `).join('')}
      </div>

      <div style="font-size:12px;color:var(--soft);margin-bottom:14px;word-break:break-all">
        Código Hash de Verificação: <b style="color:var(--ink);font-family:monospace">${state.seedHash || '—'}</b>
      </div>

      <button type="button" class="btn pri block" id="btnCopyWordsForce">Copiar 12 Palavras</button>
      <button type="button" class="btn sec block" id="btnCloseWordsForce" style="margin-top:8px">Fechar</button>
    `);

    const btnCopy = document.querySelector('#btnCopyWordsForce');
    if (btnCopy) {
      btnCopy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(words);
          this._toast.show('Palavras copiadas para a área de transferência.');
        } catch (_) {
          this._toast.show('Copie manualmente as palavras.');
        }
      };
    }

    const btnClose = document.querySelector('#btnCloseWordsForce');
    if (btnClose) btnClose.onclick = () => this._sheet.close();
  }
}
