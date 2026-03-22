// @ts-nocheck
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

class CVTextElement {
  constructor(data, globalData, comp) {
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
    this.initElement(data, globalData, comp);
  }

  buildNewText() {
    const documentData = this.textProperty.currentData;
    this.renderedLetters = createSizedArray(documentData.l ? documentData.l.length : 0);

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
      this.values.sWidth = documentData.sw;
    }
    const fontData = this.globalData.fontManager.getFontByName(documentData.f);
    let i;
    const letters = documentData.l;
    const matrixHelper = this.mHelper;
    this.stroke = hasStroke;
    this.values.fValue =
      documentData.finalSize + 'px ' + this.globalData.fontManager.getFontByName(documentData.f).fFamily;
    const len = documentData.finalText.length;
    // this.tHelper.font = this.values.fValue;
    let charData;
    let shapeData;
    let k;
    let kLen;
    let shapes;
    let j;
    let jLen;
    let pathNodes;
    let commands;
    let pathArr;
    const singleShape = this.data.singleShape;
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
      shapes = shapeData.shapes ? shapeData.shapes[0].it : [];
      jLen = shapes.length;
      matrixHelper.scale(documentData.finalSize / 100, documentData.finalSize / 100);
      if (singleShape) {
        this.applyTextPropertiesToMatrix(documentData, matrixHelper, letters[i].line, xPos, yPos);
      }
      commands = createSizedArray(jLen - 1);
      let commandsCounter = 0;
      for (j = 0; j < jLen; j += 1) {
        if (shapes[j].ty === 'sh') {
          kLen = shapes[j].ks.k.i.length;
          pathNodes = shapes[j].ks.k;
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
        xPos += letters[i].l;
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
    // ctx.lineCap = 'butt';
    this.globalData.renderer.ctxLineJoin('miter');
    // ctx.lineJoin = 'miter';
    this.globalData.renderer.ctxMiterLimit(4);
    // ctx.miterLimit = 4;

    if (!this.data.singleShape) {
      this.textAnimator.getMeasures(this.textProperty.currentData, this.lettersChangedFlag);
    }

    let i;
    let j;
    let jLen;
    let k;
    let kLen;
    const renderedLetters = this.textAnimator.renderedLetters;

    const letters = this.textProperty.currentData.l;

    const len = letters.length;
    let renderedLetter;
    let lastFill = null;
    let lastStroke = null;
    let lastStrokeW = null;
    let commands;
    let pathArr;
    const renderer = this.globalData.renderer;
    for (i = 0; i < len; i += 1) {
      if (!letters[i].n) {
        renderedLetter = renderedLetters[i];
        if (renderedLetter) {
          renderer.save();
          renderer.ctxTransform(renderedLetter.p);
          renderer.ctxOpacity(renderedLetter.o);
        }
        if (this.fill) {
          if (renderedLetter && renderedLetter.fc) {
            if (lastFill !== renderedLetter.fc) {
              renderer.ctxFillStyle(renderedLetter.fc);
              lastFill = renderedLetter.fc;
              // ctx.fillStyle = renderedLetter.fc;
            }
          } else if (lastFill !== this.values.fill) {
            lastFill = this.values.fill;
            renderer.ctxFillStyle(this.values.fill);
            // ctx.fillStyle = this.values.fill;
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
          // this.globalData.canvasContext.fill();
          /// ctx.fillText(this.textSpans[i].val,0,0);
        }
        if (this.stroke) {
          if (renderedLetter && renderedLetter.sw) {
            if (lastStrokeW !== renderedLetter.sw) {
              lastStrokeW = renderedLetter.sw;
              renderer.ctxLineWidth(renderedLetter.sw);
              // ctx.lineWidth = renderedLetter.sw;
            }
          } else if (lastStrokeW !== this.values.sWidth) {
            lastStrokeW = this.values.sWidth;
            renderer.ctxLineWidth(this.values.sWidth);
            // ctx.lineWidth = this.values.sWidth;
          }
          if (renderedLetter && renderedLetter.sc) {
            if (lastStroke !== renderedLetter.sc) {
              lastStroke = renderedLetter.sc;
              renderer.ctxStrokeStyle(renderedLetter.sc);
              // ctx.strokeStyle = renderedLetter.sc;
            }
          } else if (lastStroke !== this.values.stroke) {
            lastStroke = this.values.stroke;
            renderer.ctxStrokeStyle(this.values.stroke);
            // ctx.strokeStyle = this.values.stroke;
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
          // this.globalData.canvasContext.stroke();
          /// ctx.strokeText(letters[i].val,0,0);
        }
        if (renderedLetter) {
          this.globalData.renderer.restore();
        }
      }
    }
  }
}

/** Shared 2D context for font metrics (one per module, same as former prototype field). */
const cvTextMeasureContext = createTag('canvas').getContext('2d');

extendPrototype(
  [BaseElement, TransformElement, CVBaseElement, HierarchyElement, FrameElement, RenderableElement, ITextElement],
  CVTextElement,
);

CVTextElement.prototype.tHelper = cvTextMeasureContext;

export default CVTextElement;
