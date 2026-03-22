import type { GlobalData, LayerDynamicProperty, TextLayerData } from '../types/lottieRuntime';
import type { TextPropertyHostElement } from '../utils/text/TextProperty';
import LetterProps from '../utils/text/LetterProps';
import TextProperty from '../utils/text/TextProperty';
import TextAnimatorProperty from '../utils/text/TextAnimatorProperty';
import buildShapeString, { type BezierPathNodes } from '../utils/shapes/shapePathBuilder';

interface MatrixPointHelper {
  applyToPointStringified(x: number, y: number): string;
}

interface MatrixTranslateHelper {
  translate(x: number, y: number, z: number): void;
}

interface PathNodesForString {
  i: unknown[];
  o: unknown[];
  v: unknown[][];
}

interface TextShapeEntry {
  ty: string;
  ks: { k: PathNodesForString };
}

/** Subset of `TextProperty` document fields used when positioning glyphs. */
export interface TextDocumentLayoutSlice {
  ps?: [number, number];
  ascent: number;
  ls: number;
  j: number;
  justifyOffset: number;
  boxWidth: number;
  lineWidths: number[];
}

/** Internal flags on `TextProperty` for `validateText`. */
type TextPropertyFrameFlags = TextProperty & { _mdf: boolean; _isFirstFrame: boolean };

class ITextElement {
  declare lettersChangedFlag: boolean;
  declare _mdf: boolean;
  declare initFrame: () => void;
  declare initBaseData: (data: TextLayerData, globalData: GlobalData, comp: unknown) => void;
  declare dynamicProperties: LayerDynamicProperty[];
  declare renderType: string;
  declare initTransform: (data: TextLayerData, globalData: GlobalData, comp: unknown) => void;
  declare initHierarchy: () => void;
  declare initRenderable: () => void;
  declare initRendererElement: () => void;
  declare createContainerElements: () => void;
  declare createRenderableComponents: () => void;
  declare createContent: () => void;
  declare hide: () => void;
  declare prepareRenderableFrame: (num: number) => void;
  declare prepareProperties: (num: number, isVisible: boolean) => void;
  declare isInRange: boolean;
  declare buildNewText: () => void;

  textProperty!: TextProperty;
  textAnimator!: TextAnimatorProperty;

  initElement(data: TextLayerData, globalData: GlobalData, comp: unknown) {
    this.lettersChangedFlag = true;
    this.initFrame();
    this.initBaseData(data, globalData, comp);
    this.textProperty = new TextProperty(this as unknown as TextPropertyHostElement, data.t);
    this.textAnimator = new TextAnimatorProperty(data.t, this.renderType, this);
    this.initTransform(data, globalData, comp);
    this.initHierarchy();
    this.initRenderable();
    this.initRendererElement();
    this.createContainerElements();
    this.createRenderableComponents();
    this.createContent();
    this.hide();
    this.textAnimator.searchProperties();
  }

  prepareFrame(num: number) {
    this._mdf = false;
    this.prepareRenderableFrame(num);
    this.prepareProperties(num, this.isInRange);
  }

  createPathShape(matrixHelper: MatrixPointHelper, shapes: TextShapeEntry[]) {
    let j: number;
    const jLen = shapes.length;
    let pathNodes: PathNodesForString;
    let shapeStr = '';
    for (j = 0; j < jLen; j += 1) {
      if (shapes[j].ty === 'sh') {
        pathNodes = shapes[j].ks.k;
        shapeStr += buildShapeString(pathNodes as BezierPathNodes, pathNodes.i.length, true, matrixHelper);
      }
    }
    return shapeStr;
  }

  updateDocumentData(newData: unknown, index: number) {
    this.textProperty.updateDocumentData(newData as Record<string, unknown>, index);
  }

  canResizeFont(_canResize: boolean) {
    this.textProperty.canResizeFont(_canResize);
  }

  setMinimumFontSize(_fontSize: number) {
    this.textProperty.setMinimumFontSize(_fontSize);
  }

  applyTextPropertiesToMatrix(
    documentData: TextDocumentLayoutSlice,
    matrixHelper: MatrixTranslateHelper,
    lineNumber: number,
    xPos: number,
    yPos: number,
  ) {
    if (documentData.ps) {
      matrixHelper.translate(documentData.ps[0], documentData.ps[1] + documentData.ascent, 0);
    }
    matrixHelper.translate(0, -documentData.ls, 0);
    switch (documentData.j) {
      case 1:
        matrixHelper.translate(
          documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[lineNumber]),
          0,
          0,
        );
        break;
      case 2:
        matrixHelper.translate(
          documentData.justifyOffset + (documentData.boxWidth - documentData.lineWidths[lineNumber]) / 2,
          0,
          0,
        );
        break;
      default:
        break;
    }
    matrixHelper.translate(xPos, yPos, 0);
  }

  buildColor(colorData: number[]) {
    return (
      'rgb(' +
      Math.round(colorData[0] * 255) +
      ',' +
      Math.round(colorData[1] * 255) +
      ',' +
      Math.round(colorData[2] * 255) +
      ')'
    );
  }

  destroy() {}

  validateText() {
    const tp = this.textProperty as TextPropertyFrameFlags;
    if (tp._mdf || tp._isFirstFrame) {
      this.buildNewText();
      tp._isFirstFrame = false;
      tp._mdf = false;
    }
  }
}

(ITextElement.prototype as typeof ITextElement.prototype & { emptyProp: LetterProps }).emptyProp = new LetterProps();

export default ITextElement;
