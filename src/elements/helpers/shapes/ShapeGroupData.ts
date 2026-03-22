// @ts-nocheck
import createNS from '../../../utils/helpers/svg_elements';

class ShapeGroupData {
  constructor() {
    this.it = [];
    this.prevViewData = [];
    this.gr = createNS('g');
  }
}

export default ShapeGroupData;
