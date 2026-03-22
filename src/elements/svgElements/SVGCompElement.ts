// @ts-nocheck
import { extendPrototype } from '../../utils/functionExtensions';
import { createSizedArray } from '../../utils/helpers/arrays';
import PropertyFactory from '../../utils/PropertyFactory';
import BaseRenderer from '../../renderers/BaseRenderer';
import SVGRendererBase from '../../renderers/SVGRendererBase'; // eslint-disable-line
import SVGBaseElement from './SVGBaseElement';
import ICompElement from '../CompElement';
import { registerSVGCompElement } from './svgElementRefs';

class SVGCompElement {
  constructor(data, globalData, comp) {
    this.layers = data.layers;
    this.supports3d = true;
    this.completeLayers = false;
    this.pendingElements = [];
    this.elements = this.layers ? createSizedArray(this.layers.length) : [];
    this.initElement(data, globalData, comp);
    this.tm = data.tm ? PropertyFactory.getProp(this, data.tm, 0, globalData.frameRate, this) : { _placeholder: true };
  }
}

extendPrototype([BaseRenderer, SVGRendererBase, ICompElement, SVGBaseElement], SVGCompElement);

SVGCompElement.prototype.createComp = function (data) {
  return new SVGCompElement(data, this.globalData, this);
};

registerSVGCompElement(SVGCompElement);

export default SVGCompElement;
