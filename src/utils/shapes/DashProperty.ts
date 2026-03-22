import DynamicPropertyContainer from '../helpers/dynamicProperties';
import { createSizedArray, createTypedArray } from '../helpers/arrays';
import PropertyFactory from '../PropertyFactory';
import type { GlobalData } from '../../types/lottieRuntime';

interface DashPropElemHost {
  globalData: GlobalData & { frameId?: number };
}

interface DashKeyframeRow {
  n: string;
  v: unknown;
}

interface DashDataPropEntry {
  n: string;
  p: { v: number; k?: boolean };
}

class DashProperty extends DynamicPropertyContainer {
  declare elem: DashPropElemHost;
  frameId: number;
  dataProps: DashDataPropEntry[];
  renderer: string;
  k: boolean;
  dashStr: string;
  dashArray: Float32Array | number[];
  dashoffset: Float32Array | number[];

  constructor(
    elem: DashPropElemHost,
    data: unknown,
    renderer: string,
    container: DynamicPropertyContainer['container'],
  ) {
    super();
    const rows = (Array.isArray(data) ? data : []) as DashKeyframeRow[];
    this.elem = elem;
    this.frameId = -1;
    this.dataProps = createSizedArray(rows.length) as DashDataPropEntry[];
    this.renderer = renderer;
    this.k = false;
    this.dashStr = '';
    this.dashArray = createTypedArray('float32', rows.length ? rows.length - 1 : 0) as Float32Array;
    this.dashoffset = createTypedArray('float32', 1) as Float32Array;
    this.initDynamicPropertyContainer(container);
    let i: number;
    const len = rows.length || 0;
    let prop: DashDataPropEntry['p'];
    for (i = 0; i < len; i += 1) {
      prop = PropertyFactory.getProp(elem, rows[i].v, 0, 0, this) as DashDataPropEntry['p'];
      this.k = !!prop.k || this.k;
      this.dataProps[i] = { n: rows[i].n, p: prop };
    }
    if (!this.k) {
      this.getValue(true);
    }
    this._isAnimated = this.k;
  }

  getValue(forceRender?: boolean) {
    if (this.elem.globalData.frameId === this.frameId && !forceRender) {
      return;
    }
    this.frameId = this.elem.globalData.frameId ?? -1;
    this.iterateDynamicProperties();
    this._mdf = this._mdf || !!forceRender;
    if (this._mdf) {
      let i = 0;
      const len = this.dataProps.length;
      if (this.renderer === 'svg') {
        this.dashStr = '';
      }
      for (i = 0; i < len; i += 1) {
        if (this.dataProps[i].n !== 'o') {
          if (this.renderer === 'svg') {
            this.dashStr += ' ' + this.dataProps[i].p.v;
          } else {
            (this.dashArray as Float32Array)[i] = this.dataProps[i].p.v;
          }
        } else {
          (this.dashoffset as Float32Array)[0] = this.dataProps[i].p.v;
        }
      }
    }
  }
}

export default DashProperty;
