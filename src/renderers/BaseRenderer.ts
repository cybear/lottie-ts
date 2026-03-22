import FontManager from '../utils/FontManager';
import slotFactory from '../utils/SlotManager';
import type {
  AnimationItemRendererPartial,
  AnimationRootData,
  AudioLayerData,
  ElementData,
  GlobalData,
  ProjectInterfaceLike,
  RefIdLayerData,
  RendererElementInstance,
  RendererElementSlot,
  RendererLayerData,
} from '../types/lottieRuntime';
import FootageElement from '../elements/FootageElement';
import AudioElement from '../elements/AudioElement';

type FontManagerInstance = {
  addChars(chars: unknown): void;
  addFonts(fonts: unknown, container: unknown): void;
};

abstract class BaseRenderer {
  declare animationItem: AnimationItemRendererPartial;
  declare layers: RendererLayerData[];
  declare elements: RendererElementSlot[];
  declare completeLayers: boolean;
  declare globalData: GlobalData;
  pendingElements!: RendererElementInstance[];

  abstract buildItem(pos: number): void;
  abstract checkPendingElements(): void;
  abstract createImage(data: RendererLayerData): RendererElementInstance;
  abstract createComp(data: RendererLayerData, ...args: unknown[]): RendererElementInstance;
  abstract createSolid(data: RendererLayerData): RendererElementInstance;
  abstract createNull(data: RendererLayerData): RendererElementInstance;
  abstract createShape(data: RendererLayerData): RendererElementInstance;
  abstract createText(data: RendererLayerData): RendererElementInstance;

  checkLayers(num: number) {
    let i: number;
    const len = this.layers.length;
    let data: RendererLayerData;
    this.completeLayers = true;
    for (i = len - 1; i >= 0; i -= 1) {
      if (!this.elements[i]) {
        data = this.layers[i];
        if (data.ip - data.st <= num - this.layers[i].st && data.op - data.st > num - this.layers[i].st) {
          this.buildItem(i);
        }
      }
      this.completeLayers = this.elements[i] ? this.completeLayers : false;
    }
    this.checkPendingElements();
  }

  createItem(layer: RendererLayerData, ..._extra: unknown[]) {
    switch (layer.ty) {
      case 2:
        return this.createImage(layer);
      case 0:
        return this.createComp(layer);
      case 1:
        return this.createSolid(layer);
      case 3:
        return this.createNull(layer);
      case 4:
        return this.createShape(layer);
      case 5:
        return this.createText(layer);
      case 6:
        return new AudioElement(
          layer as unknown as AudioLayerData,
          this.globalData,
          this,
        ) as unknown as RendererElementInstance;
      case 13:
        return this.createCamera(layer);
      case 15:
        return new FootageElement(
          layer as unknown as RefIdLayerData,
          this.globalData,
          this,
        ) as unknown as RendererElementInstance;
      default:
        return this.createNull(layer);
    }
  }

  createCamera(_data: RendererLayerData): RendererElementInstance {
    throw new Error("You're using a 3d camera. Try the html renderer.");
  }

  buildAllItems() {
    let i: number;
    const len = this.layers.length;
    for (i = 0; i < len; i += 1) {
      this.buildItem(i);
    }
    this.checkPendingElements();
  }

  includeLayers(newLayers: RendererLayerData[]) {
    this.completeLayers = false;
    let i: number;
    const len = newLayers.length;
    let j: number;
    const jLen = this.layers.length;
    for (i = 0; i < len; i += 1) {
      j = 0;
      while (j < jLen) {
        if (this.layers[j].id === newLayers[i].id) {
          this.layers[j] = newLayers[i];
          break;
        }
        j += 1;
      }
    }
  }

  setProjectInterface(pInterface: ProjectInterfaceLike) {
    this.globalData.projectInterface = pInterface;
  }

  initItems() {
    if (!this.globalData.progressiveLoad) {
      this.buildAllItems();
    }
  }

  buildElementParenting(element: RendererElementInstance, parentName: number, hierarchy: unknown[]) {
    const elements = this.elements;
    const layers = this.layers;
    let i = 0;
    const len = layers.length;
    while (i < len) {
      if (layers[i].ind == parentName) {
        // eslint-disable-line eqeqeq
        if (!elements[i] || elements[i] === true) {
          this.buildItem(i);
          this.addPendingElement(element);
        } else {
          const built = elements[i] as RendererElementInstance;
          hierarchy.push(built);
          built.setAsParent!();
          if (layers[i].parent !== undefined) {
            this.buildElementParenting(element, layers[i].parent as number, hierarchy);
          } else {
            element.setHierarchy!(hierarchy);
          }
        }
      }
      i += 1;
    }
  }

  addPendingElement(element: RendererElementInstance) {
    this.pendingElements.push(element);
  }

  searchExtraCompositions(assets: Array<ElementData & { xt?: boolean }>) {
    let i: number;
    const len = assets.length;
    const pi = this.globalData.projectInterface as ProjectInterfaceLike;
    for (i = 0; i < len; i += 1) {
      if (assets[i].xt) {
        const comp = this.createComp(assets[i] as RendererLayerData);
        comp.initExpressions();
        pi.registerComposition(comp);
      }
    }
  }

  getElementById(ind: number): RendererElementInstance | null {
    let i: number;
    const len = this.elements.length;
    for (i = 0; i < len; i += 1) {
      const slot = this.elements[i];
      if (slot && slot !== true) {
        const el = slot as RendererElementInstance;
        if (el.data.ind === ind) {
          return el;
        }
      }
    }
    return null;
  }

  getElementByPath(path: unknown[]): unknown {
    const pathValue = path.shift();
    let element: RendererElementInstance | undefined;
    if (typeof pathValue === 'number') {
      element = this.elements[pathValue] as RendererElementInstance;
    } else {
      let i: number;
      const len = this.elements.length;
      for (i = 0; i < len; i += 1) {
        if ((this.elements[i] as RendererElementInstance).data.nm === pathValue) {
          element = this.elements[i] as RendererElementInstance;
          break;
        }
      }
    }
    if (path.length === 0) {
      return element;
    }
    return element!.getElementByPath!(path);
  }

  setupGlobalData(animData: AnimationRootData, fontsContainer: unknown) {
    const FontCtor = FontManager as unknown as new () => FontManagerInstance;
    this.globalData.fontManager = new FontCtor();
    this.globalData.slotManager = slotFactory(animData);
    const fm = this.globalData.fontManager as FontManagerInstance;
    fm.addChars(animData.chars);
    fm.addFonts(animData.fonts, fontsContainer);
    this.globalData.getAssetData = this.animationItem.getAssetData.bind(this.animationItem);
    this.globalData.getAssetsPath = this.animationItem.getAssetsPath.bind(this.animationItem);
    this.globalData.imageLoader = this.animationItem.imagePreloader;
    this.globalData.audioController = this.animationItem.audioController;
    this.globalData.frameId = 0;
    this.globalData.frameRate = animData.fr;
    this.globalData.nm = animData.nm;
    this.globalData.compSize = {
      w: animData.w,
      h: animData.h,
    };
  }
}

export default BaseRenderer;
