import { IFitnessStoragePort } from '../../domain/ports/IFitnessStoragePort.js';

/**
 * Adaptador de Infraestrutura: Armazenamento Local-First via LocalStorage
 */
export class LocalStorageFitnessAdapter extends IFitnessStoragePort {
  constructor(storageKey = 'fit-forca-v1', crossAppKey = 'fit-systekna-v1') {
    super();
    this._storageKey = storageKey;
    this._crossAppKey = crossAppKey;
  }

  loadState() {
    let state = null;
    try {
      const raw = localStorage.getItem(this._storageKey);
      if (raw) {
        state = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('[LocalStorageFitnessAdapter] Falha ao carregar estado local:', e);
    }

    if (!state) {
      state = this._createDefaultState();
    }

    this._applyMigrations(state);
    return state;
  }

  saveState(state) {
    try {
      localStorage.setItem(this._storageKey, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('[LocalStorageFitnessAdapter] Falha ao persistir estado:', e);
      return false;
    }
  }

  getCrossAppWeight() {
    try {
      const raw = localStorage.getItem(this._crossAppKey);
      if (!raw) return null;
      const data = JSON.parse(raw);
      const weights = (data.pesos || []).slice().sort((a, b) => (a.d < b.d ? -1 : 1));
      if (weights.length) {
        return Number(weights[weights.length - 1].kg);
      }
      if (data.perfil && data.perfil.ini) {
        return Number(data.perfil.ini);
      }
    } catch (e) {
      console.warn('[LocalStorageFitnessAdapter] Falha ao ler peso de fit-systekna:', e);
    }
    return null;
  }

  syncWithSystekna(workoutSession, isDeleted = false) {
    try {
      const raw = localStorage.getItem(this._crossAppKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      data.treinos = data.treinos || [];

      const syncId = 'ff-' + workoutSession.id;
      const index = data.treinos.findIndex(x => x.id === syncId);

      if (isDeleted || !workoutSession.durationMinutes) {
        if (index >= 0) {
          data.treinos.splice(index, 1);
        }
      } else {
        const totalSets = workoutSession.totalSetsCount || 0;
        const entry = {
          id: syncId,
          d: workoutSession.isoDate,
          ts: workoutSession.timestamp,
          tipo: `Musculação · Fit Força (${workoutSession.exercises.length} exercício(s), ${totalSets} séries)`,
          ic: 'dumb',
          min: workoutSession.durationMinutes,
          kcal: workoutSession.caloriesBurned,
          src: 'fit-forca'
        };

        if (index >= 0) {
          data.treinos[index] = entry;
        } else {
          data.treinos.push(entry);
        }
      }

      localStorage.setItem(this._crossAppKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[LocalStorageFitnessAdapter] Falha ao sincronizar com fit-systekna:', e);
    }
  }

  _createDefaultState() {
    const h = 3600 * 1000;
    const now = Date.now();
    return {
      sample: true,
      mode: 'auto',
      plan: [],
      log: [
        {
          id: 's1',
          t: now - 20 * h,
          ex: [
            { n: 'Supino reto', m: 'peitoral-maior', sec: ['deltoides-geral', 'triceps-braquial-geral'], sets: [{ kg: 40, reps: 12 }, { kg: 40, reps: 12 }, { kg: 40, reps: 12 }, { kg: 40, reps: 12 }] },
            { n: 'Elevação lateral', m: 'deltoide-lateral', sec: [], sets: [{ kg: 8, reps: 12 }, { kg: 8, reps: 12 }, { kg: 8, reps: 12 }] },
            { n: 'Tríceps na polia', m: 'triceps-braquial-geral', sec: [], sets: [{ kg: 25, reps: 12 }, { kg: 25, reps: 12 }, { kg: 25, reps: 12 }] }
          ]
        },
        {
          id: 's2',
          t: now - 54 * h,
          ex: [
            { n: 'Puxada frontal', m: 'latissimo-do-dorso', sec: ['biceps-braquial'], sets: [{ kg: 45, reps: 12 }, { kg: 45, reps: 12 }, { kg: 45, reps: 12 }, { kg: 45, reps: 12 }] },
            { n: 'Remada sentada', m: 'latissimo-do-dorso', sec: ['romboides', 'biceps-braquial'], sets: [{ kg: 40, reps: 12 }, { kg: 40, reps: 12 }, { kg: 40, reps: 12 }] },
            { n: 'Rosca direta', m: 'biceps-braquial', sec: [], sets: [{ kg: 20, reps: 12 }, { kg: 20, reps: 12 }, { kg: 20, reps: 12 }] }
          ]
        },
        {
          id: 's3',
          t: now - 80 * h,
          ex: [
            { n: 'Leg press 45°', m: 'quadriceps-geral', sec: ['gluteo-maximo'], sets: [{ kg: 120, reps: 12 }, { kg: 120, reps: 12 }, { kg: 120, reps: 12 }, { kg: 120, reps: 12 }] },
            { n: 'Mesa flexora', m: 'isquiotibiais-geral', sec: [], sets: [{ kg: 35, reps: 12 }, { kg: 35, reps: 12 }, { kg: 35, reps: 12 }] },
            { n: 'Panturrilha em pé', m: 'gastrocnemio', sec: [], sets: [{ kg: 60, reps: 15 }, { kg: 60, reps: 15 }, { kg: 60, reps: 15 }] }
          ]
        }
      ],
      ult: {},
      hc: {},
      rest: 90,
      restEx: {},
      recH: {},
      noteEx: {},
      exC: [],
      exO: {},
      exDel: [],
      fichas: [],
      prog: { on: true, inc: 2.5 },
      met: 3.5,
      metV: 1,
      sync: true,
      autor: '',
      stO: {}
    };
  }

  _applyMigrations(state) {
    state.log = (state.log || []).map(w => ({
      ...w,
      ex: (w.ex || []).map(e => {
        if (Array.isArray(e.sets)) return e;
        return {
          n: e.n,
          m: e.m,
          sec: e.sec || [],
          sets: Array.from({ length: Number(e.sets) || 3 }, () => ({ kg: 0, reps: 0 }))
        };
      })
    }));

    state.plan = (state.plan || []).map(p => ({ ...p, sets: +p.sets || 3 }));
    state.ult = state.ult || {};
    state.hc = state.hc || {};
    state.rest = state.rest || 90;
    state.restEx = state.restEx || {};
    state.recH = state.recH || {};
    state.noteEx = state.noteEx || {};
    state.exC = state.exC || [];
    state.exO = state.exO || {};
    state.exDel = state.exDel || [];
    state.fichas = state.fichas || [];
    state.prog = state.prog || { on: true, inc: 2.5 };
    state.met = state.met || 3.5;
    if (!state.metV) {
      if (state.met === 5) state.met = 3.5;
      state.metV = 1;
    }
    if (state.sync === undefined) state.sync = true;
    state.autor = state.autor || '';
    state.stO = state.stO || {};
  }
}
