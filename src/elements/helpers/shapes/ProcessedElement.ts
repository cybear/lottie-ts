class ProcessedElement {
  elem: unknown;
  pos: number;

  constructor(element: unknown, position: number) {
    this.elem = element;
    this.pos = position;
  }
}

export default ProcessedElement;
