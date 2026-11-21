/**
 * Entidade Canônica Muscle (Domínio Puro)
 */
export class Muscle {
  constructor(data) {
    this.id = data.id;
    this.name = data.n;
    this.category = data.c;
    this.region = data.r;
    this.view = data.v; // 'anterior' | 'posterior'
    this.description = data.d;
    this.movementPattern = data.p;
    this.recoveryHours = data.h || 48;
    this.synergists = data.s || [];
    this.tip = data.dica || '';
    this.regionGroup = data.reg;
    this.group = data.g;
  }

  isPrimaryFor(exercise) {
    return exercise.primaryMuscleId === this.id;
  }

  isSecondaryFor(exercise) {
    return (exercise.secondaryMuscleIds || []).includes(this.id);
  }
}
