// @ts-nocheck
import createNS from '../../../utils/helpers/svg_elements';

class SVGStyleData {
  constructor(data, level) {
    this.data = data;
    this.type = data.ty;
    this.d = '';
    this.lvl = level;
    this._mdf = false;
    this.closed = data.hd === true;
    this.pElem = createNS('path');
    this.msElem = null;
  }

  reset() {
    this.d = '';
    this._mdf = false;
  }
}

export default SVGStyleData;
