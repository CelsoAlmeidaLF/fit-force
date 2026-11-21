/**
 * Componente Reutilizável de Modal Bottom Sheet
 */
export class BottomSheet {
  constructor(scrimElement, sheetElement) {
    this._scrim = scrimElement;
    this._sheet = sheetElement;
    this._body = sheetElement ? sheetElement.querySelector('#shB') : null;
    this._isOpen = false;
    this._onCloseCallback = null;

    if (this._scrim) {
      this._scrim.addEventListener('click', () => this.close());
    }
  }

  isOpen() {
    return this._isOpen;
  }

  open(contentHtml, onClose = null) {
    if (!this._sheet || !this._scrim) return;

    this._onCloseCallback = onClose;
    if (this._body) {
      this._body.innerHTML = contentHtml;
    }

    this._scrim.classList.add('on');
    this._sheet.classList.add('on');
    this._isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    if (!this._isOpen || !this._sheet || !this._scrim) return;

    this._scrim.classList.remove('on');
    this._sheet.classList.remove('on');
    this._isOpen = false;
    document.body.style.overflow = '';

    if (this._onCloseCallback) {
      this._onCloseCallback();
      this._onCloseCallback = null;
    }
  }
}
