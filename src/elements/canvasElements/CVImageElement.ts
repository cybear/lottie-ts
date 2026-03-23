import { prototypeChainInheritanceOrder } from '../../utils/functionExtensions';
import createTag from '../../utils/helpers/html_elements';
import RenderableElement from '../helpers/RenderableElement';
import BaseElement from '../BaseElement';
import TransformElement from '../helpers/TransformElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import CVBaseElement from './CVBaseElement';
import IImageElement from '../ImageElement';
import SVGShapeElement from '../svgElements/SVGShapeElement';
import type { GlobalData, GlobalDataCanvasImage, ImageAssetData, RefIdLayerData } from '../../types/lottieRuntime';

type CanvasImageSourceLike = CanvasImageSource;

function readCanvasImageSize(img: CanvasImageSource): { width: number; height: number } {
  if (
    img instanceof HTMLImageElement ||
    img instanceof HTMLVideoElement ||
    img instanceof HTMLCanvasElement ||
    (typeof ImageBitmap !== 'undefined' && img instanceof ImageBitmap) ||
    (typeof OffscreenCanvas !== 'undefined' && img instanceof OffscreenCanvas)
  ) {
    return { width: img.width, height: img.height };
  }
  const vf = img as VideoFrame;
  return { width: vf.displayWidth, height: vf.displayHeight };
}

class CVImageElement {
  declare assetData: ImageAssetData;
  declare img: CanvasImageSourceLike;
  declare initElement: (data: RefIdLayerData, globalData: GlobalData, comp: unknown) => void;
  declare prepareFrame: (num: number) => void;
  declare canvasContext: CanvasRenderingContext2D;
  declare globalData: GlobalDataCanvasImage;
  declare data: RefIdLayerData;

  constructor(data: RefIdLayerData, globalData: GlobalDataCanvasImage, comp: unknown) {
    this.assetData = globalData.getAssetData(data.refId) as ImageAssetData;
    this.img = globalData.imageLoader.getAsset(this.assetData) as CanvasImageSourceLike;
    this.initElement(data, globalData, comp);
  }

  renderInnerContent() {
    this.canvasContext.drawImage(this.img, 0, 0);
  }

  createContent() {
    const { width: imgW, height: imgH } = readCanvasImageSize(this.img);
    if (imgW && (this.assetData.w !== imgW || this.assetData.h !== imgH)) {
      const canvas = createTag('canvas') as HTMLCanvasElement;
      canvas.width = this.assetData.w;
      canvas.height = this.assetData.h;
      const ctx = canvas.getContext('2d')!;
      const imgRel = imgW / imgH;
      const canvasRel = this.assetData.w / this.assetData.h;
      let widthCrop: number;
      let heightCrop: number;
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
    this.img = null as unknown as CanvasImageSourceLike;
  }
}

const cvImageCreateContent = CVImageElement.prototype.createContent;
const cvImageDestroy = CVImageElement.prototype.destroy;

const copyPrototypeDescriptors = (sources: Array<{ prototype: object }>, destination: { prototype: object }) => {
  const destProto = destination.prototype;
  for (let i = 0; i < sources.length; i += 1) {
    const chain = prototypeChainInheritanceOrder(sources[i]);
    for (let c = 0; c < chain.length; c += 1) {
      const sourcePrototype = chain[c];
      const names = Object.getOwnPropertyNames(sourcePrototype);
      for (let j = 0; j < names.length; j += 1) {
        const key = names[j];
        if (key === 'constructor') continue;
        const desc = Object.getOwnPropertyDescriptor(sourcePrototype, key);
        if (desc) Object.defineProperty(destProto, key, desc);
      }
    }
  }
};

copyPrototypeDescriptors(
  [BaseElement, TransformElement, CVBaseElement, HierarchyElement, FrameElement, RenderableElement],
  CVImageElement,
);

CVImageElement.prototype.createContent = cvImageCreateContent;
CVImageElement.prototype.destroy = cvImageDestroy;

CVImageElement.prototype.initElement = (
  SVGShapeElement.prototype as unknown as { initElement: CVImageElement['initElement'] }
).initElement;
CVImageElement.prototype.prepareFrame = (
  IImageElement.prototype as unknown as { prepareFrame: CVImageElement['prepareFrame'] }
).prepareFrame;

export default CVImageElement;
