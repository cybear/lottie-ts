import { extendPrototype } from '../../utils/functionExtensions';
import { createSizedArray } from '../../utils/helpers/arrays';
import createTag from '../../utils/helpers/html_elements';
import RenderableElement from '../helpers/RenderableElement';
import BaseElement from '../BaseElement';
import TransformElement from '../helpers/TransformElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import ITextElement from '../TextElement';
import CVBaseElement from './CVBaseElement';
import Matrix from '../../3rd_party/transformation-matrix';
import type { GlobalData, GlobalDataCanvasText, TextLayerData } from '../../types/lottieRuntime';
import type TextProperty from '../../utils/text/TextProperty';
import type { TextDocumentLayoutSlice } from '../TextElement';

type MatrixInstance = InstanceType<typeof Matrix>;

interface TextLetterEntry {
  n?: boolean;
  l?: number;
  line?: number;
}

interface RenderedLetterCanvas {
  p?: number[];
  o?: number;
  fc?: string;
  sc?: string;
  sw?: number;
}

/** `TextProperty` is still `@ts-nocheck`; canvas text reads `currentData` at runtime. */
type TextPropertyWithDoc = TextProperty & {
  currentData: TextDocumentLayoutSlice & {
    l: TextLetterEntry[];
    fc?: number[];
    sc?: number[];
    sw?: number;
    f: string;
    finalSize: number;
    finalText: string;
    yOffset: number;
    tr: number;
  };
};

class CVTextElement {
  declare textSpans: Array<{ elem: number[][] }>;
  declare yOffset: number;
  declare fillColorAnim: boolean;
  declare strokeColorAnim: boolean;
  declare strokeWidthAnim: boolean;
  declare stroke: boolean;
  declare fill: boolean;
  declare justifyOffset: number;
  declare currentRender: unknown;
  declare renderType: string;
  declare values: { fill: string; stroke: string; sWidth: number; fValue: string };
  declare initElement: (data: TextLayerData, globalData: GlobalData, comp: unknown) => void;
  declare textProperty: TextProperty;
  declare textAnimator: {
    getMeasures: (data: unknown, flag: boolean) => void;
    renderedLetters: RenderedLetterCanvas[];
  };
  declare mHelper: MatrixInstance;
  declare data: TextLayerData;
  declare globalData: GlobalDataCanvasText;
  declare canvasContext: CanvasRenderingContext2D;
  declare lettersChangedFlag: boolean;
  declare applyTextPropertiesToMatrix: ITextElement['applyTextPropertiesToMatrix'];
  declare buildColor: ITextElement['buildColor'];
  declare validateText: () => void;
  declare tHelper: CanvasRenderingContext2D;

  constructor(data: TextLayerData, globalData: GlobalDataCanvasText, comp: unknown) {
    this.textSpans = [];
    this.yOffset = 0;
    this.fillColorAnim = false;
    this.strokeColorAnim = false;
    this.strokeWidthAnim = false;
    this.stroke = false;
    this.fill = false;
    this.justifyOffset = 0;
    this.currentRender = null;
    this.renderType = 'canvas';
    this.values = {
      fill: 'rgba(0,0,0,0)',
      stroke: 'rgba(0,0,0,0)',
      sWidth: 0,
      fValue: '',
    };
    this.mHelper = new Matrix() as MatrixInstance;
    this.initElement(data, globalData, comp);
  }

