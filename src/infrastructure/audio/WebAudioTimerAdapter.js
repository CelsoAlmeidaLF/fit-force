/**
 * Adaptador de Áudio e Feedback Háptico para Cronômetro
 */
export class WebAudioTimerAdapter {
  static playRestCompletedAlert() {
    // 1. Alerta Sonoro via Web Audio API
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        [0, 0.25, 0.5].forEach(t => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 880; // Lá 5
          osc.connect(gain);
          gain.connect(ctx.destination);
          gain.gain.setValueAtTime(0.18, ctx.currentTime + t);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2);
          osc.start(ctx.currentTime + t);
          osc.stop(ctx.currentTime + t + 0.21);
        });
      }
    } catch (e) {
      // Ignorar fallback silencioso
    }

    // 2. Vibração Háptica
    try {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      // Ignorar
    }
  }
}
