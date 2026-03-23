type Constructor = { prototype: object };

/** Collect `ctor.prototype` and ancestors up to but not including `Object.prototype`, base-first. */
function prototypeChainInheritanceOrder(ctor: Constructor): object[] {
  const out: object[] = [];
  let p: object | null = ctor.prototype as object | null;
  while (p && p !== Object.prototype) {
    out.push(p);
    p = Object.getPrototypeOf(p) as object | null;
  }
  out.reverse();
  return out;
}

/**
 * Copies **own** property descriptors from each source onto `destination.prototype`.
 * For each source constructor, walks `source.prototype`’s **prototype chain** (excluding
 * `Object.prototype`), applying **base → derived** within that chain so subclasses flatten
 * like the old `extendPrototype([Base, Sub])` pair.
 *
 * Across `sources`, **later** entries still win on key collision (same as before).
 */
function extendPrototype(sources: Constructor[], destination: Constructor): void {
  const destProto = destination.prototype as object;
  const len = sources.length;
  for (let i = 0; i < len; i += 1) {
    const chain = prototypeChainInheritanceOrder(sources[i]);
    for (let c = 0; c < chain.length; c += 1) {
      const sourcePrototype = chain[c];
      const names = Object.getOwnPropertyNames(sourcePrototype);
      for (let j = 0; j < names.length; j += 1) {
        const key = names[j];
        if (key === 'constructor') continue;
        const desc = Object.getOwnPropertyDescriptor(sourcePrototype, key);
        if (desc) Object.defineProperty(destProto, key, desc);
      }
    }
  }
}

function getDescriptor(object: object, prop: string): PropertyDescriptor | undefined {
  return Object.getOwnPropertyDescriptor(object, prop);
}

export { extendPrototype, getDescriptor, prototypeChainInheritanceOrder };
