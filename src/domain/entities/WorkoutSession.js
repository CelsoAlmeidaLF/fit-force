/**
 * Entidade Canônica WorkoutSession (Sessão de Treino)
 */
export class WorkoutSession {
  constructor(data = {}) {
    this.id = data.id || ('w_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    this.timestamp = data.t || Date.now();
    this.durationMinutes = data.min || 0;
    this.caloriesBurned = data.kcal || 0;
    this.met = data.met || 3.5;
    this.exercises = (data.ex || []).map(e => ({
      name: e.n || e.name,
      primaryMuscleId: e.m || e.primaryMuscleId,
      secondaryMuscleIds: e.sec || e.secondaryMuscleIds || [],
      sets: (e.sets || []).map(s => ({
        kg: Number(s.kg) || 0,
        reps: Number(s.reps) || 0,
        done: !!s.done
      }))
    }));
    this.note = data.note || '';
  }

  get totalSetsCount() {
    return this.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  }

  get completedSetsCount() {
    return this.exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.done).length, 0);
  }

  get isoDate() {
    const d = new Date(this.timestamp);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
  }

  toRaw() {
    return {
      id: this.id,
      t: this.timestamp,
      min: this.durationMinutes,
      kcal: this.caloriesBurned,
      met: this.met,
      note: this.note,
      ex: this.exercises.map(e => ({
        n: e.name,
        m: e.primaryMuscleId,
        sec: e.secondaryMuscleIds,
        sets: e.sets.map(s => ({ kg: s.kg, reps: s.reps }))
      }))
    };
  }
}