  buildNewText() {
    const documentData = (this.textProperty as TextPropertyWithDoc).currentData;
    let hasFill = false;
    if (documentData.fc) {
      hasFill = true;
      this.values.fill = this.buildColor(documentData.fc);
    } else {
      this.values.fill = 'rgba(0,0,0,0)';
    }
    this.fill = hasFill;
    let hasStroke = false;
    if (documentData.sc) {
      hasStroke = true;
      this.values.stroke = this.buildColor(documentData.sc);
      this.values.sWidth = documentData.sw!;
    }
    const fontData = this.globalData.fontManager.getFontByName(documentData.f);
    let i: number;
    const letters = documentData.l!;
    const matrixHelper = this.mHelper;
    this.stroke = hasStroke;
    this.values.fValue =
      documentData.finalSize + 'px ' + this.globalData.fontManager.getFontByName(documentData.f).fFamily;
    const len = documentData.finalText.length;
    let charData: { data?: { shapes?: Array<{ it: unknown[] }> } } | null;
    let shapeData: { shapes?: Array<{ it: unknown[] }> };
    let k: number;
    let kLen: number;
    let shapes: unknown[];
    let j: number;
    let jLen: number;
    let pathNodes: {
      v: number[][];
      o: number[][];
      i: number[][];
      _length: number;
      c?: boolean;
    };
    let commands: number[][];
    let pathArr: number[];
    const singleShape = this.data.singleShape as boolean;
    const trackingOffset = documentData.tr * 0.001 * documentData.finalSize;
    let xPos = 0;
    let yPos = 0;
    let firstLine = true;
    let cnt = 0;
    for (i = 0; i < len; i += 1) {
      charData = this.globalData.fontManager.getCharData(
        documentData.finalText[i],
        fontData.fStyle,
        this.globalData.fontManager.getFontByName(documentData.f).fFamily,
      );
      shapeData = (charData && charData.data) || {};
      matrixHelper.reset();
      if (singleShape && letters[i].n) {
        xPos = -trackingOffset;
        yPos += documentData.yOffset;
        yPos += firstLine ? 1 : 0;
        firstLine = false;
      }
      shapes = shapeData.shapes ? (shapeData.shapes[0] as { it: unknown[] }).it : [];
      jLen = shapes.length;
      matrixHelper.scale(documentData.finalSize / 100, documentData.finalSize / 100);
      if (singleShape) {
        this.applyTextPropertiesToMatrix(
          documentData as TextDocumentLayoutSlice,
          matrixHelper,
          letters[i].line!,
          xPos,
          yPos,
        );
      }
      commands = createSizedArray(jLen - 1) as number[][];
      let commandsCounter = 0;
      for (j = 0; j < jLen; j += 1) {
        const shapeItem = shapes[j] as { ty: string; ks: { k: typeof pathNodes } };
        if (shapeItem.ty === 'sh') {
          kLen = shapeItem.ks.k.i.length;
          pathNodes = shapeItem.ks.k;
          pathArr = [];
          for (k = 1; k < kLen; k += 1) {
            if (k === 1) {
              pathArr.push(
                matrixHelper.applyToX(pathNodes.v[0][0], pathNodes.v[0][1], 0),
                matrixHelper.applyToY(pathNodes.v[0][0], pathNodes.v[0][1], 0),
              );
            }
            pathArr.push(
              matrixHelper.applyToX(pathNodes.o[k - 1][0], pathNodes.o[k - 1][1], 0),
              matrixHelper.applyToY(pathNodes.o[k - 1][0], pathNodes.o[k - 1][1], 0),
              matrixHelper.applyToX(pathNodes.i[k][0], pathNodes.i[k][1], 0),
              matrixHelper.applyToY(pathNodes.i[k][0], pathNodes.i[k][1], 0),
              matrixHelper.applyToX(pathNodes.v[k][0], pathNodes.v[k][1], 0),
              matrixHelper.applyToY(pathNodes.v[k][0], pathNodes.v[k][1], 0),
            );
          }
          pathArr.push(
            matrixHelper.applyToX(pathNodes.o[k - 1][0], pathNodes.o[k - 1][1], 0),
            matrixHelper.applyToY(pathNodes.o[k - 1][0], pathNodes.o[k - 1][1], 0),
            matrixHelper.applyToX(pathNodes.i[0][0], pathNodes.i[0][1], 0),
            matrixHelper.applyToY(pathNodes.i[0][0], pathNodes.i[0][1], 0),
            matrixHelper.applyToX(pathNodes.v[0][0], pathNodes.v[0][1], 0),
            matrixHelper.applyToY(pathNodes.v[0][0], pathNodes.v[0][1], 0),
          );
          commands[commandsCounter] = pathArr;
          commandsCounter += 1;
        }
      }
      if (singleShape) {
        xPos += letters[i].l!;
        xPos += trackingOffset;
      }
      if (this.textSpans[cnt]) {
        this.textSpans[cnt].elem = commands;
      } else {
        this.textSpans[cnt] = { elem: commands };
      }
      cnt += 1;
    }
  }

