/**
 * Modelo Matemático de Estimativa de 1RM e Sobrecarga Progressiva
 */
export class OneRepMaxModel {
  /**
   * Fórmula de Epley para 1 Repetição Máxima (1RM):
   * 1RM = kg * (1 + (reps > 1 ? reps / 30 : 0))
   * Válido para reps entre 1 e 15.
   */
  static estimate1RM(kg, reps) {
    const weight = Number(kg) || 0;
    const r = Number(reps) || 0;
    if (weight <= 0 || r <= 0 || r > 15) return 0;
    return weight * (1 + (r > 1 ? r / 30 : 0));
  }

  /**
   * Sugestão de sobrecarga progressiva (+2.5 kg padrão)
   */
  static suggestNextLoad(lastKg, increment = 2.5) {
    const kg = Number(lastKg) || 0;
    return kg > 0 ? kg + Number(increment) : 0;
  }

  /**
   * Identifica se a série atual quebrou o recorde histórico pessoal de 1RM
   */
  static isPersonalRecord(exerciseName, currentKg, currentReps, historicalRecords = {}) {
    const current1RM = this.estimate1RM(currentKg, currentReps);
    if (current1RM <= 0) return false;

    const previousMax = historicalRecords[exerciseName] || 0;
    return current1RM > previousMax;
  }
}
