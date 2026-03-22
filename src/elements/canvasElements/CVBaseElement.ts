import assetManager from '../../utils/helpers/assetManager';
import getBlendMode from '../../utils/helpers/blendModes';
import Matrix from '../../3rd_party/transformation-matrix';
import CVEffects from './CVEffects';
import CVMaskElement from './CVMaskElement';
import type { CVMaskLayerHost } from './CVMaskElement';
import effectTypes from '../../utils/helpers/effectTypes';
import type { GlobalData, RenderableComponentEntry } from '../../types/lottieRuntime';
import type EffectsManager from '../../EffectsManager';
import type { CanvasTransformCanvas } from '../../renderers/CanvasRendererBase';

const operationsMap: Record<number, GlobalCompositeOperation> = {
  1: 'source-in' as GlobalCompositeOperation,
  2: 'source-out' as GlobalCompositeOperation,
  3: 'source-in' as GlobalCompositeOperation,
  4: 'source-out' as GlobalCompositeOperation,
};

interface CanvasRendererHost {
  save(force?: boolean): void;
  restore(force?: boolean): void;
  ctxTransform(props: number[]): void;
  ctxOpacity(op: number): void;
}

type LayerDataCv = {
  tt?: number;
  bm?: number;
  ty?: number;
  td?: number;
  tp?: number;
  ind?: number;
  hd?: boolean;
};

interface CompWithLookup {
  getElementById(id: number): { renderFrame(force?: boolean): void };
}

type DocumentWithProxy = Document & { _isProxy?: boolean };

class CVBaseElement {
  declare data: LayerDataCv;
  declare globalData: GlobalData & { renderer: CanvasRendererHost };
  declare buffers: HTMLCanvasElement[];
  declare canvasContext: CanvasRenderingContext2D;
  declare transformCanvas: CanvasTransformCanvas;
  declare effectsManager: EffectsManager;
  declare renderableEffectsManager: CVEffects;
  declare maskManager: CVMaskElement & { _isFirstFrame: boolean; hasMasks?: boolean };
  declare transformEffects: unknown[];
  declare hidden: boolean;
  declare isInRange: boolean;
  declare isTransparent: boolean;
  declare _isFirstFrame: boolean;
  declare finalTransform: { localMat: { props: number[] }; localOpacity: number };
  declare comp: CompWithLookup;
  declare addRenderableComponent: (c: RenderableComponentEntry) => void;
  declare renderTransform: () => void;
  declare renderRenderable: () => void;
  declare renderLocalTransform: () => void;
  declare renderInnerContent: () => void;
  currentTransform!: DOMMatrix;

  createElements() {}

  initRendererElement() {}

  createContainerElements() {
    if ((this.data.tt ?? 0) >= 1) {
      this.buffers = [];
      const canvasContext = this.globalData.canvasContext!;
      const bufferCanvas = assetManager.createCanvas(
        canvasContext.canvas.width,
        canvasContext.canvas.height,
      ) as HTMLCanvasElement;
      this.buffers.push(bufferCanvas);
      const bufferCanvas2 = assetManager.createCanvas(
        canvasContext.canvas.width,
        canvasContext.canvas.height,
      ) as HTMLCanvasElement;
      this.buffers.push(bufferCanvas2);
      if ((this.data.tt ?? 0) >= 3 && !(document as DocumentWithProxy)._isProxy) {
        assetManager.loadLumaCanvas?.();
      }
    }
    this.canvasContext = this.globalData.canvasContext!;
    this.transformCanvas = this.globalData.transformCanvas as CanvasTransformCanvas;
    this.renderableEffectsManager = new CVEffects(this);
    this.searchEffectTransforms();
  }

  declare searchEffectTransforms: () => void;

  createContent() {}

  setBlendMode() {
    const globalData = this.globalData;
    if (globalData.blendMode !== this.data.bm) {
      globalData.blendMode = this.data.bm;
      const blendModeValue = getBlendMode(this.data.bm as number);
      globalData.canvasContext!.globalCompositeOperation = blendModeValue as GlobalCompositeOperation;
    }
  }

  createRenderableComponents() {
    this.maskManager = new CVMaskElement(this.data, this as unknown as CVMaskLayerHost) as CVBaseElement['maskManager'];
    this.transformEffects = this.renderableEffectsManager.getEffects(effectTypes.TRANSFORM_EFFECT);
  }

