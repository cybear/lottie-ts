import type { ElementData, GlobalData } from '../types/lottieRuntime';
import BaseElement from './BaseElement';
import TransformElement from './helpers/TransformElement';
import HierarchyElement from './helpers/HierarchyElement';
import FrameElement from './helpers/FrameElement';

class NullElement extends BaseElement {
  declare initFrame: () => void;
  declare initTransform: (data: ElementData, globalData: GlobalData, comp: unknown) => void;
  declare initHierarchy: () => void;
  declare prepareProperties: (num: number, isVisible: boolean) => void;

  constructor(data: ElementData, globalData: GlobalData, comp: unknown) {
    super();
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
const getRequiredDescriptor = (proto: object, key: string): PropertyDescriptor => {
  const desc = Object.getOwnPropertyDescriptor(proto, key);
  if (!desc) {
    throw new Error(`Missing descriptor for ${key}`);
  }
  return desc;
};

Object.defineProperties(NullElement.prototype, {
  initFrame: getRequiredDescriptor(FrameElement.prototype, 'initFrame'),
  prepareProperties: getRequiredDescriptor(FrameElement.prototype, 'prepareProperties'),
  addDynamicProperty: getRequiredDescriptor(FrameElement.prototype, 'addDynamicProperty'),
  initTransform: getRequiredDescriptor(TransformElement.prototype, 'initTransform'),
  renderTransform: getRequiredDescriptor(TransformElement.prototype, 'renderTransform'),
  renderLocalTransform: getRequiredDescriptor(TransformElement.prototype, 'renderLocalTransform'),
  searchEffectTransforms: getRequiredDescriptor(TransformElement.prototype, 'searchEffectTransforms'),
  globalToLocal: getRequiredDescriptor(TransformElement.prototype, 'globalToLocal'),
  initHierarchy: getRequiredDescriptor(HierarchyElement.prototype, 'initHierarchy'),
  setHierarchy: getRequiredDescriptor(HierarchyElement.prototype, 'setHierarchy'),
  setAsParent: getRequiredDescriptor(HierarchyElement.prototype, 'setAsParent'),
  checkParenting: getRequiredDescriptor(HierarchyElement.prototype, 'checkParenting'),
});

NullElement.prototype.sourceRectAtTime = nullSourceRectAtTime;

export default NullElement;
