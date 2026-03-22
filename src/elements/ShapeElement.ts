// @ts-nocheck
import ProcessedElement from './helpers/shapes/ProcessedElement';

class IShapeElement {
  addShapeToModifiers(data) {
    let i;
    const len = this.shapeModifiers.length;
    for (i = 0; i < len; i += 1) {
      this.shapeModifiers[i].addShape(data);
    }
  }

  isShapeInAnimatedModifiers(data) {
    const i = 0;
    const len = this.shapeModifiers.length;
    while (i < len) {
      if (this.shapeModifiers[i].isAnimatedWithShape(data)) {
        return true;
      }
    }
    return false;
  }

  renderModifiers() {
    if (!this.shapeModifiers.length) {
      return;
    }
    let i;
    let len = this.shapes.length;
    for (i = 0; i < len; i += 1) {
      this.shapes[i].sh.reset();
    }

    len = this.shapeModifiers.length;
    let shouldBreakProcess;
    for (i = len - 1; i >= 0; i -= 1) {
      shouldBreakProcess = this.shapeModifiers[i].processShapes(this._isFirstFrame);
      // workaround to fix cases where a repeater resets the shape so the following processes get called twice
      // TODO: find a better solution for this
      if (shouldBreakProcess) {
        break;
      }
    }
  }

  searchProcessedElement(elem) {
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

  addProcessedElement(elem, pos) {
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

  prepareFrame(num) {
    this.prepareRenderableFrame(num);
    this.prepareProperties(num, this.isInRange);
  }
}

export default IShapeElement;
