// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor = { prototype: Record<string, any> };

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createProxyFunction(prototype: Record<string, any>): new () => Record<string, any> {
  function ProxyFunction() {}
  ProxyFunction.prototype = prototype;
  return ProxyFunction as unknown as new () => Record<string, any>;
}

export { extendPrototype, getDescriptor, createProxyFunction };
