import { createTypedArray } from '../../utils/helpers/arrays';
import Matrix from '../../3rd_party/transformation-matrix';

type MatrixInstance = InstanceType<typeof Matrix>;

class CanvasContext {
  opacity: number;
  transform: Float32Array;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: string;
  lineCap: string;
  lineJoin: string;
  miterLimit: string;
  id: number;

  constructor() {
    this.opacity = -1;
    this.transform = createTypedArray('float32', 16) as Float32Array;
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = '';
    this.lineCap = '';
    this.lineJoin = '';
    this.miterLimit = '';
    this.id = Math.random();
  }
}

class CVContextData {
  stack: CanvasContext[];
  cArrPos: number;
  cTr: MatrixInstance;
  _length: number;
  nativeContext: CanvasRenderingContext2D | null;
  transformMat: MatrixInstance;
  currentOpacity: number;
  currentFillStyle: string;
  appliedFillStyle: string;
  currentStrokeStyle: string;
  appliedStrokeStyle: string;
  currentLineWidth: string;
  appliedLineWidth: string;
  currentLineCap: string;
  appliedLineCap: string;
  currentLineJoin: string;
  appliedLineJoin: string;
  appliedMiterLimit: string;
  currentMiterLimit: string;

  constructor() {
    this.stack = [];
    this.cArrPos = 0;
    this.cTr = new Matrix() as MatrixInstance;
    let i: number;
    const len = 15;
    for (i = 0; i < len; i += 1) {
      const canvasContext = new CanvasContext();
      this.stack[i] = canvasContext;
    }
    this._length = len;
    this.nativeContext = null;
    this.transformMat = new Matrix() as MatrixInstance;
    this.currentOpacity = 1;
    this.currentFillStyle = '';
    this.appliedFillStyle = '';
    this.currentStrokeStyle = '';
    this.appliedStrokeStyle = '';
    this.currentLineWidth = '';
    this.appliedLineWidth = '';
    this.currentLineCap = '';
    this.appliedLineCap = '';
    this.currentLineJoin = '';
    this.appliedLineJoin = '';
    this.appliedMiterLimit = '';
    this.currentMiterLimit = '';
  }

  duplicate() {
    const newLength = this._length * 2;
    let i = 0;
    for (i = this._length; i < newLength; i += 1) {
      this.stack[i] = new CanvasContext();
    }
    this._length = newLength;
  }

  reset() {
    this.cArrPos = 0;
    this.cTr.reset();
    this.stack[this.cArrPos].opacity = 1;
  }

  restore(forceRestore?: boolean) {
    this.cArrPos -= 1;
    const currentContext = this.stack[this.cArrPos];
    const transform = currentContext.transform;
    let i: number;
    const arr = this.cTr.props;
    for (i = 0; i < 16; i += 1) {
      arr[i] = transform[i];
    }
    const ctx = this.nativeContext!;
    if (forceRestore) {
      ctx.restore();
      const prevStack = this.stack[this.cArrPos + 1];
      this.appliedFillStyle = prevStack.fillStyle;
      this.appliedStrokeStyle = prevStack.strokeStyle;
      this.appliedLineWidth = prevStack.lineWidth;
      this.appliedLineCap = prevStack.lineCap;
      this.appliedLineJoin = prevStack.lineJoin;
      this.appliedMiterLimit = prevStack.miterLimit;
    }
    ctx.setTransform(transform[0], transform[1], transform[4], transform[5], transform[12], transform[13]);
    if (forceRestore || (currentContext.opacity !== -1 && this.currentOpacity !== currentContext.opacity)) {
      ctx.globalAlpha = currentContext.opacity;
      this.currentOpacity = currentContext.opacity;
    }
    this.currentFillStyle = currentContext.fillStyle;
    this.currentStrokeStyle = currentContext.strokeStyle;
    this.currentLineWidth = currentContext.lineWidth;
    this.currentLineCap = currentContext.lineCap;
    this.currentLineJoin = currentContext.lineJoin;
    this.currentMiterLimit = currentContext.miterLimit;
  }

  save(saveOnNativeFlag?: boolean) {
    const ctx = this.nativeContext!;
    if (saveOnNativeFlag) {
      ctx.save();
    }
    const props = this.cTr.props;
    if (this._length <= this.cArrPos) {
      this.duplicate();
    }

    const currentStack = this.stack[this.cArrPos];
    let i: number;
    for (i = 0; i < 16; i += 1) {
      currentStack.transform[i] = props[i];
    }
    this.cArrPos += 1;
    const newStack = this.stack[this.cArrPos];
    newStack.opacity = currentStack.opacity;
    newStack.fillStyle = currentStack.fillStyle;
    newStack.strokeStyle = currentStack.strokeStyle;
    newStack.lineWidth = currentStack.lineWidth;
    newStack.lineCap = currentStack.lineCap;
    newStack.lineJoin = currentStack.lineJoin;
    newStack.miterLimit = currentStack.miterLimit;
  }

