// @ts-nocheck
import { createSizedArray } from '../../utils/helpers/arrays';

import ShapePropertyFactory from '../../utils/shapes/ShapeProperty';
import MaskElement from '../../mask';

class CVMaskElement {
  constructor(data, element) {
    this.data = data;
    this.element = element;
    this.masksProperties = this.data.masksProperties || [];
    this.viewData = createSizedArray(this.masksProperties.length);
    let i;
    const len = this.masksProperties.length;
    let hasMasks = false;
    for (i = 0; i < len; i += 1) {
      if (this.masksProperties[i].mode !== 'n') {
        hasMasks = true;
      }
      this.viewData[i] = ShapePropertyFactory.getShapeProp(this.element, this.masksProperties[i], 3);
    }
    this.hasMasks = hasMasks;
    if (hasMasks) {
      this.element.addRenderableComponent(this);
    }
  }

  renderFrame() {
    if (!this.hasMasks) {
      return;
    }
    const transform = this.element.finalTransform.mat;
    const ctx = this.element.canvasContext;
    let i;
    const len = this.masksProperties.length;
    let pt;
    let pts;
    let data;
    ctx.beginPath();
    for (i = 0; i < len; i += 1) {
      if (this.masksProperties[i].mode !== 'n') {
        if (this.masksProperties[i].inv) {
          ctx.moveTo(0, 0);
          ctx.lineTo(this.element.globalData.compSize.w, 0);
          ctx.lineTo(this.element.globalData.compSize.w, this.element.globalData.compSize.h);
          ctx.lineTo(0, this.element.globalData.compSize.h);
          ctx.lineTo(0, 0);
        }
        data = this.viewData[i].v;
        pt = transform.applyToPointArray(data.v[0][0], data.v[0][1], 0);
        ctx.moveTo(pt[0], pt[1]);
        let j;
        const jLen = data._length;
        for (j = 1; j < jLen; j += 1) {
          pts = transform.applyToTriplePoints(data.o[j - 1], data.i[j], data.v[j]);
          ctx.bezierCurveTo(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]);
        }
        pts = transform.applyToTriplePoints(data.o[j - 1], data.i[0], data.v[0]);
        ctx.bezierCurveTo(pts[0], pts[1], pts[2], pts[3], pts[4], pts[5]);
      }
    }
    this.element.globalData.renderer.save(true);
    ctx.clip();
  }

  destroy() {
    this.element = null;
  }
}

CVMaskElement.prototype.getMaskProperty = MaskElement.prototype.getMaskProperty;

export default CVMaskElement;
