import { PUSH_GROUPS, PULL_GROUPS } from '../catalogs/ExerciseCatalog.js';

/**
 * Modelo de Análise de Volume Semanal, Balanço Push/Pull e Músculos Esquecidos
 */
export class WeeklyVolumeModel {
  /**
   * Calcula o volume de séries por grupo muscular nos últimos 7 dias
   */
  static calculate7DaysVolume(workouts = [], exercisesMap = {}, musclesMap = {}, now = Date.now()) {
    const sevenDaysAgo = now - 7 * 24 * 3600 * 1000;
    const recentWorkouts = workouts.filter(w => (Number(w.timestamp || w.t) || 0) >= sevenDaysAgo);

    const groupSets = {};
    let totalCalories = 0;
    let pushSets = 0;
    let pullSets = 0;

    recentWorkouts.forEach(w => {
      totalCalories += Number(w.caloriesBurned || w.kcal) || 0;
      const exList = w.exercises || w.ex || [];

      exList.forEach(e => {
        const setsCount = (e.sets || []).length;
        if (!setsCount) return;

        const exEntity = exercisesMap[e.name || e.n];
        const group = exEntity ? exEntity.group : (e.g || 'Outro');

        groupSets[group] = (groupSets[group] || 0) + setsCount;

        if (PUSH_GROUPS.includes(group)) {
          pushSets += setsCount;
        } else if (PULL_GROUPS.includes(group)) {
          pullSets += setsCount;
        }
      });
    });

    return {
      recentWorkoutsCount: recentWorkouts.length,
      totalCalories7Days: totalCalories,
      groupSets,
      pushSets,
      pullSets,
      pushPullRatio: pullSets > 0 ? (pushSets / pullSets) : (pushSets > 0 ? 99 : 1)
    };
  }

  /**
   * Identifica músculos sem estímulo há mais de 14 dias
   */
  static getForgottenMuscles(allMuscles = [], workouts = [], now = Date.now()) {
    const fourteenDaysAgo = now - 14 * 24 * 3600 * 1000;
    const lastStimulusMap = {};

    workouts.forEach(w => {
      const wTime = Number(w.timestamp || w.t) || 0;
      const exList = w.exercises || w.ex || [];

      exList.forEach(e => {
        const primary = e.primaryMuscleId || e.m;
        if (primary && (!lastStimulusMap[primary] || wTime > lastStimulusMap[primary])) {
          lastStimulusMap[primary] = wTime;
        }
        (e.secondaryMuscleIds || e.sec || []).forEach(sec => {
          if (!lastStimulusMap[sec] || wTime > lastStimulusMap[sec]) {
            lastStimulusMap[sec] = wTime;
          }
        });
      });
    });

    return allMuscles.filter(m => {
      const last = lastStimulusMap[m.id];
      return !last || last < fourteenDaysAgo;
    }).map(m => {
      const last = lastStimulusMap[m.id];
      const daysSince = last ? Math.floor((now - last) / (24 * 3600 * 1000)) : null;
      return {
        muscle: m,
        daysSince
      };
    });
  }
}
