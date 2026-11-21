import { BODY_DIAGRAM, BODY_VIEW_MAP } from '../../domain/catalogs/BodyDiagramCatalog.js';

/**
 * Componente Visual de Renderização Anatômica SVG (Corpo Humano Anterior e Posterior)
 */
export class SvgBodyRenderer {
  static WIDTH = 361.156;
  static HEIGHT = 541.867;

  /**
   * Renderiza os layers de imagem de fundo para o modo claro e escuro
   */
  static renderBackgroundImages(bodyViewData) {
    const w = this.WIDTH;
    const h = this.HEIGHT;
    return `
      <image class="lt" href="${bodyViewData.img.light}" width="${w}" height="${h}"/>
      <image class="dk" href="${bodyViewData.img.dark}" width="${w}" height="${h}"/>
    `;
  }

  /**
   * Renderiza o minimapa anatômico destacando as regiões selecionadas
   */
  static renderMiniBody(regionIds = []) {
    if (!regionIds.length) return '';
    const viewKey = BODY_VIEW_MAP[regionIds[0]] || 'front';
    const bodyView = BODY_DIAGRAM[viewKey];

    const pathsHtml = bodyView.m
      .filter(r => regionIds.includes(r.id))
      .map(r => `<path d="${r.d}"/>`)
      .join('');

    return `
      <div class="body">
        <svg viewBox="0 0 ${this.WIDTH} ${this.HEIGHT}">
          ${this.renderBackgroundImages(bodyView)}
          ${pathsHtml}
        </svg>
      </div>
    `;
  }

  /**
   * Renderiza a visão anatômica completa destacando grupos musculares por estado (ok, warn, bad)
   */
  static renderFullInteractiveView(viewKey = 'front', muscleStatusMap = {}) {
    const bodyView = BODY_DIAGRAM[viewKey];
    if (!bodyView) return '';

    const regionsHtml = bodyView.m.map(region => {
      const statusInfo = muscleStatusMap[region.id] || { key: 'new' };
      const statusClass = statusInfo.key || 'new';

      return `
        <g class="m-reg k-${statusClass}" data-reg="${region.id}">
          <path d="${region.d}"/>
        </g>
      `;
    }).join('');

    return `
      <svg viewBox="0 0 ${this.WIDTH} ${this.HEIGHT}">
        ${this.renderBackgroundImages(bodyView)}
        ${regionsHtml}
      </svg>
    `;
  }
}
