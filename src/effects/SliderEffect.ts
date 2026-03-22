// @ts-nocheck
import PropertyFactory from '../utils/PropertyFactory';

class SliderEffect {
  constructor(data, elem, container) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class AngleEffect {
  constructor(data, elem, container) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class ColorEffect {
  constructor(data, elem, container) {
    this.p = PropertyFactory.getProp(elem, data.v, 1, 0, container);
  }
}
class PointEffect {
  constructor(data, elem, container) {
    this.p = PropertyFactory.getProp(elem, data.v, 1, 0, container);
  }
}
class LayerIndexEffect {
  constructor(data, elem, container) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class MaskIndexEffect {
  constructor(data, elem, container) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class CheckboxEffect {
  constructor(data, elem, container) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class NoValueEffect {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_data?: unknown, _elem?: unknown, _container?: unknown) {
    this.p = {};
  }
}

export {
  SliderEffect,
  AngleEffect,
  ColorEffect,
  PointEffect,
  LayerIndexEffect,
  MaskIndexEffect,
  CheckboxEffect,
  NoValueEffect,
};
