/**
 * Modelo Matemático de Fadiga Muscular e Recuperação por Volume
 */
export class MuscleRecoveryModel {
  static STATUS_LABELS = {
    ok: 'Pronto',
    warn: 'Quase pronto',
    bad: 'Recuperando',
    new: 'Sem registro'
  };

  static STATUS_ICONS = {
    ok: 'check',
    warn: 'clock',
    bad: 'moon',
    new: 'minus'
  };

  static MUSCLE_IMAGE_MAP = {
    'peitoral-maior': 'assets/icones_musculos_pro/peitoral.jpg',
    'deltoides-geral': 'assets/icones_musculos_pro/ombros.jpg',
    'deltoide-anterior': 'assets/icones_musculos_pro/ombros.jpg',
    'deltoide-lateral': 'assets/icones_musculos_pro/ombros.jpg',
    'redondo-maior-deltoide-posterior': 'assets/icones_musculos_pro/ombros.jpg',
    'esternocleidomastoideo-pescoco': 'assets/icones_musculos_pro/trapezio.jpg',
    'latissimo-do-dorso': 'assets/icones_musculos_pro/costas.jpg',
    'trapezio': 'assets/icones_musculos_pro/trapezio.jpg',
    'romboides': 'assets/icones_musculos_pro/trapezio.jpg',
    'eretor-da-espinha': 'assets/icones_musculos_pro/costas.jpg',
    'quadrado-lombar': 'assets/icones_musculos_pro/costas.jpg',
    'supraespinal': 'assets/icones_musculos_pro/costas.jpg',
    'infraespinal': 'assets/icones_musculos_pro/costas.jpg',
    'redondo-menor': 'assets/icones_musculos_pro/costas.jpg',
    'reto-abdominal': 'assets/icones_musculos_pro/abdomen.jpg',
    'transverso-do-abdomen': 'assets/icones_musculos_pro/abdomen.jpg',
    'serratil-anterior': 'assets/icones_musculos_pro/abdomen.jpg',
    'obliquos-externos': 'assets/icones_musculos_pro/abdomen.jpg',
    'biceps-braquial': 'assets/icones_musculos_pro/biceps.jpg',
    'coracobraquial-cabeca-curta-biceps': 'assets/icones_musculos_pro/biceps.jpg',
    'braquial': 'assets/icones_musculos_pro/biceps.jpg',
    'triceps-braquial-geral': 'assets/icones_musculos_pro/triceps.jpg',
    'cabeca-longa-triceps': 'assets/icones_musculos_pro/triceps.jpg',
    'antebraco-geral': 'assets/icones_musculos_pro/biceps.jpg',
    'braquiorradial': 'assets/icones_musculos_pro/biceps.jpg',
    'flexores-do-antebraco': 'assets/icones_musculos_pro/biceps.jpg',
    'extensores-do-antebraco': 'assets/icones_musculos_pro/biceps.jpg',
    'gluteo-maximo': 'assets/icones_musculos_pro/gluteos_isquiotibiais.jpg',
    'gluteo-medio': 'assets/icones_musculos_pro/gluteos_isquiotibiais.jpg',
    'tensor-da-fascia-lata': 'assets/icones_musculos_pro/quadriceps.jpg',
    'quadriceps-geral': 'assets/icones_musculos_pro/quadriceps.jpg',
    'vasto-medial': 'assets/icones_musculos_pro/quadriceps.jpg',
    'sartorio': 'assets/icones_musculos_pro/quadriceps.jpg',
    'isquiotibiais-geral': 'assets/icones_musculos_pro/gluteos_isquiotibiais.jpg',
    'biceps-femoral': 'assets/icones_musculos_pro/gluteos_isquiotibiais.jpg',
    'adutores-da-coxa': 'assets/icones_musculos_pro/quadriceps.jpg',
    'gracil': 'assets/icones_musculos_pro/quadriceps.jpg',
    'gastrocnemio': 'assets/icones_musculos_pro/panturrilha.jpg',
    'soleo': 'assets/icones_musculos_pro/panturrilha.jpg',
    'tibial-anterior': 'assets/icones_musculos_pro/panturrilha.jpg',
    'fibulares-longo-e-curto': 'assets/icones_musculos_pro/panturrilha.jpg'
  };