  renderInnerContent() {
    this.validateText();
    const ctx = this.canvasContext;
    ctx.font = this.values.fValue;
    this.globalData.renderer.ctxLineCap('butt');
    this.globalData.renderer.ctxLineJoin('miter');
    this.globalData.renderer.ctxMiterLimit(4);

    if (!this.data.singleShape) {
      this.textAnimator.getMeasures((this.textProperty as TextPropertyWithDoc).currentData, this.lettersChangedFlag);
    }

    let i: number;
    let j: number;
    let jLen: number;
    let k: number;
    let kLen: number;
    const renderedLetters = this.textAnimator.renderedLetters;

    const letters = (this.textProperty as TextPropertyWithDoc).currentData.l;

    const len = letters.length;
    let renderedLetter: RenderedLetterCanvas | undefined;
    let lastFill: string | null = null;
    let lastStroke: string | null = null;
    let lastStrokeW: number | null = null;
    let commands: number[][];
    let pathArr: number[];
    const renderer = this.globalData.renderer;
    for (i = 0; i < len; i += 1) {
      if (!letters[i].n) {
        renderedLetter = renderedLetters[i];
        if (renderedLetter) {
          renderer.save();
          renderer.ctxTransform(renderedLetter.p!);
          renderer.ctxOpacity(renderedLetter.o!);
        }
        if (this.fill) {
          if (renderedLetter && renderedLetter.fc) {
            if (lastFill !== renderedLetter.fc) {
              renderer.ctxFillStyle(renderedLetter.fc);
              lastFill = renderedLetter.fc;
            }
          } else if (lastFill !== this.values.fill) {
            lastFill = this.values.fill;
            renderer.ctxFillStyle(this.values.fill);
          }
          commands = this.textSpans[i].elem;
          jLen = commands.length;
          this.globalData.canvasContext.beginPath();
          for (j = 0; j < jLen; j += 1) {
            pathArr = commands[j];
            kLen = pathArr.length;
            this.globalData.canvasContext.moveTo(pathArr[0], pathArr[1]);
            for (k = 2; k < kLen; k += 6) {
              this.globalData.canvasContext.bezierCurveTo(
                pathArr[k],
                pathArr[k + 1],
                pathArr[k + 2],
                pathArr[k + 3],
                pathArr[k + 4],
                pathArr[k + 5],
              );
            }
          }
          this.globalData.canvasContext.closePath();
          renderer.ctxFill();
        }
        if (this.stroke) {
          if (renderedLetter && renderedLetter.sw) {
            if (lastStrokeW !== renderedLetter.sw) {
              lastStrokeW = renderedLetter.sw;
              renderer.ctxLineWidth(renderedLetter.sw);
            }
          } else if (lastStrokeW !== this.values.sWidth) {
            lastStrokeW = this.values.sWidth;
            renderer.ctxLineWidth(this.values.sWidth);
          }
          if (renderedLetter && renderedLetter.sc) {
            if (lastStroke !== renderedLetter.sc) {
              lastStroke = renderedLetter.sc;
              renderer.ctxStrokeStyle(renderedLetter.sc);
            }
          } else if (lastStroke !== this.values.stroke) {
            lastStroke = this.values.stroke;
            renderer.ctxStrokeStyle(this.values.stroke);
          }
          commands = this.textSpans[i].elem;
          jLen = commands.length;
          this.globalData.canvasContext.beginPath();
          for (j = 0; j < jLen; j += 1) {
            pathArr = commands[j];
            kLen = pathArr.length;
            this.globalData.canvasContext.moveTo(pathArr[0], pathArr[1]);
            for (k = 2; k < kLen; k += 6) {
              this.globalData.canvasContext.bezierCurveTo(
                pathArr[k],
                pathArr[k + 1],
                pathArr[k + 2],
                pathArr[k + 3],
                pathArr[k + 4],
                pathArr[k + 5],
              );
            }
          }
          this.globalData.canvasContext.closePath();
          renderer.ctxStroke();
        }
        if (renderedLetter) {
          this.globalData.renderer.restore();
        }
      }
    }
  }
}

/** Shared 2D context for font metrics (one per module, same as former prototype field). */
const cvTextMeasureContext = (createTag('canvas') as HTMLCanvasElement).getContext('2d')!;

extendPrototype(
  [BaseElement, TransformElement, CVBaseElement, HierarchyElement, FrameElement, RenderableElement, ITextElement],
  CVTextElement,
);

CVTextElement.prototype.tHelper = cvTextMeasureContext;

export default CVTextElement;
