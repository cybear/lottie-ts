type SVGCompElementConstructor = new (data: unknown, globalData: unknown, comp: unknown) => unknown;

let svgCompElementCtor: SVGCompElementConstructor | null = null;

export function registerSVGCompElement(Ctor: SVGCompElementConstructor): void {
  svgCompElementCtor = Ctor;
}

export function getSVGCompElement(): SVGCompElementConstructor {
  if (!svgCompElementCtor) {
    throw new Error('SVGCompElement not registered');
  }
  return svgCompElementCtor;
}
