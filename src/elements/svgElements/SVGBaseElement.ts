import { getLocationHref } from '../../main';
import { createElementID } from '../../utils/common';
import createNS from '../../utils/helpers/svg_elements';
import MaskElement from '../../mask';
import type { MaskHostElement } from '../../mask';
import filtersFactory from '../../utils/filters';
import featureSupport from '../../utils/featureSupport';
import SVGEffects from './SVGEffects';
import type { BaseInitLayerData, GlobalData, RenderableComponentEntry } from '../../types/lottieRuntime';

type Matrix2dCss = { to2dCSS(): string };

interface FinalTransformLocalSlice {
  _localMatMdf: boolean;
  _opMdf: boolean;
  localMat: Matrix2dCss;
  localOpacity: number;
}

type LayerDataSvg = BaseInitLayerData & {
  td?: unknown;
  tt?: unknown;
  ln?: string;
  cl?: string;
  ty?: number;
  hd?: boolean;
  bm?: number;
  w?: number;
  h?: number;
};

interface CompDataSlice {
  data: { w: number; h: number };
}

class SVGBaseElement {
  declare data: LayerDataSvg;
  declare globalData: GlobalData;
  declare layerId: string;
  declare comp: CompDataSlice;
  declare layerElement: SVGGElement;
  declare transformedElement: SVGElement;
  declare matteElement: SVGGElement;
  declare maskedElement: SVGGElement;
  declare baseElement: SVGElement;
  declare _sizeChanged: boolean;
  declare matteMasks: Record<number, string>;
  declare maskManager: MaskElement;
  declare renderableEffectsManager: SVGEffects;
  declare searchEffectTransforms: () => void;
  declare checkMasks: () => boolean;
  declare setBlendMode: () => void;
  declare finalTransform: FinalTransformLocalSlice;
  declare addRenderableComponent: (c: RenderableComponentEntry) => void;

  initRendererElement() {
    this.layerElement = createNS('g') as SVGGElement;
  }

  createContainerElements() {
    this.matteElement = createNS('g') as SVGGElement;
    this.transformedElement = this.layerElement;
    this.maskedElement = this.layerElement;
    this._sizeChanged = false;
    let layerElementParent: SVGElement | null = null;
    if (this.data.td) {
      this.matteMasks = {};
      const gg = createNS('g');
      gg.setAttribute('id', this.layerId);
      gg.appendChild(this.layerElement);
      layerElementParent = gg;
      (this.globalData.defs as SVGDefsElement).appendChild(gg);
    } else if (this.data.tt) {
      this.matteElement.appendChild(this.layerElement);
      layerElementParent = this.matteElement;
      this.baseElement = this.matteElement;
    } else {
      this.baseElement = this.layerElement;
    }
    if (this.data.ln) {
      this.layerElement.setAttribute('id', this.data.ln);
    }
    if (this.data.cl) {
      this.layerElement.setAttribute('class', this.data.cl);
    }
    if (this.data.ty === 0 && !this.data.hd) {
      const cp = createNS('clipPath');
      const pt = createNS('path');
      pt.setAttribute(
        'd',
        'M0,0 L' + this.data.w + ',0 L' + this.data.w + ',' + this.data.h + ' L0,' + this.data.h + 'z',
      );
      const clipId = createElementID();
      cp.setAttribute('id', clipId);
      cp.appendChild(pt);
      (this.globalData.defs as SVGDefsElement).appendChild(cp);

      if (this.checkMasks()) {
        const cpGroup = createNS('g');
        cpGroup.setAttribute('clip-path', 'url(' + getLocationHref() + '#' + clipId + ')');
        cpGroup.appendChild(this.layerElement);
        this.transformedElement = cpGroup;
        if (layerElementParent) {
          layerElementParent.appendChild(this.transformedElement);
        } else {
          this.baseElement = this.transformedElement;
        }
      } else {
        this.layerElement.setAttribute('clip-path', 'url(' + getLocationHref() + '#' + clipId + ')');
      }
    }
    if (this.data.bm !== 0) {
      this.setBlendMode();
    }
  }

