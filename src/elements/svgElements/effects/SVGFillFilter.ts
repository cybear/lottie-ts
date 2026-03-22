import createNS from '../../../utils/helpers/svg_elements';
import type { GroupEffectLike } from '../../../types/lottieRuntime';

class SVGFillFilter {
  declare filterManager: GroupEffectLike;
  declare matrixFilter: SVGElement;

  constructor(filter: SVGElement, filterManager: GroupEffectLike, _elem: unknown, id: string, _source?: string) {
    this.filterManager = filterManager;
    const feColorMatrix = createNS('feColorMatrix');
    feColorMatrix.setAttribute('type', 'matrix');
    feColorMatrix.setAttribute('color-interpolation-filters', 'sRGB');
    feColorMatrix.setAttribute('values', '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0');
    feColorMatrix.setAttribute('result', id);
    filter.appendChild(feColorMatrix);
    this.matrixFilter = feColorMatrix;
  }

  renderFrame(forceRender: boolean) {
    if (forceRender || this.filterManager._mdf) {
      const color = this.filterManager.effectElements[2].p.v as number[];
      const opacity = this.filterManager.effectElements[6].p.v as number;
      this.matrixFilter.setAttribute(
        'values',
        '0 0 0 0 ' + color[0] + ' 0 0 0 0 ' + color[1] + ' 0 0 0 0 ' + color[2] + ' 0 0 0 ' + opacity + ' 0',
      );
    }
  }
}

export default SVGFillFilter;
