/**
 * Porta Canônica de Persistência (Interface Segregation)
 */
export class IFitnessStoragePort {
  loadState() {
    throw new Error('Método loadState() não implementado.');
  }

  saveState(state) {
    throw new Error('Método saveState() não implementado.');
  }

  getCrossAppWeight() {
    throw new Error('Método getCrossAppWeight() não implementado.');
  }

  syncWithSystekna(workoutSession, isDeleted = false) {
    throw new Error('Método syncWithSystekna() não implementado.');
  }
}