  static getMuscleIconPath(muscleId) {
    return this.MUSCLE_IMAGE_MAP[muscleId] || null;
  }

  static getStatusIconSvg(key) {
    switch (key) {
      case 'ok':
        return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
      case 'warn':
        return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
      case 'bad':
        return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
      default:
        return '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    }
  }

  /**
   * Calcula a fadiga acumulada em cada músculo a partir do histórico de treinos
   */
  static computeFatigue(workouts = [], musclesById = {}, customRecoveryHours = {}) {
    const fatigue = {};

    for (const w of workouts) {
      const volume = {};
      const exList = w.exercises || w.ex || [];

      exList.forEach(e => {
        const setsCount = (e.sets || []).length;
        if (!setsCount) return;

        const pMuscle = e.primaryMuscleId || e.m;
        if (pMuscle) {
          volume[pMuscle] = (volume[pMuscle] || 0) + setsCount;
        }

        const secMuscles = e.secondaryMuscleIds || e.sec || [];
        secMuscles.forEach(x => {
          volume[x] = (volume[x] || 0) + setsCount * 0.5; // Sinérgicos recebem 50% de volume
        });
      });

      const wTime = Number(w.timestamp || w.t) || Date.now();

      for (const id in volume) {
        const muscle = musclesById[id];
        if (!muscle) continue;

        const baseHours = customRecoveryHours[id] || muscle.h || muscle.recoveryHours || 48;
        // Fator de escala volumétrica: entre 0.6x (baixo volume) e 1.4x (alto volume)
        const scaleFactor = Math.max(0.6, Math.min(1.4, 0.45 + 0.18 * volume[id]));
        const recoveryEnd = wTime + baseHours * 3600 * 1000 * scaleFactor;

        if (!fatigue[id] || recoveryEnd > fatigue[id].end) {
          fatigue[id] = {
            timestamp: wTime,
            end: recoveryEnd,
            volume: volume[id]
          };
        }
      }
    }

    return fatigue;
  }

  /**
   * Obtém o estado de prontidão de um músculo específico considerando overrides manuais
   */
  static getMuscleStatus(muscleId, fatigueMap = {}, manualOverrides = {}, now = Date.now()) {
    const override = manualOverrides[muscleId];
    const fatigue = fatigueMap[muscleId];

    // Verificar se override expirou ou foi superado por novo treino
    if (override) {
      if ((fatigue && fatigue.timestamp > override.t) || (override.ate && now > override.ate)) {
        // Expirou
      } else {
        const remainingHours = override.ate ? Math.max(1, Math.ceil((override.ate - now) / 3600000)) : null;
        return {
          key: override.k,
          label: `${this.STATUS_LABELS[override.k] || override.k} (ajustado${remainingHours ? ', ' + remainingHours + ' h' : ''})`,
          percent: override.k === 'ok' ? 1.0 : override.k === 'warn' ? 0.75 : 0.25,
          remainingHours,
          isManual: true,
          volume: fatigue && fatigue.volume
        };
      }
    }

    if (!fatigue) {
      return { key: 'new', label: 'Sem registro', percent: 0, remainingHours: 0, isManual: false };
    }

    const left = fatigue.end - now;
    if (left <= 0) {
      return { key: 'ok', label: 'Pronto', percent: 1.0, remainingHours: 0, isManual: false, volume: fatigue.volume };
    }

    const totalDuration = fatigue.end - fatigue.timestamp;
    const progress = totalDuration > 0 ? 1 - left / totalDuration : 1;
    const remainingHours = Math.ceil(left / 3600000);

    const isBad = progress < 0.5;
    const key = isBad ? 'bad' : 'warn';
    const label = `${isBad ? 'Recuperando' : 'Quase pronto'} · ${remainingHours} h`;

    return {
      key,
      label,
      percent: progress,
      remainingHours,
      isManual: false,
      volume: fatigue.volume
    };
  }
}
