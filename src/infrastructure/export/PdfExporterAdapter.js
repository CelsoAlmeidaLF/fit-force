/**
 * Adaptador de Infraestrutura: Gerador Nativo de PDF 1.4 (sem dependências externas)
 */
export class PdfExporterAdapter {
  static WIN_1252_MAP = {
    '≈': 126, '−': 45, '✓': 118, '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133,
    '†': 134, '‡': 135, 'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142,
    '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '˜': 152,
    '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159
  };

  static escapePdfString(text) {
    let out = '';
    for (const ch of String(text || '')) {
      const c = ch.codePointAt(0);
      let b = this.WIN_1252_MAP[ch] ?? (c < 256 && !(c >= 128 && c < 160) ? c : 63);
      const x = String.fromCharCode(b);
      out += x === '(' || x === ')' || x === '\\' ? '\\' + x : x;
    }
    return out;
  }

  static measurePdfTextWidth(text, size, isBold = false) {
    return String(text || '').length * size * (isBold ? 0.56 : 0.51);
  }

  static createPdfDocument() {
    const pages = [];
    let currentPage = null;
    let currentY = 0;
    const margin = 40;
    const pageWidth = 595;
    const pageHeight = 842;

    const doc = {
      M: margin,
      PW: pageWidth,
      PH: pageHeight,
      get y() { return currentY; },
      set y(val) { currentY = val; },

      add() {
        currentPage = [];
        pages.push(currentPage);
        currentY = pageHeight - margin;
      },

      need(height) {
        if (!currentPage || currentY - height < margin + 20) {
          this.add();
          if (this.onPage) this.onPage();
        }
      },

      text(x, y, text, size = 10, isBold = false, color = '0.12 0.15 0.2') {
        currentPage.push(`BT ${color} rg /${isBold ? 'F2' : 'F1'} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (${PdfExporterAdapter.escapePdfString(text)}) Tj ET`);
      },

      rect(x, y, w, h, color) {
        currentPage.push(`${color} rg ${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`);
      },

      line(x1, y1, x2, y2, color = '0.85 0.87 0.9') {
        currentPage.push(`${color} RG 0.6 w ${x1} ${y1.toFixed(1)} m ${x2} ${y2.toFixed(1)} l S`);
      },

      wrap(text, maxWidth, size, isBold = false) {
        const out = [];
        let line = '';
        for (const word of String(text || '').split(/\s+/)) {
          const candidate = line ? line + ' ' + word : word;
          if (PdfExporterAdapter.measurePdfTextWidth(candidate, size, isBold) > maxWidth && line) {
            out.push(line);
            line = word;
          } else {
            line = candidate;
          }
        }
        if (line) out.push(line);
        return out.length ? out : [''];
      },

      blob(footerTitle = 'Fit Força') {
        const objs = [];
        const addObj = s => { objs.push(s); return objs.length; };

        addObj('<< /Type /Catalog /Pages 2 0 R >>');
        addObj(''); // placeholder para Pages
        addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
        addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

        const kids = [];
        pages.forEach((c, i) => {
          const footer = `BT 0.45 0.5 0.56 rg /F1 8 Tf ${margin} 22 Td (${PdfExporterAdapter.escapePdfString(footerTitle + ' · página ' + (i + 1) + ' de ' + pages.length)}) Tj ET`;
          const stream = c.concat(footer).join('\n');
          const contentId = addObj(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
          kids.push(addObj(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`));
        });

        objs[1] = `<< /Type /Pages /Kids [${kids.map(k => k + ' 0 R').join(' ')}] /Count ${kids.length} >>`;

        let out = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
        const offsets = [];
        objs.forEach((o, i) => {
          offsets.push(out.length);
          out += `${i + 1} 0 obj\n${o}\nendobj\n`;
        });

        const xrefPos = out.length;
        out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` +
          offsets.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') +
          `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

        const u8 = new Uint8Array(out.length);
        for (let i = 0; i < out.length; i++) u8[i] = out.charCodeAt(i) & 255;
        return new Blob([u8], { type: 'application/pdf' });
      }
    };

    return doc;
  }

  static renderHeader(doc, title, subtitle) {
    doc.add();
    doc.rect(0, doc.PH - 86, doc.PW, 86, '0.10 0.48 0.83');
    doc.text(doc.M, doc.PH - 46, title, 20, true, '1 1 1');
    doc.text(doc.M, doc.PH - 66, subtitle, 10, false, '0.88 0.94 1');
    doc.y = doc.PH - 112;
  }

  static renderTable(doc, columns, rows, hasHeader = true) {
    const drawHead = () => {
      let x = doc.M;
      doc.rect(doc.M, doc.y - 6, doc.PW - 2 * doc.M, 18, '0.93 0.95 0.98');
      columns.forEach(c => {
        const tw = this.measurePdfTextWidth(c.t, 8.5, true);
        doc.text(c.a === 'r' ? x + c.w - tw - 4 : x + 4, doc.y, c.t, 8.5, true, '0.3 0.36 0.45');
        x += c.w;
      });
      doc.y -= 20;
    };

    if (hasHeader) {
      doc.need(40);
      drawHead();
    }

    rows.forEach(r => {
      const wrapped = r.map((v, i) => doc.wrap(v, columns[i].w - 8, 9.5, i === 1));
      const rowHeight = Math.max(...wrapped.map(l => l.length)) * 12 + 6;
      doc.need(rowHeight + 4);

      let x = doc.M;
      wrapped.forEach((lines, i) => {
        const c = columns[i];
        lines.forEach((t, k) => {
          const tw = this.measurePdfTextWidth(t, 9.5, false);
          doc.text(c.a === 'r' ? x + c.w - tw - 4 : x + 4, doc.y - k * 12, t, 9.5, i === 1 && !c.plain);
        });
        x += c.w;
      });

      doc.y -= rowHeight;
      doc.line(doc.M, doc.y + 8, doc.PW - doc.M, doc.y + 8);
      doc.y -= 4;
    });
  }
}
