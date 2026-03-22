type Constructor = { prototype: Record<string, unknown> };

function extendPrototype(sources: Constructor[], destination: Constructor): void {
  const len = sources.length;
  for (let i = 0; i < len; i += 1) {
    const sourcePrototype = sources[i].prototype;
    for (const attr in sourcePrototype) {
      if (Object.prototype.hasOwnProperty.call(sourcePrototype, attr)) {
        destination.prototype[attr] = sourcePrototype[attr];
      }
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
