import { describe, it, expect } from 'vitest';
import {
  extendPrototype,
  prototypeChainInheritanceOrder,
} from '../../../src/utils/functionExtensions';

describe('prototypeChainInheritanceOrder', () => {
  it('returns base-to-derived prototypes excluding Object.prototype', () => {
    class Base {
      baseMethod() {}
    }
    class Mid extends Base {
      midMethod() {}
    }
    class Leaf extends Mid {
      leafMethod() {}
    }

    const chain = prototypeChainInheritanceOrder(Leaf);

    expect(chain).toHaveLength(3);
    expect(chain[0]).toBe(Base.prototype);
    expect(chain[1]).toBe(Mid.prototype);
    expect(chain[2]).toBe(Leaf.prototype);
  });
});

describe('extendPrototype', () => {
  it('flattens a single subclass source by walking its prototype chain', () => {
    class Base {
      baseMethod() {
        return 'base';
      }
    }
    class Sub extends Base {
      subMethod() {
        return 'sub';
      }
    }
    class Dest {}

    extendPrototype([Sub], Dest);

    const inst = new (Dest as unknown as new () => {
      baseMethod: () => string;
      subMethod: () => string;
    })();
    expect(inst.baseMethod()).toBe('base');
    expect(inst.subMethod()).toBe('sub');
  });

  it('keeps later sources as last-writer-wins on key collisions', () => {
    class A {
      collide() {
        return 'A';
      }
    }
    class B {
      collide() {
        return 'B';
      }
    }
    class Dest {}

    extendPrototype([A, B], Dest);

    const inst = new (Dest as unknown as new () => { collide: () => string })();
    expect(inst.collide()).toBe('B');
  });
});
