import DynamicPropertyContainer from '../helpers/dynamicProperties';
import { initialDefaultFrame } from '../../main';
import shapeCollectionPool from '../pooling/shapeCollection_pool';

const ShapeModifiers = (function () {
  const ob: {
    registerModifier: (nm: string, factory: new (...args: unknown[]) => unknown) => void;
    getModifier: (nm: string, elem?: unknown, data?: unknown) => unknown;
  } = {
    registerModifier,
    getModifier,
  };
  const modifiers: Record<string, new (...args: unknown[]) => unknown> = {};

  function registerModifier(nm: string, factory: new (...args: unknown[]) => unknown) {
    if (!modifiers[nm]) {
      modifiers[nm] = factory;
    }
  }

  function getModifier(nm: string, elem?: unknown, data?: unknown) {
    const Ctor = modifiers[nm];
    return new Ctor(elem, data);
  }

  return ob;
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeModifierAddShapeData = any;

class ShapeModifier extends DynamicPropertyContainer {
  shapes!: Array<{
    shape: unknown;
    data: ShapeModifierAddShapeData;
    localShapeCollection: ReturnType<typeof shapeCollectionPool.newShapeCollection>;
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  elem!: any;
  frameId!: number;
  closed!: boolean;
  k!: boolean;
  getValue!: (force?: boolean) => void;

  initModifierProperties(_elem: unknown, _data: unknown) {}

  addShapeToModifier(_shapeData: unknown) {}

  addShape(data: ShapeModifierAddShapeData) {
    if (!this.closed) {
      data.sh.container.addDynamicProperty(data.sh);
      const shapeData = { shape: data.sh, data: data, localShapeCollection: shapeCollectionPool.newShapeCollection() };
      this.shapes.push(shapeData);
      this.addShapeToModifier(shapeData);
      if (this._isAnimated) {
        data.setAsAnimated();
      }
    }
  }

  /** Normal modifiers: `init(elem, data)`. Repeater: `init(elem, arr, pos, elemsData)`. */
  init(elem: unknown, arg1?: unknown, _arg2?: unknown, _arg3?: unknown) {
    const data = arg1;
    this.shapes = [];
    this.elem = elem;
    this.initDynamicPropertyContainer(elem);
    this.initModifierProperties(elem, data);
    this.frameId = initialDefaultFrame;
    this.closed = false;
    this.k = false;
    if (this.dynamicProperties.length) {
      this.k = true;
    } else {
      this.getValue(true);
    }
  }

  processKeys() {
    if (this.elem.globalData.frameId === this.frameId) {
      return;
    }
    this.frameId = this.elem.globalData.frameId;
    this.iterateDynamicProperties();
  }
}

export { ShapeModifiers, ShapeModifier };
