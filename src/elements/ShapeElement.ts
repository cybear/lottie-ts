import type { ShapeModifierLike } from '../types/lottieRuntime';
import ProcessedElement from './helpers/shapes/ProcessedElement';

class IShapeElement {
  declare shapeModifiers: ShapeModifierLike[];
  declare shapes: Array<{ sh: { reset(): void } }>;
  declare processedElements: ProcessedElement[];
  declare _isFirstFrame: boolean;
  declare prepareRenderableFrame: (num: number) => void;
  declare prepareProperties: (num: number, isVisible: boolean) => void;
  declare isInRange: boolean;

  addShapeToModifiers(data: unknown) {
    let i: number;
    const len = this.shapeModifiers.length;
    for (i = 0; i < len; i += 1) {
      this.shapeModifiers[i].addShape(data);
    }
  }

  isShapeInAnimatedModifiers(data: unknown) {
    let i = 0;
    const len = this.shapeModifiers.length;
    while (i < len) {
      if (this.shapeModifiers[i].isAnimatedWithShape(data)) {
        return true;
      }
      i += 1;
    }
    return false;
  }

  renderModifiers() {
    if (!this.shapeModifiers.length) {
      return;
    }
    let i: number;
    let len = this.shapes.length;
    for (i = 0; i < len; i += 1) {
      this.shapes[i].sh.reset();
    }

    len = this.shapeModifiers.length;
    let shouldBreakProcess: boolean;
    for (i = len - 1; i >= 0; i -= 1) {
      shouldBreakProcess = this.shapeModifiers[i].processShapes(this._isFirstFrame);
      // workaround to fix cases where a repeater resets the shape so the following processes get called twice
      // TODO: find a better solution for this
      if (shouldBreakProcess) {
        break;
      }
    }
  }

  searchProcessedElement(elem: unknown) {
    const elements = this.processedElements;
    let i = 0;
    const len = elements.length;
    while (i < len) {
      if (elements[i].elem === elem) {
        return elements[i].pos;
      }
      i += 1;
    }
    return 0;
  }

  addProcessedElement(elem: unknown, pos: number) {
    const elements = this.processedElements;
    let i = elements.length;
    while (i) {
      i -= 1;
      if (elements[i].elem === elem) {
        elements[i].pos = pos;
        return;
      }
    }
    elements.push(new ProcessedElement(elem, pos));
  }

  prepareFrame(num: number) {
    this.prepareRenderableFrame(num);
    this.prepareProperties(num, this.isInRange);
  }
}

export default IShapeElement;
