import { LocalStorageFitnessAdapter } from './infrastructure/storage/LocalStorageFitnessAdapter.js';
import { ExerciseService } from './application/services/ExerciseService.js';
import { WorkoutService } from './application/services/WorkoutService.js';
import { MuscleReadinessService } from './application/services/MuscleReadinessService.js';
import { RestTimerService } from './application/services/RestTimerService.js';
import { BottomSheet } from './ui/components/BottomSheet.js';
import { Toast } from './ui/components/Toast.js';
import { TodayViewController } from './ui/controllers/TodayViewController.js';
import { MusclesViewController } from './ui/controllers/MusclesViewController.js';
import { TrainingViewController } from './ui/controllers/TrainingViewController.js';
import { WeekViewController } from './ui/controllers/WeekViewController.js';
import { SettingsViewController } from './ui/controllers/SettingsViewController.js';
import { AppController } from './ui/controllers/AppController.js';

/**
 * Entrypoint Canônico da Aplicação Fit Força
 * Arquitetura Hexagonal com Injeção de Dependência via Construtor (SOLID)
 */
export class Program {
  constructor() {
    // 1. Camada de Infraestrutura (Adapters)
    this.storageAdapter = new LocalStorageFitnessAdapter();

    // 2. Camada de Aplicação (Use Cases & Services)
    this.exerciseService = new ExerciseService(this.storageAdapter);
    this.workoutService = new WorkoutService(this.storageAdapter, this.exerciseService);
    this.readinessService = new MuscleReadinessService(this.storageAdapter, this.exerciseService);
    this.timerService = new RestTimerService(this.storageAdapter.loadState().rest || 90);

    // 3. Componentes de UI Reutilizáveis
    this.bottomSheet = new BottomSheet(
      document.querySelector('#scrim'),
      document.querySelector('#sheet')
    );
    this.toast = new Toast(document.querySelector('#toast'));

    // 4. Controllers Especializados (Injeção de Dependências)
    this.todayController = new TodayViewController(
      this.storageAdapter,
      this.readinessService,
      this.exerciseService,
      this.bottomSheet,
      this.toast
    );

    this.musclesController = new MusclesViewController(
      this.storageAdapter,
      this.readinessService,
      this.exerciseService,
      this.bottomSheet,
      this.toast
    );

    this.trainingController = new TrainingViewController(
      this.storageAdapter,
      this.workoutService,
      this.exerciseService,
      this.timerService,
      this.bottomSheet,
      this.toast
    );

    this.weekController = new WeekViewController(
      this.storageAdapter,
      this.readinessService,
      this.exerciseService,
      this.bottomSheet
    );

    this.settingsController = new SettingsViewController(
      this.storageAdapter,
      this.bottomSheet,
      this.toast
    );

    // 5. Orquestrador Central de Interface
    this.appController = new AppController({
      todayController: this.todayController,
      musclesController: this.musclesController,
      trainingController: this.trainingController,
      weekController: this.weekController,
      settingsController: this.settingsController,
      restTimerService: this.timerService,
      bottomSheet: this.bottomSheet,
      toast: this.toast
    });
  }

  start() {
    this.appController.init();
    this.registerServiceWorker();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(err => {
        console.warn('[Program] Falha ao registrar Service Worker:', err);
      });
    }
  }
}

// Alias Canônico de Retrocompatibilidade
export const App = Program;

// Inicialização segura no carregamento do DOM
if (typeof window !== 'undefined') {
  const boot = () => {
    window.program = new Program();
    window.program.start();
  };
  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
}
