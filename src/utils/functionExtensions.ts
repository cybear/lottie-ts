type Constructor = { prototype: object };

function extendPrototype(sources: Constructor[], destination: Constructor): void {
  const destProto = destination.prototype as object;
  const len = sources.length;
  for (let i = 0; i < len; i += 1) {
    const sourcePrototype = sources[i].prototype as object;
    const names = Object.getOwnPropertyNames(sourcePrototype);
    for (let j = 0; j < names.length; j += 1) {
      const key = names[j];
      if (key === 'constructor') continue;
      const desc = Object.getOwnPropertyDescriptor(sourcePrototype, key);
      if (desc) Object.defineProperty(destProto, key, desc);
    }
  }
}

function getDescriptor(object: object, prop: string): PropertyDescriptor | undefined {
  return Object.getOwnPropertyDescriptor(object, prop);
}

function createProxyFunction(prototype: Record<string, unknown>): new () => Record<string, unknown> {
  function ProxyFunction() {}
  ProxyFunction.prototype = prototype;
  return ProxyFunction as unknown as new () => Record<string, unknown>;
}

export { extendPrototype, getDescriptor, createProxyFunction };
