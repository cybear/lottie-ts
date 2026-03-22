// @ts-nocheck
import { extendPrototype } from '../utils/functionExtensions';
import createNS from '../utils/helpers/svg_elements';
import IImageElement from './ImageElement';

class ISolidElement {
  constructor(data, globalData, comp) {
    this.initElement(data, globalData, comp);
  }

  createContent() {
    const rect = createNS('rect');
    /// /rect.style.width = this.data.sw;
    /// /rect.style.height = this.data.sh;
    /// /rect.style.fill = this.data.sc;
    rect.setAttribute('width', this.data.sw);
    rect.setAttribute('height', this.data.sh);
    rect.setAttribute('fill', this.data.sc);
    this.layerElement.appendChild(rect);
  }
}

const solidCreateContent = ISolidElement.prototype.createContent;
extendPrototype([IImageElement], ISolidElement);
ISolidElement.prototype.createContent = solidCreateContent;

export default ISolidElement;
