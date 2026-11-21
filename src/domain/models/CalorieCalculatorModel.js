import { COMPOUND_REGEX } from '../catalogs/ExerciseCatalog.js';

/**
 * Modelo Matemático de Cálculo de Gasto Calórico e MET (Compêndio 2024)
 */
export class CalorieCalculatorModel {
  static MET_LEVELS = {
    3.5: 'Leve',
    5.0: 'Moderado',
    6.0: 'Vigoroso'
  };

  /**
   * Calcula o gasto calórico total do treino:
   * kcal = MET * peso (kg) * duração (min) / 60
   */
  static calculateTotalCalories(durationMinutes, bodyWeightKg, met = 3.5) {
    if (!durationMinutes || durationMinutes <= 0 || !bodyWeightKg || bodyWeightKg <= 0) {
      return 0;
    }
    return Math.round((Number(met) || 3.5) * Number(bodyWeightKg) * (Number(durationMinutes) || 0) / 60);
  }

  /**
   * Determina o MET específico do exercício
   */
  static getExerciseMet(exerciseName, muscleRecoveryHours = 48) {
    if (COMPOUND_REGEX.test(exerciseName) || muscleRecoveryHours >= 72) {
      return 5.0; // Exercício multiarticular ou grupamento de grande porte
    }
    return 3.5; // Exercício isolador / acessório
  }

  /**
   * Estima o tempo em segundos gasto no exercício
   */
  static estimateExerciseSeconds(exercise, sets, restBetweenSetsSeconds = 90) {
    const setsCount = (sets || []).length;
    if (setsCount === 0) return 0;

    const parsed = exercise && typeof exercise.parseDefaultSeries === 'function'
      ? exercise.parseDefaultSeries()
      : { reps: 10, unit: 'reps' };

    const activeSeconds = sets.reduce((total, s) => {
      const reps = Number(s.reps) || parsed.reps || 10;
      if (parsed.unit === 'min') return total + reps * 60;
      if (parsed.unit === 's') return total + reps;
      return total + reps * 3; // Média de 3 segundos por repetição concêntrica/excêntrica
    }, 0);

    const restSeconds = Math.max(0, setsCount - 1) * restBetweenSetsSeconds + 60;
    return activeSeconds + restSeconds;
  }

  /**
   * Rateia as calorias totais do treino entre cada exercício proporcionalmente ao tempo e intensidade
   */
  static calculatePerExerciseCalories(workout, exercisesMap, defaultMet = 3.5, defaultRest = 90) {
    if (!workout.caloriesBurned || !workout.exercises || workout.exercises.length === 0) {
      return (workout.exercises || []).map(() => 0);
    }

    const sessionMet = workout.met || defaultMet;
    const weights = workout.exercises.map(ex => {
      const exEntity = exercisesMap[ex.name];
      const exSpecificMet = exEntity ? this.getExerciseMet(ex.name) : sessionMet;
      const durationSec = this.estimateExerciseSeconds(exEntity, ex.sets, defaultRest);
      return durationSec * (exSpecificMet || sessionMet);
    });

    const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;
    return weights.map(w => Math.round(workout.caloriesBurned * w / totalWeight));
  }
}
