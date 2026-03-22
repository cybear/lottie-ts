import Matrix from '../../../3rd_party/transformation-matrix';
import buildShapeString, {
  type BezierPathNodesWithMeta,
  type ShapePathMatrixHelper,
} from '../../../utils/shapes/shapePathBuilder';
import { bmFloor } from '../../../utils/common';
import type SVGStyleData from './SVGStyleData';

type MatrixInstance = InstanceType<typeof Matrix>;

interface TyData {
  ty: string;
  t?: number;
  hd?: boolean;
}

interface PathShapeCollection {
  _length: number;
  shapes: Array<BezierPathNodesWithMeta | null | undefined>;
}

interface PathItemData {
  sh: {
    _mdf: boolean;
    paths: PathShapeCollection;
  };
  styles: Array<{ lvl: number; d: string; _mdf: boolean }>;
  lvl: number;
  caches: string[];
  transformers: Array<{ mProps: { _mdf: boolean; v: MatrixInstance } }>;
}

interface FillItemData {
  c: { v: number[]; _mdf: boolean };
  o: { v: string | number; _mdf: boolean };
  style: { pElem: SVGElement; msElem?: SVGElement | null };
}

interface StrokeItemData extends FillItemData {
  d?: { _mdf: boolean; dashStr?: string; dashoffset: { 0: number } };
  w: { v: string | number; _mdf: boolean };
}

interface GradientG {
  _hasOpacity?: boolean;
  _collapsable?: boolean;
  _cmdf?: boolean;
  _omdf?: boolean;
  c?: number[];
  o?: number[];
}

interface GradientItemData {
  gf: SVGLinearGradientElement | SVGRadialGradientElement;
  g: GradientG;
  s: { v: number[]; _mdf: boolean };
  e: { v: number[]; _mdf: boolean };
  h: { v: number; _mdf: boolean };
  a: { v: number; _mdf: boolean };
  o: { v: string | number; _mdf: boolean };
  c?: { v: number[]; _mdf: boolean };
  cst: SVGStopElement[];
  ost?: SVGStopElement[];
  of?: SVGLinearGradientElement | SVGRadialGradientElement;
  style: SVGStyleData;
}

interface TransformItemData {
  transform: {
    op: { v: string; _mdf: boolean };
    mProps: { _mdf: boolean; v: MatrixInstance & { to2dCSS(): string } };
    container: SVGElement;
  };
}

type RenderFn = (styleData: TyData, itemData: unknown, isFirstFrame: boolean) => void;

