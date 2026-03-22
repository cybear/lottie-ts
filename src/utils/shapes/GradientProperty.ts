import DynamicPropertyContainer from '../helpers/dynamicProperties';
import { createTypedArray } from '../helpers/arrays';
import PropertyFactory from '../PropertyFactory';
import type { ElementData } from '../../types/lottieRuntime';

type GradientKeyframeRow = { s?: number[] };

interface GradientDataJson extends ElementData {
  p: number;
  k: {
    k: number[] | GradientKeyframeRow[];
  };
}

interface GradientPropBinding {
  getValue(): void;
  _mdf: boolean;
  v: number[];
  k: boolean;
}

class GradientProperty extends DynamicPropertyContainer {
  declare data: GradientDataJson;
  declare c: Uint8ClampedArray;
  declare o: Float32Array;
  declare _cmdf: boolean;
  declare _omdf: boolean;
  declare _collapsable: boolean;
  declare _hasOpacity: number;
  declare prop: GradientPropBinding;
  declare k: boolean;

  constructor(elem: unknown, data: ElementData, container: DynamicPropertyContainer['container']) {
    super();
    const gd = data as GradientDataJson;
    this.data = gd;
    this.c = createTypedArray('uint8c', gd.p * 4) as Uint8ClampedArray;
    const k0 = gd.k.k[0] as GradientKeyframeRow | number | undefined;
    const cLength =
      k0 && typeof k0 === 'object' && 's' in k0 && k0.s
        ? k0.s.length - gd.p * 4
        : (gd.k.k as number[]).length - gd.p * 4;
    this.o = createTypedArray('float32', cLength) as Float32Array;
    this._cmdf = false;
    this._omdf = false;
    this._collapsable = this.checkCollapsable();
    this._hasOpacity = cLength;
    this.initDynamicPropertyContainer(container);
    this.prop = PropertyFactory.getProp(elem, gd.k, 1, null, this) as GradientPropBinding;
    this.k = this.prop.k;
    this.getValue(true);
  }

  comparePoints(values: number[], points: number) {
    let i = 0;
    const len = this.o.length / 2;
    let diff: number;
    while (i < len) {
      diff = Math.abs(values[i * 4] - values[points * 4 + i * 2]);
      if (diff > 0.01) {
        return false;
      }
      i += 1;
    }
    return true;
  }

  checkCollapsable() {
    if (this.o.length / 2 !== this.c.length / 4) {
      return false;
    }
    const kk = this.data.k.k;
    const first = kk[0];
    if (first && typeof first === 'object' && 's' in first && first.s) {
      let i = 0;
      const len = kk.length;
      while (i < len) {
        const row = kk[i] as GradientKeyframeRow;
        if (!row.s || !this.comparePoints(row.s, this.data.p)) {
          return false;
        }
        i += 1;
      }
    } else if (!this.comparePoints(kk as number[], this.data.p)) {
      return false;
    }
    return true;
  }

  getValue(forceRender?: boolean) {
    this.prop.getValue();
    this._mdf = false;
    this._cmdf = false;
    this._omdf = false;
    if (this.prop._mdf || forceRender) {
      let i: number;
      let len = this.data.p * 4;
      let mult: number;
      let val: number;
      for (i = 0; i < len; i += 1) {
        mult = i % 4 === 0 ? 100 : 255;
        val = Math.round(this.prop.v[i] * mult);
        if (this.c[i] !== val) {
          this.c[i] = val;
          this._cmdf = !forceRender;
        }
      }
      if (this.o.length) {
        len = this.prop.v.length;
        for (i = this.data.p * 4; i < len; i += 1) {
          mult = i % 2 === 0 ? 100 : 1;
          val = i % 2 === 0 ? Math.round(this.prop.v[i] * 100) : this.prop.v[i];
          if (this.o[i - this.data.p * 4] !== val) {
            this.o[i - this.data.p * 4] = val;
            this._omdf = !forceRender;
          }
        }
      }
      this._mdf = !forceRender;
    }
  }
}

export default GradientProperty;