  setOpacity(value: number) {
    this.stack[this.cArrPos].opacity = value;
  }

  setContext(value: CanvasRenderingContext2D) {
    this.nativeContext = value;
  }

  fillStyle(value: string) {
    if (this.stack[this.cArrPos].fillStyle !== value) {
      this.currentFillStyle = value;
      this.stack[this.cArrPos].fillStyle = value;
    }
  }

  strokeStyle(value: string) {
    if (this.stack[this.cArrPos].strokeStyle !== value) {
      this.currentStrokeStyle = value;
      this.stack[this.cArrPos].strokeStyle = value;
    }
  }

  lineWidth(value: string | number) {
    const s = typeof value === 'number' ? String(value) : value;
    if (this.stack[this.cArrPos].lineWidth !== s) {
      this.currentLineWidth = s;
      this.stack[this.cArrPos].lineWidth = s;
    }
  }

  lineCap(value: string) {
    if (this.stack[this.cArrPos].lineCap !== value) {
      this.currentLineCap = value;
      this.stack[this.cArrPos].lineCap = value;
    }
  }

  lineJoin(value: string) {
    if (this.stack[this.cArrPos].lineJoin !== value) {
      this.currentLineJoin = value;
      this.stack[this.cArrPos].lineJoin = value;
    }
  }

  miterLimit(value: string | number) {
    const s = typeof value === 'number' ? String(value) : value;
    if (this.stack[this.cArrPos].miterLimit !== s) {
      this.currentMiterLimit = s;
      this.stack[this.cArrPos].miterLimit = s;
    }
  }

  transform(props: number[]) {
    this.transformMat.cloneFromProps(props);
    const currentTransform = this.cTr;
    this.transformMat.multiply(currentTransform);
    currentTransform.cloneFromProps(this.transformMat.props);
    const trProps = currentTransform.props;
    this.nativeContext!.setTransform(trProps[0], trProps[1], trProps[4], trProps[5], trProps[12], trProps[13]);
  }

  opacity(op: number) {
    let currentOpacity = this.stack[this.cArrPos].opacity;
    currentOpacity *= op < 0 ? 0 : op;
    const ctx = this.nativeContext!;
    if (this.stack[this.cArrPos].opacity !== currentOpacity) {
      if (this.currentOpacity !== op) {
        ctx.globalAlpha = op;
        this.currentOpacity = op;
      }
      this.stack[this.cArrPos].opacity = currentOpacity;
    }
  }

  fill(rule?: CanvasFillRule) {
    const ctx = this.nativeContext!;
    if (this.appliedFillStyle !== this.currentFillStyle) {
      this.appliedFillStyle = this.currentFillStyle;
      ctx.fillStyle = this.appliedFillStyle;
    }
    if (rule === undefined) {
      ctx.fill();
    } else {
      ctx.fill(rule);
    }
  }

  fillRect(x: number, y: number, w: number, h: number) {
    const ctx = this.nativeContext!;
    if (this.appliedFillStyle !== this.currentFillStyle) {
      this.appliedFillStyle = this.currentFillStyle;
      ctx.fillStyle = this.appliedFillStyle;
    }
    ctx.fillRect(x, y, w, h);
  }

  stroke() {
    const ctx = this.nativeContext!;
    if (this.appliedStrokeStyle !== this.currentStrokeStyle) {
      this.appliedStrokeStyle = this.currentStrokeStyle;
      ctx.strokeStyle = this.appliedStrokeStyle;
    }
    if (this.appliedLineWidth !== this.currentLineWidth) {
      this.appliedLineWidth = this.currentLineWidth;
      ctx.lineWidth = this.appliedLineWidth as unknown as number;
    }
    if (this.appliedLineCap !== this.currentLineCap) {
      this.appliedLineCap = this.currentLineCap;
      ctx.lineCap = this.appliedLineCap as CanvasLineCap;
    }
    if (this.appliedLineJoin !== this.currentLineJoin) {
      this.appliedLineJoin = this.currentLineJoin;
      ctx.lineJoin = this.appliedLineJoin as CanvasLineJoin;
    }
    if (this.appliedMiterLimit !== this.currentMiterLimit) {
      this.appliedMiterLimit = this.currentMiterLimit;
      ctx.miterLimit = this.appliedMiterLimit as unknown as number;
    }
    ctx.stroke();
  }
}

export default CVContextData;
