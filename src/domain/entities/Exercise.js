/**
 * Entidade Canônica Exercise (Domínio Puro)
 */
export class Exercise {
  constructor(data) {
    this.id = data.id;
    this.name = data.nome;
    this.group = data.g;
    this.primaryMuscleId = data.m;
    this.secondaryMuscleIds = data.sec || [];
    this.movementPattern = data.pad || '';
    this.defaultSeriesRaw = data.sr || '3 × 10';
    this.tip = data.dica || '';
    this.isCustom = !!data.meu;
    this.isEdited = !!data.ed;
  }

  parseDefaultSeries() {
    const sr = this.defaultSeriesRaw || '';
    const m = /(\d+)\s*[×x]\s*(\d+)\s*(s|min)?/i.exec(sr);
    if (!m) {
      const t = /(\d+)\s*min/i.exec(sr);
      return { setsCount: 1, reps: t ? +t[1] : 10, unit: t ? 'min' : 'reps', isBodyweight: !!t };
    }
    return {
      setsCount: Math.max(1, Math.min(10, +m[1])),
      reps: +m[2],
      unit: (m[3] || 'reps').toLowerCase(),
      isBodyweight: !!m[3]
    };
  }

  formatSeriesText(setsCount, reps, unit) {
    if (unit === 'min' && setsCount <= 1) return `${reps} min`;
    return `${setsCount} × ${reps}${unit === 'reps' ? '' : ' ' + unit}`;
  }
}
