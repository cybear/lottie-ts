import { degToRads, createElementID } from '../../../utils/common';
import { getLocationHref } from '../../../main';
import DynamicPropertyContainer, { type DynamicPropertyContainerMixin } from '../../../utils/helpers/dynamicProperties';
import PropertyFactory from '../../../utils/PropertyFactory';
import createNS from '../../../utils/helpers/svg_elements';
import GradientProperty from '../../../utils/shapes/GradientProperty';
import { lineCapEnum, lineJoinEnum } from '../../../utils/helpers/shapeEnums';
import type { ElementData } from '../../../types/lottieRuntime';
import type SVGStyleData from './SVGStyleData';

/** Gradient payload on shape style JSON (`data.g`, stops, keyframes). */
type GradientDataG = ElementData & {
  p: number;
  k: ElementData;
  _hasOpacity?: boolean;
  _collapsable?: boolean;
  _cmdf?: boolean;
  _omdf?: boolean;
  c?: number[];
  o?: number[];
};

export type GradientStyleData = ElementData & {
  ty: string;
  t?: number;
  o: unknown;
  s: unknown;
  e: unknown;
  g: GradientDataG;
  h?: unknown;
  a?: unknown;
  lc?: number;
  lj?: number;
  ml?: number;
};

class SVGGradientFillStyleData extends DynamicPropertyContainer {
  declare getValue: () => void;
  o!: unknown;
  s!: unknown;
  e!: unknown;
  h!: unknown;
  a!: unknown;
  g!: GradientProperty;
  style!: SVGStyleData;
  stops!: SVGStopElement[];
  gf!: SVGLinearGradientElement | SVGRadialGradientElement;
  cst!: SVGStopElement[];
  of?: SVGLinearGradientElement | SVGRadialGradientElement;
  ms?: SVGMaskElement;
  ost?: SVGStopElement[];
  maskId?: string;

  constructor(
    elem: DynamicPropertyContainerMixin['container'],
    data: GradientStyleData,
    styleOb: SVGStyleData,
    skipGradientInit = false,
  ) {
    super();
    this.initDynamicPropertyContainer(elem);
    this.getValue = this.iterateDynamicProperties;
    if (!skipGradientInit) {
      this.initGradientData(elem, data, styleOb);
    }
  }

  initGradientData(elem: DynamicPropertyContainerMixin['container'], data: GradientStyleData, styleOb: SVGStyleData) {
    this.o = PropertyFactory.getProp(elem, data.o, 0, 0.01, this);
    this.s = PropertyFactory.getProp(elem, data.s, 1, null, this);
    this.e = PropertyFactory.getProp(elem, data.e, 1, null, this);
    this.h = PropertyFactory.getProp(elem, data.h || { k: 0 }, 0, 0.01, this);
    this.a = PropertyFactory.getProp(elem, data.a || { k: 0 }, 0, degToRads, this);
    this.g = new GradientProperty(elem, data.g, this) as GradientProperty & {
      _hasOpacity: number;
      _collapsable: boolean;
    };
    this.style = styleOb;
    this.stops = [];
    this.setGradientData(styleOb.pElem, data);
    this.setGradientOpacity(data, styleOb);
    this._isAnimated = !!this._isAnimated;
  }

  setGradientData(pathElement: SVGPathElement, data: GradientStyleData) {
    const gradientId = createElementID();
    const gfill = createNS(data.t === 1 ? 'linearGradient' : 'radialGradient') as
      | SVGLinearGradientElement
      | SVGRadialGradientElement;
    gfill.setAttribute('id', gradientId);
    gfill.setAttribute('spreadMethod', 'pad');
    gfill.setAttribute('gradientUnits', 'userSpaceOnUse');
    const stops: SVGStopElement[] = [];
    let stop: SVGStopElement;
    let j: number;
    const jLen = data.g.p * 4;
    for (j = 0; j < jLen; j += 4) {
      stop = createNS('stop') as SVGStopElement;
      gfill.appendChild(stop);
      stops.push(stop);
    }
    pathElement.setAttribute(data.ty === 'gf' ? 'fill' : 'stroke', 'url(' + getLocationHref() + '#' + gradientId + ')');
    this.gf = gfill;
    this.cst = stops;
  }

  setGradientOpacity(data: GradientStyleData, styleOb: SVGStyleData) {
    const grad = this.g as GradientProperty & { _hasOpacity: number; _collapsable: boolean };
    if (grad._hasOpacity && !grad._collapsable) {
      let stop: SVGStopElement;
      let j: number;
      const mask = createNS('mask') as SVGMaskElement;
      const maskElement = createNS('path') as SVGPathElement;
      mask.appendChild(maskElement);
      const opacityId = createElementID();
      const maskId = createElementID();
      mask.setAttribute('id', maskId);
      const opFill = createNS(data.t === 1 ? 'linearGradient' : 'radialGradient') as
        | SVGLinearGradientElement
        | SVGRadialGradientElement;
      opFill.setAttribute('id', opacityId);
      opFill.setAttribute('spreadMethod', 'pad');
      opFill.setAttribute('gradientUnits', 'userSpaceOnUse');
      const gk = data.g.k as { k: Array<{ s?: unknown[] } | unknown> };
      const jLen =
        gk.k[0] && typeof gk.k[0] === 'object' && gk.k[0] !== null && 's' in gk.k[0]
          ? (gk.k[0] as { s: unknown[] }).s.length
          : (gk.k as unknown[]).length;
      const stops = this.stops;
      for (j = data.g.p * 4; j < jLen; j += 2) {
        stop = createNS('stop') as SVGStopElement;
        stop.setAttribute('stop-color', 'rgb(255,255,255)');
        opFill.appendChild(stop);
        stops.push(stop);
      }
      maskElement.setAttribute(
        data.ty === 'gf' ? 'fill' : 'stroke',
        'url(' + getLocationHref() + '#' + opacityId + ')',
      );
      if (data.ty === 'gs') {
        maskElement.setAttribute('stroke-linecap', lineCapEnum[data.lc || 2]);
        maskElement.setAttribute('stroke-linejoin', lineJoinEnum[data.lj || 2]);
        if (data.lj === 1) {
          maskElement.setAttribute('stroke-miterlimit', String(data.ml));
        }
      }
      this.of = opFill;
      this.ms = mask;
      this.ost = stops;
      this.maskId = maskId;
      styleOb.msElem = maskElement;
    }
  }
}

export default SVGGradientFillStyleData;