  hideElement() {
    if (!this.hidden && (!this.isInRange || this.isTransparent)) {
      this.hidden = true;
    }
  }

  showElement() {
    if (this.isInRange && !this.isTransparent) {
      this.hidden = false;
      this._isFirstFrame = true;
      this.maskManager._isFirstFrame = true;
    }
  }

  hide() {
    return this.hideElement();
  }

  show() {
    return this.showElement();
  }

  clearCanvas(canvasContext: CanvasRenderingContext2D) {
    canvasContext.clearRect(
      this.transformCanvas.tx,
      this.transformCanvas.ty,
      this.transformCanvas.w * this.transformCanvas.sx,
      this.transformCanvas.h * this.transformCanvas.sy,
    );
  }

  prepareLayer() {
    if ((this.data.tt ?? 0) >= 1) {
      const buffer = this.buffers[0];
      const bufferCtx = buffer.getContext('2d')!;
      this.clearCanvas(bufferCtx);
      bufferCtx.drawImage(this.canvasContext.canvas, 0, 0);
      this.currentTransform = this.canvasContext.getTransform();
      this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
      this.clearCanvas(this.canvasContext);
      this.canvasContext.setTransform(this.currentTransform);
    }
  }

  exitLayer() {
    if ((this.data.tt ?? 0) >= 1) {
      const buffer = this.buffers[1];
      const bufferCtx = buffer.getContext('2d')!;
      this.clearCanvas(bufferCtx);
      bufferCtx.drawImage(this.canvasContext.canvas, 0, 0);
      this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);
      this.clearCanvas(this.canvasContext);
      this.canvasContext.setTransform(this.currentTransform);
      const maskId = 'tp' in this.data ? (this.data as { tp: number }).tp : (this.data.ind as number) - 1;
      const mask = this.comp.getElementById(maskId);
      mask.renderFrame(true);
      this.canvasContext.setTransform(1, 0, 0, 1, 0, 0);

      if ((this.data.tt ?? 0) >= 3 && !(document as DocumentWithProxy)._isProxy) {
        const lumaBuffer = assetManager.getLumaCanvas!(this.canvasContext.canvas);
        const lumaBufferCtx = lumaBuffer.getContext('2d')!;
        lumaBufferCtx.drawImage(this.canvasContext.canvas, 0, 0);
        this.clearCanvas(this.canvasContext);
        this.canvasContext.drawImage(lumaBuffer, 0, 0);
      }
      this.canvasContext.globalCompositeOperation = operationsMap[this.data.tt as number]!;
      this.canvasContext.drawImage(buffer, 0, 0);
      this.canvasContext.globalCompositeOperation = 'destination-over';
      this.canvasContext.drawImage(this.buffers[0], 0, 0);
      this.canvasContext.setTransform(this.currentTransform);
      this.canvasContext.globalCompositeOperation = 'source-over';
    }
  }

  renderFrame(forceRender?: boolean) {
    if (this.hidden || this.data.hd) {
      return;
    }
    if (this.data.td === 1 && !forceRender) {
      return;
    }
    this.renderTransform();
    this.renderRenderable();
    this.renderLocalTransform();
    this.setBlendMode();
    const forceRealStack = this.data.ty === 0;
    this.prepareLayer();
    this.globalData.renderer.save(forceRealStack);
    this.globalData.renderer.ctxTransform(this.finalTransform.localMat.props);
    this.globalData.renderer.ctxOpacity(this.finalTransform.localOpacity);
    this.renderInnerContent();
    this.globalData.renderer.restore(forceRealStack);
    this.exitLayer();
    if (this.maskManager.hasMasks) {
      this.globalData.renderer.restore(true);
    }
    if (this._isFirstFrame) {
      this._isFirstFrame = false;
    }
  }

  destroy() {
    this.canvasContext = null as unknown as CanvasRenderingContext2D;
    this.data = null as unknown as LayerDataCv;
    this.globalData = null as unknown as GlobalData & { renderer: CanvasRendererHost };
    this.maskManager.destroy();
  }
}

(CVBaseElement.prototype as unknown as { mHelper: InstanceType<typeof Matrix> }).mHelper = new Matrix();

export default CVBaseElement;
