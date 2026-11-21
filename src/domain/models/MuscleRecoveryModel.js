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
    warn: 'hourglass_top',
    bad: 'bedtime',
    new: 'remove'
  };

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
