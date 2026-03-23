import { copyPrototypeDescriptors } from '../../utils/functionExtensions';
import RenderableElement from '../helpers/RenderableElement';
import BaseElement from '../BaseElement';
import TransformElement from '../helpers/TransformElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import CVBaseElement from './CVBaseElement';
import IImageElement from '../ImageElement';
import SVGShapeElement from '../svgElements/SVGShapeElement';
import type { GlobalData, GlobalDataCanvasLayer, SolidColorLayerData } from '../../types/lottieRuntime';

class CVSolidElement {
  declare initElement: (data: SolidColorLayerData, globalData: GlobalData, comp: unknown) => void;
  declare prepareFrame: (num: number) => void;
  declare globalData: GlobalDataCanvasLayer;
  declare data: SolidColorLayerData;

  constructor(data: SolidColorLayerData, globalData: GlobalDataCanvasLayer, comp: unknown) {
    this.initElement(data, globalData, comp);
  }

  renderInnerContent() {
    this.globalData.renderer.ctxFillStyle(this.data.sc);
    this.globalData.renderer.ctxFillRect(0, 0, this.data.sw, this.data.sh);
  }
}
copyPrototypeDescriptors(
  [BaseElement, TransformElement, CVBaseElement, HierarchyElement, FrameElement, RenderableElement],
  CVSolidElement,
);

CVSolidElement.prototype.initElement = (
  SVGShapeElement.prototype as unknown as { initElement: CVSolidElement['initElement'] }
).initElement;
CVSolidElement.prototype.prepareFrame = (
  IImageElement.prototype as unknown as { prepareFrame: CVSolidElement['prepareFrame'] }
).prepareFrame;

export default CVSolidElement;
