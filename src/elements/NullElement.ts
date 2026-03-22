// @ts-nocheck
import { extendPrototype } from '../utils/functionExtensions';
import BaseElement from './BaseElement';
import TransformElement from './helpers/TransformElement';
import HierarchyElement from './helpers/HierarchyElement';
import FrameElement from './helpers/FrameElement';

class NullElement {
  constructor(data, globalData, comp) {
    this.initFrame();
    this.initBaseData(data, globalData, comp);
    this.initFrame();
    this.initTransform(data, globalData, comp);
    this.initHierarchy();
  }

  prepareFrame(num) {
    this.prepareProperties(num, true);
  }

  renderFrame() {}

  getBaseElement() {
    return null;
  }

  destroy() {}

  sourceRectAtTime() {}

  hide() {}
}

const nullSourceRectAtTime = NullElement.prototype.sourceRectAtTime;

extendPrototype([BaseElement, TransformElement, HierarchyElement, FrameElement], NullElement);

NullElement.prototype.sourceRectAtTime = nullSourceRectAtTime;

export default NullElement;
