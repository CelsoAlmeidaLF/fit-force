import { WorkoutSession } from '../../domain/entities/WorkoutSession.js';
import { CalorieCalculatorModel } from '../../domain/models/CalorieCalculatorModel.js';
import { OneRepMaxModel } from '../../domain/models/OneRepMaxModel.js';

/**
 * Serviço de Aplicação: Orquestração do Ciclo de Vida do Treino e Histórico
 */
export class WorkoutService {
  constructor(storageAdapter, exerciseService) {
    this._storage = storageAdapter;
    this._exerciseService = exerciseService;
    this._activeSession = null;
  }

  getActiveSession() {
    return this._activeSession;
  }

  startSession(initialExercises = [], met = 3.5) {
    this._activeSession = new WorkoutSession({
      t: Date.now(),
      met: met,
      ex: initialExercises.map(e => ({
        n: e.name || e.n,
        m: e.primaryMuscleId || e.m,
        sec: e.secondaryMuscleIds || e.sec || [],
        sets: (e.sets || []).map(s => ({ kg: s.kg || 0, reps: s.reps || 0, done: false }))
      }))
    });
    return this._activeSession;
  }

  addExerciseToActiveSession(exercise, defaultSetsCount = 3, defaultKg = 0, defaultReps = 10) {
    if (!this._activeSession) return null;

    const parsed = exercise.parseDefaultSeries ? exercise.parseDefaultSeries() : { setsCount: defaultSetsCount, reps: defaultReps };
    const sets = Array.from({ length: parsed.setsCount }, () => ({
      kg: defaultKg,
      reps: parsed.reps,
      done: false
    }));

    this._activeSession.exercises.push({
      name: exercise.name,
      primaryMuscleId: exercise.primaryMuscleId,
      secondaryMuscleIds: exercise.secondaryMuscleIds,
      sets
    });

    return this._activeSession;
  }

  finishSession(durationMinutes, bodyWeightKg) {
    if (!this._activeSession) return null;

    this._activeSession.durationMinutes = Math.max(1, Number(durationMinutes) || 1);
    this._activeSession.caloriesBurned = CalorieCalculatorModel.calculateTotalCalories(
      this._activeSession.durationMinutes,
      bodyWeightKg,
      this._activeSession.met
    );

    const raw = this._activeSession.toRaw();
    const state = this._storage.loadState();
    state.log.unshift(raw);

    // Atualizar últimas cargas e recordes
    this.recomputeHistoricalRecords(state);

    this._storage.saveState(state);
    this._storage.syncWithSystekna(this._activeSession, false);

    const completed = this._activeSession;
    this._activeSession = null;
    return completed;
  }

  cancelActiveSession() {
    this._activeSession = null;
  }

  recomputeHistoricalRecords(state) {
    const sortedLog = [...state.log].sort((a, b) => a.t - b.t);
    const hc = {};
    const ult = {};

    sortedLog.forEach(w => {
      const d = new Date(w.t).toISOString().slice(0, 10);
      (w.ex || []).forEach(x => {
        if (!x.sets || !x.sets.length) return;

        ult[x.n] = x.sets.map(s => ({ kg: Number(s.kg) || 0, reps: Number(s.reps) || 0 }));

        x.sets.forEach(s => {
          const e = OneRepMaxModel.estimate1RM(s.kg, s.reps);
          if (e > 0 && (!hc[x.n] || e > hc[x.n].e)) {
            hc[x.n] = {
              kg: Number(s.kg),
              reps: Number(s.reps),
              e,
              d,
              t: w.t
            };
          }
        });
      });
    });

    state.hc = hc;
    state.ult = ult;
    return { hc, ult };
  }
}
