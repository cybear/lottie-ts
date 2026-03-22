import { extendPrototype } from '../utils/functionExtensions';
import type { ElementData, GlobalData } from '../types/lottieRuntime';
import BaseElement from './BaseElement';
import TransformElement from './helpers/TransformElement';
import HierarchyElement from './helpers/HierarchyElement';
import FrameElement from './helpers/FrameElement';

class NullElement {
  declare initFrame: () => void;
  declare initBaseData: (data: ElementData, globalData: GlobalData, comp: unknown) => void;
  declare initTransform: (data: ElementData, globalData: GlobalData, comp: unknown) => void;
  declare initHierarchy: () => void;
  declare prepareProperties: (num: number, isVisible: boolean) => void;

  constructor(data: ElementData, globalData: GlobalData, comp: unknown) {
    this.initFrame();
    this.initBaseData(data, globalData, comp);
    this.initFrame();
    this.initTransform(data, globalData, comp);
    this.initHierarchy();
  }

  prepareFrame(num: number) {
    this.prepareProperties(num, true);
  }

  renderFrame() {}

  getBaseElement(): null {
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
