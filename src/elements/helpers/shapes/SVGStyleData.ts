import createNS from '../../../utils/helpers/svg_elements';
import type { ElementData } from '../../../types/lottieRuntime';

class SVGStyleData {
  data: ElementData & { ty: string; hd?: boolean };
  type: string;
  d: string;
  lvl: number;
  _mdf: boolean;
  closed: boolean;
  pElem: SVGPathElement;
  msElem: SVGElement | null;

  constructor(data: ElementData & { ty: string; hd?: boolean }, level: number) {
    this.data = data;
    this.type = data.ty;
    this.d = '';
    this.lvl = level;
    this._mdf = false;
    this.closed = data.hd === true;
    this.pElem = createNS('path') as SVGPathElement;
    this.msElem = null;
  }

  reset() {
    this.d = '';
    this._mdf = false;
  }
}

export default SVGStyleData;
