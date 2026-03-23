import createNS from '../utils/helpers/svg_elements';
import type { GlobalData, RefIdLayerData, SolidColorLayerData } from '../types/lottieRuntime';
import IImageElement from './ImageElement';

class ISolidElement extends IImageElement {
  declare data: SolidColorLayerData;
  declare layerElement: SVGElement;

  constructor(data: SolidColorLayerData, globalData: GlobalData, comp: unknown) {
    super(data as unknown as RefIdLayerData, globalData, comp);
  }

  createContent() {
    const rect = createNS('rect');
    /// /rect.style.width = this.data.sw;
    /// /rect.style.height = this.data.sh;
    /// /rect.style.fill = this.data.sc;
    rect.setAttribute('width', String(this.data.sw));
    rect.setAttribute('height', String(this.data.sh));
    rect.setAttribute('fill', this.data.sc);
    this.layerElement.appendChild(rect);
  }
}

export default ISolidElement;
