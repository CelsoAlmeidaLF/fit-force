/**
 * Adaptador de Exportação e Importação em Formato CSV (RFC 4180 / Padrão PT-BR com ';')
 */
export class CsvExporterAdapter {
  static escapeCell(value) {
    const v = value === null || value === undefined ? '' : String(value);
    return /[;"\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }

  static formatNumber(n, decimals = 1) {
    if (n === '' || n === null || n === undefined) return '';
    return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: decimals, useGrouping: false });
  }

  static createCsvBlob(rows) {
    // BOM UTF-8 (\uFEFF) para compatibilidade nativa com Excel
    const content = '\uFEFF' + rows.map(r => r.map(this.escapeCell).join(';')).join('\r\n');
    return new Blob([content], { type: 'text/csv;charset=utf-8' });
  }

  static parseCsv(text) {
    const cleaned = text.replace(/^\uFEFF/, '');
    const firstLine = cleaned.split(/\r?\n/)[0] || '';
    const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';

    const rows = [];
    let row = [];
    let cell = '';
    let inQuotes = false;

    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (inQuotes) {
        if (ch === '"') {
          if (cleaned[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === sep) {
        row.push(cell);
        cell = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && cleaned[i + 1] === '\n') i++;
        row.push(cell);
        cell = '';
        if (row.some(x => x !== '')) rows.push(row);
        row = [];
      } else {
        cell += ch;
      }
    }
    row.push(cell);
    if (row.some(x => x !== '')) rows.push(row);
    return rows;
  }

  /**
   * Dispara o download de um Blob no navegador
   */
  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
