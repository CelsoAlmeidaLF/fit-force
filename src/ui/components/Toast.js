/**
 * Componente Reutilizável de Notificação Toast
 */
export class Toast {
  constructor(toastElement) {
    this._el = toastElement;
    this._textEl = toastElement ? toastElement.querySelector('#tTxt') : null;
    this._undoBtn = toastElement ? toastElement.querySelector('#tUndo') : null;
    this._timeoutId = null;

    if (this._undoBtn) {
      this._undoBtn.addEventListener('click', () => {
        if (this._onUndo) {
          this._onUndo();
          this.hide();
        }
      });
    }
  }

  show(message, onUndo = null, durationMs = 4000) {
    if (!this._el) return;

    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }

    if (this._textEl) {
      this._textEl.textContent = message;
    }

    this._onUndo = onUndo;
    if (this._undoBtn) {
      this._undoBtn.style.display = onUndo ? 'inline-block' : 'none';
    }

    this._el.classList.add('on');
    this._timeoutId = setTimeout(() => {
      this.hide();
    }, durationMs);
  }

  hide() {
    if (this._el) {
      this._el.classList.remove('on');
    }
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this._onUndo = null;
  }
}
