/**
 * Utilitários Canônicos de Formatação e Sanitização (Domínio Puro)
 */
export class FormatUtils {
  static escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    }[c]));
  }

  static normalizeText(str) {
    return String(str ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  static formatNumber(n, decimals = 0) {
    return Number(n ?? 0).toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  static formatTime(seconds) {
    const s = Math.max(0, Number(seconds) || 0);
    const mins = Math.floor(s / 60);
    const secs = String(s % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  static formatDateBr(isoDate) {
    return String(isoDate || '').split('-').reverse().join('/');
  }

  static getTodayIso() {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  static generateUid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
}
