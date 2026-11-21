import { WebAudioTimerAdapter } from '../../infrastructure/audio/WebAudioTimerAdapter.js';

/**
 * Serviço de Aplicação: Cronômetro de Descanso entre Séries
 */
export class RestTimerService {
  constructor(defaultRestSeconds = 90) {
    this._defaultSeconds = defaultRestSeconds;
    this._secondsLeft = 0;
    this._targetEnd = 0;
    this._intervalId = null;
    this._listeners = new Set();
  }

  get isRunning() {
    return this._secondsLeft > 0 && !!this._intervalId;
  }

  get secondsLeft() {
    return this._secondsLeft;
  }

  get formattedTime() {
    const mins = Math.floor(this._secondsLeft / 60);
    const secs = String(this._secondsLeft % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  }

  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  start(seconds = null) {
    this.stop();
    const duration = seconds !== null ? Number(seconds) : this._defaultSeconds;
    this._secondsLeft = Math.max(1, duration);
    this._targetEnd = Date.now() + this._secondsLeft * 1000;

    this._notify();

    this._intervalId = setInterval(() => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((this._targetEnd - now) / 1000));
      this._secondsLeft = left;
      this._notify();

      if (left <= 0) {
        this.stop();
        WebAudioTimerAdapter.playRestCompletedAlert();
      }
    }, 250);
  }

  addTime(seconds = 30) {
    if (!this.isRunning) {
      this.start(seconds);
      return;
    }
    this._targetEnd += seconds * 1000;
    this._secondsLeft += seconds;
    this._notify();
  }

  stop() {
    if (this._intervalId) {
      clearInterval(this._intervalId);
      this._intervalId = null;
    }
    this._secondsLeft = 0;
    this._notify();
  }

  _notify() {
    this._listeners.forEach(cb => {
      try {
        cb({
          isRunning: this.isRunning,
          secondsLeft: this._secondsLeft,
          formatted: this.formattedTime
        });
      } catch (e) {
        console.error('[RestTimerService] Erro no listener:', e);
      }
    });
  }
}