  renderElement() {
    if (this.finalTransform._localMatMdf) {
      this.transformedElement.setAttribute('transform', this.finalTransform.localMat.to2dCSS());
    }
    if (this.finalTransform._opMdf) {
      this.transformedElement.setAttribute('opacity', String(this.finalTransform.localOpacity));
    }
  }

  destroyBaseElement() {
    this.layerElement = null as unknown as SVGGElement;
    this.matteElement = null as unknown as SVGGElement;
    this.maskManager.destroy();
  }

  getBaseElement(): SVGElement | null {
    if (this.data.hd) {
      return null;
    }
    return this.baseElement;
  }

  createRenderableComponents() {
    this.maskManager = new MaskElement(this.data, this as unknown as MaskHostElement, this.globalData);
    this.renderableEffectsManager = new SVGEffects(this);
    this.searchEffectTransforms();
  }

  getMatte(matteType: number): string {
    if (!this.matteMasks) {
      this.matteMasks = {};
    }
    if (!this.matteMasks[matteType]) {
      const id = this.layerId + '_' + matteType;
      let filId: string;
      let fil: SVGElement;
      let useElement: SVGUseElement;
      let gg: SVGGElement;
      if (matteType === 1 || matteType === 3) {
        const masker = createNS('mask');
        masker.setAttribute('id', id);
        masker.setAttribute('mask-type', matteType === 3 ? 'luminance' : 'alpha');
        useElement = createNS('use') as SVGUseElement;
        useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + this.layerId);
        masker.appendChild(useElement);
        (this.globalData.defs as SVGDefsElement).appendChild(masker);
        if (!featureSupport.maskType && matteType === 1) {
          masker.setAttribute('mask-type', 'luminance');
          filId = createElementID();
          fil = filtersFactory.createFilter(filId);
          (this.globalData.defs as SVGDefsElement).appendChild(fil);
          fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
          gg = createNS('g') as SVGGElement;
          gg.appendChild(useElement);
          masker.appendChild(gg);
          gg.setAttribute('filter', 'url(' + getLocationHref() + '#' + filId + ')');
        }
      } else if (matteType === 2) {
        const maskGroup = createNS('mask');
        maskGroup.setAttribute('id', id);
        maskGroup.setAttribute('mask-type', 'alpha');
        const maskGrouper = createNS('g');
        maskGroup.appendChild(maskGrouper);
        filId = createElementID();
        fil = filtersFactory.createFilter(filId);
        const feCTr = createNS('feComponentTransfer');
        feCTr.setAttribute('in', 'SourceGraphic');
        fil.appendChild(feCTr);
        const feFunc = createNS('feFuncA');
        feFunc.setAttribute('type', 'table');
        feFunc.setAttribute('tableValues', '1.0 0.0');
        feCTr.appendChild(feFunc);
        (this.globalData.defs as SVGDefsElement).appendChild(fil);
        const alphaRect = createNS('rect');
        alphaRect.setAttribute('width', String(this.comp.data.w));
        alphaRect.setAttribute('height', String(this.comp.data.h));
        alphaRect.setAttribute('x', '0');
        alphaRect.setAttribute('y', '0');
        alphaRect.setAttribute('fill', '#ffffff');
        alphaRect.setAttribute('opacity', '0');
        maskGrouper.setAttribute('filter', 'url(' + getLocationHref() + '#' + filId + ')');
        maskGrouper.appendChild(alphaRect);
        useElement = createNS('use') as SVGUseElement;
        useElement.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#' + this.layerId);
        maskGrouper.appendChild(useElement);
        if (!featureSupport.maskType) {
          maskGroup.setAttribute('mask-type', 'luminance');
          fil.appendChild(filtersFactory.createAlphaToLuminanceFilter());
          gg = createNS('g') as SVGGElement;
          maskGrouper.appendChild(alphaRect);
          gg.appendChild(this.layerElement);
          maskGrouper.appendChild(gg);
        }
        (this.globalData.defs as SVGDefsElement).appendChild(maskGroup);
      }
      this.matteMasks[matteType] = id;
    }
    return this.matteMasks[matteType];
  }

  setMatte(id: string) {
    if (!this.matteElement) {
      return;
    }
    this.matteElement.setAttribute('mask', 'url(' + getLocationHref() + '#' + id + ')');
  }
}

export default SVGBaseElement;
