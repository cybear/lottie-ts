// @ts-nocheck
import { extendPrototype } from '../../utils/functionExtensions';
import createTag from '../../utils/helpers/html_elements';
import RenderableElement from '../helpers/RenderableElement';
import BaseElement from '../BaseElement';
import TransformElement from '../helpers/TransformElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import CVBaseElement from './CVBaseElement';
import IImageElement from '../ImageElement';
import SVGShapeElement from '../svgElements/SVGShapeElement';

class CVImageElement {
  constructor(data, globalData, comp) {
    this.assetData = globalData.getAssetData(data.refId);
    this.img = globalData.imageLoader.getAsset(this.assetData);
    this.initElement(data, globalData, comp);
  }

  renderInnerContent() {
    this.canvasContext.drawImage(this.img, 0, 0);
  }

  createContent() {
    if (this.img.width && (this.assetData.w !== this.img.width || this.assetData.h !== this.img.height)) {
      const canvas = createTag('canvas');
      canvas.width = this.assetData.w;
      canvas.height = this.assetData.h;
      const ctx = canvas.getContext('2d');

      const imgW = this.img.width;
      const imgH = this.img.height;
      const imgRel = imgW / imgH;
      const canvasRel = this.assetData.w / this.assetData.h;
      let widthCrop;
      let heightCrop;
      const par = this.assetData.pr || this.globalData.renderConfig.imagePreserveAspectRatio;
      if ((imgRel > canvasRel && par === 'xMidYMid slice') || (imgRel < canvasRel && par !== 'xMidYMid slice')) {
        heightCrop = imgH;
        widthCrop = heightCrop * canvasRel;
      } else {
        widthCrop = imgW;
        heightCrop = widthCrop / canvasRel;
      }
      ctx.drawImage(
        this.img,
        (imgW - widthCrop) / 2,
        (imgH - heightCrop) / 2,
        widthCrop,
        heightCrop,
        0,
        0,
        this.assetData.w,
        this.assetData.h,
      );
      this.img = canvas;
    }
  }

  destroy() {
    this.img = null;
  }
}

const cvImageCreateContent = CVImageElement.prototype.createContent;
const cvImageDestroy = CVImageElement.prototype.destroy;

extendPrototype(
  [BaseElement, TransformElement, CVBaseElement, HierarchyElement, FrameElement, RenderableElement],
  CVImageElement,
);

CVImageElement.prototype.createContent = cvImageCreateContent;
CVImageElement.prototype.destroy = cvImageDestroy;

CVImageElement.prototype.initElement = SVGShapeElement.prototype.initElement;
CVImageElement.prototype.prepareFrame = IImageElement.prototype.prepareFrame;

export default CVImageElement;
