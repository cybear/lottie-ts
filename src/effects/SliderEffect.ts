import PropertyFactory from '../utils/PropertyFactory';
import type { EffectJsonEntry } from '../types/lottieRuntime';

class SliderEffect {
  declare p: unknown;
  constructor(data: EffectJsonEntry, elem: unknown, container: unknown) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class AngleEffect {
  declare p: unknown;
  constructor(data: EffectJsonEntry, elem: unknown, container: unknown) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class ColorEffect {
  declare p: unknown;
  constructor(data: EffectJsonEntry, elem: unknown, container: unknown) {
    this.p = PropertyFactory.getProp(elem, data.v, 1, 0, container);
  }
}
class PointEffect {
  declare p: unknown;
  constructor(data: EffectJsonEntry, elem: unknown, container: unknown) {
    this.p = PropertyFactory.getProp(elem, data.v, 1, 0, container);
  }
}
class LayerIndexEffect {
  declare p: unknown;
  constructor(data: EffectJsonEntry, elem: unknown, container: unknown) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class MaskIndexEffect {
  declare p: unknown;
  constructor(data: EffectJsonEntry, elem: unknown, container: unknown) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class CheckboxEffect {
  declare p: unknown;
  constructor(data: EffectJsonEntry, elem: unknown, container: unknown) {
    this.p = PropertyFactory.getProp(elem, data.v, 0, 0, container);
  }
}
class NoValueEffect {
  declare p: Record<string, never>;
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
