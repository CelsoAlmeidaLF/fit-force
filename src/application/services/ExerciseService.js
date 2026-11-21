import { Exercise } from '../../domain/entities/Exercise.js';
import { EXERCISE_CATALOG } from '../../domain/catalogs/ExerciseCatalog.js';

/**
 * Serviço de Aplicação: Gerenciamento do Catálogo e Customização de Exercícios
 */
export class ExerciseService {
  constructor(storageAdapter) {
    this._storage = storageAdapter;
  }

  getAllExercises() {
    const state = this._storage.loadState();
    const overrides = state.exO || {};
    const deletedIds = state.exDel || [];
    const customList = state.exC || [];

    // Base do catálogo
    const baseList = EXERCISE_CATALOG.map((e, i) => {
      const id = 'x' + i;
      const o = overrides[id];
      return new Exercise({
        id,
        ...e,
        ...(o || {}),
        ed: !!o
      });
    }).filter(e => !deletedIds.includes(e.id));

    // Customizados
    const customEntities = customList.map(e => new Exercise({
      ...e,
      meu: 1
    }));

    return [...baseList, ...customEntities];
  }

  getExercisesMap() {
    const map = {};
    this.getAllExercises().forEach(ex => {
      map[ex.name] = ex;
    });
    return map;
  }

  getExerciseByName(name) {
    return this.getAllExercises().find(e => e.name === name);
  }

  getExerciseById(id) {
    return this.getAllExercises().find(e => e.id === id);
  }

  getExercisesForMuscle(muscleId) {
    return this.getAllExercises().filter(e =>
      e.primaryMuscleId === muscleId || (e.secondaryMuscleIds || []).includes(muscleId)
    );
  }

  addCustomExercise(data) {
    const state = this._storage.loadState();
    state.exC = state.exC || [];

    const id = 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newEx = {
      id,
      nome: data.nome.trim(),
      g: data.g,
      m: data.m,
      sec: data.sec || [],
      pad: data.pad || '',
      sr: data.sr || '3 × 10',
      dica: data.dica || '',
      meu: 1
    };

    state.exC.push(newEx);
    this._storage.saveState(state);
    return new Exercise(newEx);
  }

  updateExercise(id, data) {
    const state = this._storage.loadState();
    const isCustom = id.startsWith('c_');

    if (isCustom) {
      state.exC = (state.exC || []).map(e => (e.id === id ? { ...e, ...data } : e));
    } else {
      state.exO = state.exO || {};
      state.exO[id] = { ...(state.exO[id] || {}), ...data };
    }

    this._storage.saveState(state);
    return this.getExerciseById(id);
  }

  deleteExercise(id) {
    const state = this._storage.loadState();
    if (id.startsWith('c_')) {
      state.exC = (state.exC || []).filter(e => e.id !== id);
    } else {
      state.exDel = state.exDel || [];
      if (!state.exDel.includes(id)) {
        state.exDel.push(id);
      }
    }
    this._storage.saveState(state);
  }
}
