import { createElementID } from '../../../utils/common';
import createNS from '../../../utils/helpers/svg_elements';
import type { GlobalData, GroupEffectLike } from '../../../types/lottieRuntime';

const _svgMatteSymbols: unknown[] = [];

interface Matte3LayerEntry {
  data: { ind?: number; hd?: boolean };
  layerElement: SVGElement;
  layerId: string;
  setMatte(id: string): void;
  show(): void;
}

interface SvgMatte3LayerHost {
  matteElement: SVGGElement;
  layerElement: SVGGElement;
  transformedElement: SVGElement;
  baseElement: SVGElement;
  globalData: GlobalData;
  comp: { elements: Array<Matte3LayerEntry | null | undefined> };
  setMatte(id: string): void;
}

class SVGMatte3Effect {
  initialized: boolean;
  declare filterManager: GroupEffectLike;
  declare filterElem: SVGElement;
  declare elem: SvgMatte3LayerHost;

  constructor(
    _filterElem: SVGElement,
    filterManager: GroupEffectLike,
    elem: SvgMatte3LayerHost,
    _id?: string,
    _source?: string,
  ) {
    this.initialized = false;
    this.filterManager = filterManager;
    this.filterElem = _filterElem;
    this.elem = elem;
    elem.matteElement = createNS('g') as SVGGElement;
    elem.matteElement.appendChild(elem.layerElement);
    elem.matteElement.appendChild(elem.transformedElement);
    elem.baseElement = elem.matteElement;
  }

  findSymbol(mask: unknown) {
    let i = 0;
    const len = _svgMatteSymbols.length;
    while (i < len) {
      if (_svgMatteSymbols[i] === mask) {
        return _svgMatteSymbols[i];
      }
      i += 1;
    }
    return null;
  }

  replaceInParent(mask: Matte3LayerEntry, symbolId: string) {
    const parentNode = mask.layerElement.parentNode;
    if (!parentNode) {
      return;
    }
    const children = parentNode.children;
    let i = 0;
    const len = children.length;
    while (i < len) {
      if (children[i] === mask.layerElement) {
        break;
      }
      i += 1;
    }
    let nextChild: Element | undefined;
    if (i <= len - 2) {
      nextChild = children[i + 1];
    }
    const useElem = createNS('use');
    useElem.setAttribute('href', '#' + symbolId);
    if (nextChild) {
      parentNode.insertBefore(useElem, nextChild);
    } else {
      parentNode.appendChild(useElem);
    }
  }

  setElementAsMask(elem: SvgMatte3LayerHost, mask: Matte3LayerEntry) {
    if (!this.findSymbol(mask)) {
      const symbolId = createElementID();
      const masker = createNS('mask');
      masker.setAttribute('id', mask.layerId);
      masker.setAttribute('mask-type', 'alpha');
      _svgMatteSymbols.push(mask);
      const defs = elem.globalData.defs as SVGDefsElement;
      defs.appendChild(masker);
      const symbol = createNS('symbol');
      symbol.setAttribute('id', symbolId);
      this.replaceInParent(mask, symbolId);
      symbol.appendChild(mask.layerElement);
      defs.appendChild(symbol);
      const useElem = createNS('use');
      useElem.setAttribute('href', '#' + symbolId);
      masker.appendChild(useElem);
      mask.data.hd = false;
      mask.show();
    }
    elem.setMatte(mask.layerId);
  }

  initialize() {
    const ind = this.filterManager.effectElements[0].p.v as number;
    const elements = this.elem.comp.elements;
    let i = 0;
    const len = elements.length;
    while (i < len) {
      if (elements[i] && elements[i]!.data.ind === ind) {
        this.setElementAsMask(this.elem, elements[i]!);
      }
      i += 1;
    }
    this.initialized = true;
  }

  renderFrame() {
    if (!this.initialized) {
      this.initialize();
    }
  }
}

export default SVGMatte3Effect;