const SVGElementsRenderer = (function () {
  const _identityMatrix = new Matrix();
  const _matrixHelper = new Matrix();

  const ob = {
    createRenderFunction: createRenderFunction,
  };

  function createRenderFunction(data: TyData): RenderFn | null {
    switch (data.ty) {
      case 'fl':
        return renderFill as RenderFn;
      case 'gf':
        return renderGradient as RenderFn;
      case 'gs':
        return renderGradientStroke as RenderFn;
      case 'st':
        return renderStroke as RenderFn;
      case 'sh':
      case 'el':
      case 'rc':
      case 'sr':
        return renderPath as RenderFn;
      case 'tr':
        return renderContentTransform as RenderFn;
      case 'no':
        return renderNoop;
      default:
        return null;
    }
  }

  function renderContentTransform(_styleData: TyData, itemData: unknown, isFirstFrame: boolean) {
    const id = itemData as TransformItemData;
    if (isFirstFrame || id.transform.op._mdf) {
      id.transform.container.setAttribute('opacity', id.transform.op.v);
    }
    if (isFirstFrame || id.transform.mProps._mdf) {
      id.transform.container.setAttribute('transform', id.transform.mProps.v.to2dCSS());
    }
  }

  function renderNoop() {}

  function renderPath(styleData: TyData, itemData: unknown, isFirstFrame: boolean) {
    const data = itemData as PathItemData;
    let j: number;
    let jLen: number;
    let pathStringTransformed: string;
    let redraw: boolean;
    let pathNodes: BezierPathNodesWithMeta | null | undefined;
    let l: number;
    const lLen = data.styles.length;
    const lvl = data.lvl;
    let paths: PathShapeCollection;
    let mat: MatrixInstance & ShapePathMatrixHelper;
    let iterations: number;
    let k: number;
    for (l = 0; l < lLen; l += 1) {
      redraw = data.sh._mdf || isFirstFrame;
      if (data.styles[l].lvl < lvl) {
        mat = _matrixHelper.reset() as MatrixInstance & ShapePathMatrixHelper;
        iterations = lvl - data.styles[l].lvl;
        k = data.transformers.length - 1;
        while (!redraw && iterations > 0) {
          redraw = data.transformers[k].mProps._mdf || redraw;
          iterations -= 1;
          k -= 1;
        }
        if (redraw) {
          iterations = lvl - data.styles[l].lvl;
          k = data.transformers.length - 1;
          while (iterations > 0) {
            mat.multiply(data.transformers[k].mProps.v);
            iterations -= 1;
            k -= 1;
          }
        }
      } else {
        mat = _identityMatrix as MatrixInstance & ShapePathMatrixHelper;
      }
      paths = data.sh.paths;
      jLen = paths._length;
      if (redraw) {
        pathStringTransformed = '';
        for (j = 0; j < jLen; j += 1) {
          pathNodes = paths.shapes[j];
          if (pathNodes && pathNodes._length) {
            pathStringTransformed += buildShapeString(pathNodes, pathNodes._length, pathNodes.c, mat);
          }
        }
        data.caches[l] = pathStringTransformed;
      } else {
        pathStringTransformed = data.caches[l];
      }
      data.styles[l].d += styleData.hd === true ? '' : pathStringTransformed;
      data.styles[l]._mdf = redraw || data.styles[l]._mdf;
    }
  }

  function renderFill(_styleData: TyData, itemData: unknown, isFirstFrame: boolean) {
    const item = itemData as FillItemData;
    const styleElem = item.style;

    if (item.c._mdf || isFirstFrame) {
      styleElem.pElem.setAttribute(
        'fill',
        'rgb(' + bmFloor(item.c.v[0]) + ',' + bmFloor(item.c.v[1]) + ',' + bmFloor(item.c.v[2]) + ')',
      );
    }
    if (item.o._mdf || isFirstFrame) {
      styleElem.pElem.setAttribute('fill-opacity', String(item.o.v));
    }
  }

  function renderGradientStroke(styleData: TyData, itemData: unknown, isFirstFrame: boolean) {
    renderGradient(styleData, itemData, isFirstFrame);
    renderStroke(styleData, itemData, isFirstFrame);
  }

  function renderGradient(styleData: TyData, itemData: unknown, isFirstFrame: boolean) {
    const item = itemData as GradientItemData;
    const gfill = item.gf;
    const hasOpacity = !!item.g._hasOpacity;
    const pt1 = item.s.v;
    const pt2 = item.e.v;

    if (item.o._mdf || isFirstFrame) {
      const attr = styleData.ty === 'gf' ? 'fill-opacity' : 'stroke-opacity';
      item.style.pElem.setAttribute(attr, String(item.o.v));
    }
    if (item.s._mdf || isFirstFrame) {
      const attr1 = styleData.t === 1 ? 'x1' : 'cx';
      const attr2 = attr1 === 'x1' ? 'y1' : 'cy';
      gfill.setAttribute(attr1, String(pt1[0]));
      gfill.setAttribute(attr2, String(pt1[1]));
      if (hasOpacity && !item.g._collapsable && item.of) {
        item.of.setAttribute(attr1, String(pt1[0]));
        item.of.setAttribute(attr2, String(pt1[1]));
      }
    }
    let stops: SVGStopElement[];
    let i: number;
    let len: number;
    let stop: SVGStopElement;
    if (item.g._cmdf || isFirstFrame) {
      stops = item.cst;
      const cValues = item.g.c!;
      len = stops.length;
      for (i = 0; i < len; i += 1) {
        stop = stops[i];
        stop.setAttribute('offset', cValues[i * 4] + '%');
        stop.setAttribute(
          'stop-color',
          'rgb(' + cValues[i * 4 + 1] + ',' + cValues[i * 4 + 2] + ',' + cValues[i * 4 + 3] + ')',
        );
      }
    }
    if (hasOpacity && (item.g._omdf || isFirstFrame)) {
      const oValues = item.g.o!;
      if (item.g._collapsable) {
        stops = item.cst;
      } else {
        stops = item.ost!;
      }
      len = stops.length;
      for (i = 0; i < len; i += 1) {
        stop = stops[i];
        if (!item.g._collapsable) {
          stop.setAttribute('offset', oValues[i * 2] + '%');
        }
        stop.setAttribute('stop-opacity', String(oValues[i * 2 + 1]));
      }
    }
    if (styleData.t === 1) {
      if (item.e._mdf || isFirstFrame) {
        gfill.setAttribute('x2', String(pt2[0]));
        gfill.setAttribute('y2', String(pt2[1]));
        if (hasOpacity && !item.g._collapsable && item.of) {
          item.of.setAttribute('x2', String(pt2[0]));
          item.of.setAttribute('y2', String(pt2[1]));
        }
      }
    } else {
      let rad: number | undefined;
      if (item.s._mdf || item.e._mdf || isFirstFrame) {
        rad = Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
        gfill.setAttribute('r', String(rad));
        if (hasOpacity && !item.g._collapsable && item.of) {
          item.of.setAttribute('r', String(rad));
        }
      }
      if (item.s._mdf || item.e._mdf || item.h._mdf || item.a._mdf || isFirstFrame) {
        if (!rad) {
          rad = Math.sqrt(Math.pow(pt1[0] - pt2[0], 2) + Math.pow(pt1[1] - pt2[1], 2));
        }
        const ang = Math.atan2(pt2[1] - pt1[1], pt2[0] - pt1[0]);

        let percent = item.h.v;
        if (percent >= 1) {
          percent = 0.99;
        } else if (percent <= -1) {
          percent = -0.99;
        }
        const dist = rad * percent;
        const x = Math.cos(ang + item.a.v) * dist + pt1[0];
        const y = Math.sin(ang + item.a.v) * dist + pt1[1];
        gfill.setAttribute('fx', String(x));
        gfill.setAttribute('fy', String(y));
        if (hasOpacity && !item.g._collapsable && item.of) {
          item.of.setAttribute('fx', String(x));
          item.of.setAttribute('fy', String(y));
        }
      }
    }
  }

  function renderStroke(styleData: TyData, itemData: unknown, isFirstFrame: boolean) {
    const item = itemData as StrokeItemData;
    const styleElem = item.style;
    const d = item.d;
    if (d && (d._mdf || isFirstFrame) && d.dashStr) {
      styleElem.pElem.setAttribute('stroke-dasharray', d.dashStr);
      styleElem.pElem.setAttribute('stroke-dashoffset', String(d.dashoffset[0]));
    }
    if (item.c && (item.c._mdf || isFirstFrame)) {
      styleElem.pElem.setAttribute(
        'stroke',
        'rgb(' + bmFloor(item.c.v[0]) + ',' + bmFloor(item.c.v[1]) + ',' + bmFloor(item.c.v[2]) + ')',
      );
    }
    if (item.o._mdf || isFirstFrame) {
      styleElem.pElem.setAttribute('stroke-opacity', String(item.o.v));
    }
    if (item.w._mdf || isFirstFrame) {
      styleElem.pElem.setAttribute('stroke-width', String(item.w.v));
      if (styleElem.msElem) {
        styleElem.msElem.setAttribute('stroke-width', String(item.w.v));
      }
    }
  }

  return ob;
})();

export default SVGElementsRenderer;
