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
}

extendPrototype([BaseElement, TransformElement, HierarchyElement, FrameElement], NullElement);

NullElement.prototype.prepareFrame = function (num) {
  this.prepareProperties(num, true);
};

NullElement.prototype.renderFrame = function () {};

NullElement.prototype.getBaseElement = function () {
  return null;
};

NullElement.prototype.destroy = function () {};

NullElement.prototype.sourceRectAtTime = function () {};

NullElement.prototype.hide = function () {};

export default NullElement;
