import createNS from '../../../utils/helpers/svg_elements';

class ShapeGroupData {
  it: unknown[];
  prevViewData: unknown[];
  gr: SVGGElement;

  constructor() {
    this.it = [];
    this.prevViewData = [];
    this.gr = createNS('g') as SVGGElement;
  }
}

export default ShapeGroupData;
