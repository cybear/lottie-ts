import { copyPrototypeDescriptors } from '../../utils/functionExtensions';
import createNS from '../../utils/helpers/svg_elements';
import createTag from '../../utils/helpers/html_elements';
import type { GlobalData, SolidColorLayerData } from '../../types/lottieRuntime';
import BaseElement from '../BaseElement';
import TransformElement from '../helpers/TransformElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import RenderableDOMElement from '../helpers/RenderableDOMElement';
import HBaseElement from './HBaseElement';

class HSolidElement {
  declare initElement: (data: SolidColorLayerData, globalData: GlobalData, comp: unknown) => void;
  declare data: SolidColorLayerData;
  declare layerElement: HTMLElement | SVGElement;
  declare svgElement: SVGElement;

  constructor(data: SolidColorLayerData, globalData: GlobalData, comp: unknown) {
    this.initElement(data, globalData, comp);
  }

  createContent() {
    let rect: HTMLElement | SVGElement;
    if (this.data.hasMask) {
      rect = createNS('rect');
      rect.setAttribute('width', String(this.data.sw));
      rect.setAttribute('height', String(this.data.sh));
      rect.setAttribute('fill', this.data.sc);
      this.svgElement.setAttribute('width', String(this.data.sw));
      this.svgElement.setAttribute('height', String(this.data.sh));
    } else {
      rect = createTag('div');
      rect.style.width = `${this.data.sw}px`;
      rect.style.height = `${this.data.sh}px`;
      rect.style.backgroundColor = this.data.sc;
    }
    this.layerElement.appendChild(rect);
  }
}
copyPrototypeDescriptors(
  [BaseElement, TransformElement, HBaseElement, HierarchyElement, FrameElement, RenderableDOMElement],
  HSolidElement,
);

export default HSolidElement;
