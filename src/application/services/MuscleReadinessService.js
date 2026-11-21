import { MuscleRecoveryModel } from '../../domain/models/MuscleRecoveryModel.js';
import { WeeklyVolumeModel } from '../../domain/models/WeeklyVolumeModel.js';
import { MUSCLE_CATALOG, MUSCLE_BY_ID } from '../../domain/catalogs/MuscleCatalog.js';

/**
 * Serviço de Aplicação: Prontidão Muscular e Monitoramento de Volume
 */
export class MuscleReadinessService {
  constructor(storageAdapter, exerciseService) {
    this._storage = storageAdapter;
    this._exerciseService = exerciseService;
  }

  getFatigueMap() {
    const state = this._storage.loadState();
    return MuscleRecoveryModel.computeFatigue(state.log, MUSCLE_BY_ID, state.recH);
  }

  getMuscleStatus(muscleId) {
    const state = this._storage.loadState();
    const fatigue = this.getFatigueMap();
    return MuscleRecoveryModel.getMuscleStatus(muscleId, fatigue, state.stO);
  }

  getAllMusclesStatus() {
    const state = this._storage.loadState();
    const fatigue = this.getFatigueMap();
    const result = {};

    MUSCLE_CATALOG.forEach(m => {
      result[m.id] = {
        muscle: m,
        status: MuscleRecoveryModel.getMuscleStatus(m.id, fatigue, state.stO)
      };
    });

    return result;
  }

  setManualOverride(muscleId, statusKey, durationHours = 48) {
    const state = this._storage.loadState();
    state.stO = state.stO || {};

    const now = Date.now();
    state.stO[muscleId] = {
      k: statusKey,
      t: now,
      ate: durationHours ? now + durationHours * 3600 * 1000 : null
    };

    this._storage.saveState(state);
    return state.stO[muscleId];
  }

  clearManualOverride(muscleId) {
    const state = this._storage.loadState();
    if (state.stO && state.stO[muscleId]) {
      delete state.stO[muscleId];
      this._storage.saveState(state);
    }
  }

  setAllReady() {
    const state = this._storage.loadState();
    state.stO = {};
    MUSCLE_CATALOG.forEach(m => {
      state.stO[m.id] = { k: 'ok', t: Date.now() };
    });
    this._storage.saveState(state);
  }

  resetAllToAutomatic() {
    const state = this._storage.loadState();
    state.stO = {};
    this._storage.saveState(state);
  }

  getWeeklyVolumeReport() {
    const state = this._storage.loadState();
    const exercisesMap = this._exerciseService.getExercisesMap();
    return WeeklyVolumeModel.calculate7DaysVolume(state.log, exercisesMap, MUSCLE_BY_ID);
  }

  getForgottenMusclesReport() {
    const state = this._storage.loadState();
    return WeeklyVolumeModel.getForgottenMuscles(MUSCLE_CATALOG, state.log);
  }
}
