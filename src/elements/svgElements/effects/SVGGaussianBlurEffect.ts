import createNS from '../../../utils/helpers/svg_elements';
import type { GroupEffectLike } from '../../../types/lottieRuntime';

class SVGGaussianBlurEffect {
  declare filterManager: GroupEffectLike;
  declare feGaussianBlur: SVGElement;

  constructor(filter: SVGElement, filterManager: GroupEffectLike, _elem: unknown, id: string, _source?: string) {
    filter.setAttribute('x', '-100%');
    filter.setAttribute('y', '-100%');
    filter.setAttribute('width', '300%');
    filter.setAttribute('height', '300%');

    this.filterManager = filterManager;
    const feGaussianBlur = createNS('feGaussianBlur');
    feGaussianBlur.setAttribute('result', id);
    filter.appendChild(feGaussianBlur);
    this.feGaussianBlur = feGaussianBlur;
  }

  renderFrame(forceRender: boolean) {
    if (forceRender || this.filterManager._mdf) {
      const kBlurrinessToSigma = 0.3;
      const sigma = (this.filterManager.effectElements[0].p.v as number) * kBlurrinessToSigma;

      const dimensions = this.filterManager.effectElements[1].p.v as number;
      const sigmaX = dimensions == 3 ? 0 : sigma; // eslint-disable-line eqeqeq
      const sigmaY = dimensions == 2 ? 0 : sigma; // eslint-disable-line eqeqeq

      this.feGaussianBlur.setAttribute('stdDeviation', sigmaX + ' ' + sigmaY);

      const edgeMode = this.filterManager.effectElements[2].p.v == 1 ? 'wrap' : 'duplicate'; // eslint-disable-line eqeqeq
      this.feGaussianBlur.setAttribute('edgeMode', edgeMode);
    }
  }
}

export default SVGGaussianBlurEffect;
