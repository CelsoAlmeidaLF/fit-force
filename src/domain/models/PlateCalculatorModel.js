/**
 * Modelo Matemático de Calculadora de Anilhas para Barra Olímpica
 */
export class PlateCalculatorModel {
  static AVAILABLE_PLATES = [20, 15, 10, 5, 2.5, 1.25];

  /**
   * Calcula a combinação de anilhas necessárias por lado da barra
   * @param {number} targetTotalKg Peso total desejado (ex: 60 kg)
   * @param {number} barWeightKg Peso da barra (padrão: 20 kg)
   * @returns {Object} { perSideTotalKg, plates: [{ kg, count }], achievedTotalKg }
   */
  static calculatePlates(targetTotalKg, barWeightKg = 20) {
    const target = Number(targetTotalKg) || 0;
    const bar = Number(barWeightKg) || 20;

    if (target <= bar) {
      return {
        perSideTotalKg: 0,
        plates: [],
        achievedTotalKg: bar
      };
    }

    let remainingPerSide = (target - bar) / 2;
    const plates = [];
    let achievedPerSide = 0;

    for (const plateKg of this.AVAILABLE_PLATES) {
      if (remainingPerSide >= plateKg) {
        const count = Math.floor(remainingPerSide / plateKg);
        plates.push({ kg: plateKg, count });
        const used = count * plateKg;
        remainingPerSide -= used;
        achievedPerSide += used;
      }
    }

    return {
      perSideTotalKg: achievedPerSide,
      plates,
      achievedTotalKg: bar + (achievedPerSide * 2)
    };
  }
}
