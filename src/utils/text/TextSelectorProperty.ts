// @ts-nocheck
import DynamicPropertyContainer from '../helpers/dynamicProperties';
import PropertyFactory from '../PropertyFactory';
import BezierFactory from '../../3rd_party/BezierEaser';

const max = Math.max;
const min = Math.min;
const floor = Math.floor;

class TextSelectorPropFactory extends DynamicPropertyContainer {
  constructor(elem, data) {
    super();
    this._currentTextLength = -1;
    this.k = false;
    this.data = data;
    this.elem = elem;
    this.comp = elem.comp;
    this.finalS = 0;
    this.finalE = 0;
    this.initDynamicPropertyContainer(elem);
    this.s = PropertyFactory.getProp(elem, data.s || { k: 0 }, 0, 0, this);
    if ('e' in data) {
      this.e = PropertyFactory.getProp(elem, data.e, 0, 0, this);
    } else {
      this.e = { v: 100 };
    }
    this.o = PropertyFactory.getProp(elem, data.o || { k: 0 }, 0, 0, this);
    this.xe = PropertyFactory.getProp(elem, data.xe || { k: 0 }, 0, 0, this);
    this.ne = PropertyFactory.getProp(elem, data.ne || { k: 0 }, 0, 0, this);
    this.sm = PropertyFactory.getProp(elem, data.sm || { k: 100 }, 0, 0, this);
    this.a = PropertyFactory.getProp(elem, data.a, 0, 0.01, this);
    if (!this.dynamicProperties.length) {
      this.getValue();
    }
  }

  getMult(ind) {
    if (this._currentTextLength !== this.elem.textProperty.currentData.l.length) {
      this.getValue();
    }
    let x1 = 0;
    let y1 = 0;
    let x2 = 1;
    let y2 = 1;
    if (this.ne.v > 0) {
      x1 = this.ne.v / 100.0;
    } else {
      y1 = -this.ne.v / 100.0;
    }
    if (this.xe.v > 0) {
      x2 = 1.0 - this.xe.v / 100.0;
    } else {
      y2 = 1.0 + this.xe.v / 100.0;
    }
    const easer = BezierFactory.getBezierEasing(x1, y1, x2, y2).get;

    let mult = 0;
    const s = this.finalS;
    const e = this.finalE;
    const type = this.data.sh;
    if (type === 2) {
      if (e === s) {
        mult = ind >= e ? 1 : 0;
      } else {
        mult = max(0, min(0.5 / (e - s) + (ind - s) / (e - s), 1));
      }
      mult = easer(mult);
    } else if (type === 3) {
      if (e === s) {
        mult = ind >= e ? 0 : 1;
      } else {
        mult = 1 - max(0, min(0.5 / (e - s) + (ind - s) / (e - s), 1));
      }

      mult = easer(mult);
    } else if (type === 4) {
      if (e === s) {
        mult = 0;
      } else {
        mult = max(0, min(0.5 / (e - s) + (ind - s) / (e - s), 1));
        if (mult < 0.5) {
          mult *= 2;
        } else {
          mult = 1 - 2 * (mult - 0.5);
        }
      }
      mult = easer(mult);
    } else if (type === 5) {
      if (e === s) {
        mult = 0;
      } else {
        const tot = e - s;
        /* ind += 0.5;
                    mult = -4/(tot*tot)*(ind*ind)+(4/tot)*ind; */
        ind = min(max(0, ind + 0.5 - s), e - s);
        const x = -tot / 2 + ind;
        const a = tot / 2;
        mult = Math.sqrt(1 - (x * x) / (a * a));
      }
      mult = easer(mult);
    } else if (type === 6) {
      if (e === s) {
        mult = 0;
      } else {
        ind = min(max(0, ind + 0.5 - s), e - s);
        mult = (1 + Math.cos(Math.PI + (Math.PI * 2 * ind) / (e - s))) / 2; // eslint-disable-line
      }
      mult = easer(mult);
    } else {
      if (ind >= floor(s)) {
        if (ind - s < 0) {
          mult = max(0, min(min(e, 1) - (s - ind), 1));
        } else {
          mult = max(0, min(e - ind, 1));
        }
      }
      mult = easer(mult);
    }
    if (this.sm.v !== 100) {
      let smoothness = this.sm.v * 0.01;
      if (smoothness === 0) {
        smoothness = 0.00000001;
      }
      const threshold = 0.5 - smoothness * 0.5;
      if (mult < threshold) {
        mult = 0;
      } else {
        mult = (mult - threshold) / smoothness;
        if (mult > 1) {
          mult = 1;
        }
      }
    }
    return mult * this.a.v;
  }

  getValue(newCharsFlag) {
    this.iterateDynamicProperties();
    this._mdf = newCharsFlag || this._mdf;
    this._currentTextLength = this.elem.textProperty.currentData.l.length || 0;
    if (newCharsFlag && this.data.r === 2) {
      this.e.v = this._currentTextLength;
    }
    const divisor = this.data.r === 2 ? 1 : 100 / this.data.totalChars;
    const o = this.o.v / divisor;
    let s = this.s.v / divisor + o;
    let e = this.e.v / divisor + o;
    if (s > e) {
      const _s = s;
      s = e;
      e = _s;
    }
    this.finalS = s;
    this.finalE = e;
  }
}

const TextSelectorProp = (function () {
  function getTextSelectorProp(elem, data, arr) {
    return new TextSelectorPropFactory(elem, data, arr);
  }

  return {
    getTextSelectorProp: getTextSelectorProp,
  };
})();

export default TextSelectorProp;
