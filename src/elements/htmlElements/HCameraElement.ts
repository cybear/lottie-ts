import { degToRads } from '../../utils/common';
import PropertyFactory from '../../utils/PropertyFactory';
import BaseElement from '../BaseElement';
import HierarchyElement from '../helpers/HierarchyElement';
import FrameElement from '../helpers/FrameElement';
import Matrix from '../../3rd_party/transformation-matrix';
import type { CameraLayerData, GlobalData, HybridCompWithThreeD } from '../../types/lottieRuntime';

type MatrixInstance = InstanceType<typeof Matrix>;

type VendorCSSStyle = CSSStyleDeclaration & {
  webkitPerspective?: string;
  webkitTransform?: string;
  webkitTransformOrigin?: string;
  mozTransformOrigin?: string;
};

interface MdfNum {
  v: number;
  _mdf: boolean;
}

interface MdfVec3 {
  v: number[];
  _mdf: boolean;
}

interface OrProp extends MdfVec3 {
  sh?: boolean;
}

interface HierarchyCameraEntry {
  finalTransform: {
    mProp: {
      _mdf: boolean;
      p: MdfVec3;
      or: MdfVec3;
      rx: MdfNum;
      ry: MdfNum;
      rz: MdfNum;
      s: MdfVec3;
      a: MdfVec3;
    };
  };
}

class HCameraElement extends BaseElement {
  declare initFrame: () => void;
  declare initHierarchy: () => void;
  declare prepareProperties: (num: number, isVisible: boolean) => void;
  declare globalData: GlobalData;
  declare hierarchy: HierarchyCameraEntry[] | null;

  pe!: MdfNum;
  px!: MdfNum;
  py!: MdfNum;
  pz!: MdfNum;
  p!: MdfVec3;
  a?: MdfVec3;
  or!: OrProp;
  rx!: MdfNum;
  ry!: MdfNum;
  rz!: MdfNum;
  mat!: MatrixInstance;
  _prevMat!: MatrixInstance;
  _isFirstFrame!: boolean;
  finalTransform!: { mProp: HCameraElement };
  comp!: HybridCompWithThreeD;

  constructor(data: CameraLayerData, globalData: GlobalData, comp: unknown) {
    super();
    this.initFrame();
    this.initBaseData(data, globalData, comp);
    this.initHierarchy();
    const getProp = PropertyFactory.getProp;
    this.pe = getProp(this, data.pe, 0, 0, this) as MdfNum;
    const ks = data.ks;
    const p = ks.p as { s?: boolean; x?: unknown; y?: unknown; z?: unknown };
    if (p.s) {
      this.px = getProp(this, p.x, 1, 0, this) as MdfNum;
      this.py = getProp(this, p.y, 1, 0, this) as MdfNum;
      this.pz = getProp(this, p.z, 1, 0, this) as MdfNum;
    } else {
      this.p = getProp(this, ks.p, 1, 0, this) as MdfVec3;
    }
    if (ks.a) {
      this.a = getProp(this, ks.a, 1, 0, this) as MdfVec3;
    }
    const orK = ks.or.k as Array<{ to?: unknown; ti?: unknown }>;
    if (orK.length && orK[0].to) {
      let i: number;
      const len = orK.length;
      for (i = 0; i < len; i += 1) {
        orK[i].to = null;
        orK[i].ti = null;
      }
    }
    this.or = getProp(this, ks.or, 1, degToRads, this) as OrProp;
    this.or.sh = true;
    this.rx = getProp(this, ks.rx, 0, degToRads, this) as MdfNum;
    this.ry = getProp(this, ks.ry, 0, degToRads, this) as MdfNum;
    this.rz = getProp(this, ks.rz, 0, degToRads, this) as MdfNum;
    this.mat = new Matrix() as MatrixInstance;
    this._prevMat = new Matrix() as MatrixInstance;
    this._isFirstFrame = true;

    // TODO: find a better way to make the HCamera element to be compatible with the LayerInterface and TransformInterface.
    this.finalTransform = {
      mProp: this,
    };
  }

  setup() {
    let i: number;
    const len = this.comp.threeDElements.length;
    let comp: HybridCompWithThreeD['threeDElements'][number];
    let perspectiveStyle: VendorCSSStyle;
    let containerStyle: VendorCSSStyle;
    for (i = 0; i < len; i += 1) {
      comp = this.comp.threeDElements[i];
      if (comp.type === '3d') {
        perspectiveStyle = comp.perspectiveElem.style as VendorCSSStyle;
        containerStyle = comp.container.style as VendorCSSStyle;
        const perspective = this.pe.v + 'px';
        const origin = '0px 0px 0px';
        const matrix = 'matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)';
        perspectiveStyle.perspective = perspective;
        perspectiveStyle.webkitPerspective = perspective;
        containerStyle.transformOrigin = origin;
        containerStyle.mozTransformOrigin = origin;
        containerStyle.webkitTransformOrigin = origin;
        perspectiveStyle.transform = matrix;
        perspectiveStyle.webkitTransform = matrix;
      }
    }
  }

  createElements() {}

  hide() {}

  renderFrame() {
    let _mdf = this._isFirstFrame;
    let i: number;
    let len: number;
    const hierarchy = this.hierarchy as HierarchyCameraEntry[] | null;
    if (hierarchy) {
      len = hierarchy.length;
      for (i = 0; i < len; i += 1) {
        _mdf = hierarchy[i].finalTransform.mProp._mdf || _mdf;
      }
    }
    if (
      _mdf ||
      this.pe._mdf ||
      (this.p && this.p._mdf) ||
      (this.px && (this.px._mdf || this.py._mdf || this.pz._mdf)) ||
      this.rx._mdf ||
      this.ry._mdf ||
      this.rz._mdf ||
      this.or._mdf ||
      (this.a && this.a._mdf)
    ) {
      this.mat.reset();

      if (hierarchy) {
        len = hierarchy.length - 1;
        for (i = len; i >= 0; i -= 1) {
          const mTransf = hierarchy[i].finalTransform.mProp;
          this.mat.translate(-mTransf.p.v[0], -mTransf.p.v[1], mTransf.p.v[2]);
          this.mat.rotateX(-mTransf.or.v[0]).rotateY(-mTransf.or.v[1]).rotateZ(mTransf.or.v[2]);
          this.mat.rotateX(-mTransf.rx.v).rotateY(-mTransf.ry.v).rotateZ(mTransf.rz.v);
          this.mat.scale(1 / mTransf.s.v[0], 1 / mTransf.s.v[1], 1 / mTransf.s.v[2]);
          this.mat.translate(mTransf.a.v[0], mTransf.a.v[1], mTransf.a.v[2]);
        }
      }
      if (this.p) {
        this.mat.translate(-this.p.v[0], -this.p.v[1], this.p.v[2]);
      } else {
        this.mat.translate(-this.px.v, -this.py.v, this.pz.v);
      }
      if (this.a) {
        let diffVector: number[];
        if (this.p) {
          diffVector = [this.p.v[0] - this.a.v[0], this.p.v[1] - this.a.v[1], this.p.v[2] - this.a.v[2]];
        } else {
          diffVector = [this.px.v - this.a.v[0], this.py.v - this.a.v[1], this.pz.v - this.a.v[2]];
        }
        const mag = Math.sqrt(Math.pow(diffVector[0], 2) + Math.pow(diffVector[1], 2) + Math.pow(diffVector[2], 2));
        const lookDir = [diffVector[0] / mag, diffVector[1] / mag, diffVector[2] / mag];
        const lookLengthOnXZ = Math.sqrt(lookDir[2] * lookDir[2] + lookDir[0] * lookDir[0]);
        const mRotationX = Math.atan2(lookDir[1], lookLengthOnXZ);
        const mRotationY = Math.atan2(lookDir[0], -lookDir[2]);
        this.mat.rotateY(mRotationY).rotateX(-mRotationX);
      }
      this.mat.rotateX(-this.rx.v).rotateY(-this.ry.v).rotateZ(this.rz.v);
      this.mat.rotateX(-this.or.v[0]).rotateY(-this.or.v[1]).rotateZ(this.or.v[2]);
      this.mat.translate(this.globalData.compSize!.w / 2, this.globalData.compSize!.h / 2, 0);
      this.mat.translate(0, 0, this.pe.v);

      const hasMatrixChanged = !this._prevMat.equals(this.mat);
      if ((hasMatrixChanged || this.pe._mdf) && this.comp.threeDElements) {
        len = this.comp.threeDElements.length;
        let comp: HybridCompWithThreeD['threeDElements'][number];
        let perspectiveStyle: VendorCSSStyle;
        let containerStyle: VendorCSSStyle;
        for (i = 0; i < len; i += 1) {
          comp = this.comp.threeDElements[i];
          if (comp.type === '3d') {
            if (hasMatrixChanged) {
              const matValue = this.mat.toCSS();
              containerStyle = comp.container.style as VendorCSSStyle;
              containerStyle.transform = matValue;
              containerStyle.webkitTransform = matValue;
            }
            if (this.pe._mdf) {
              perspectiveStyle = comp.perspectiveElem.style as VendorCSSStyle;
              perspectiveStyle.perspective = this.pe.v + 'px';
              perspectiveStyle.webkitPerspective = this.pe.v + 'px';
            }
          }
        }
        this.mat.clone(this._prevMat);
      }
    }
    this._isFirstFrame = false;
  }

  prepareFrame(num: number) {
    this.prepareProperties(num, true);
  }

  destroy() {}

  getBaseElement() {
    return null;
  }
}
const getRequiredDescriptor = (proto: object, key: string): PropertyDescriptor => {
  const desc = Object.getOwnPropertyDescriptor(proto, key);
  if (!desc) {
    throw new Error(`Missing descriptor for ${key}`);
  }
  return desc;
};

Object.defineProperties(HCameraElement.prototype, {
  initFrame: getRequiredDescriptor(FrameElement.prototype, 'initFrame'),
  prepareProperties: getRequiredDescriptor(FrameElement.prototype, 'prepareProperties'),
  addDynamicProperty: getRequiredDescriptor(FrameElement.prototype, 'addDynamicProperty'),
  initHierarchy: getRequiredDescriptor(HierarchyElement.prototype, 'initHierarchy'),
  setHierarchy: getRequiredDescriptor(HierarchyElement.prototype, 'setHierarchy'),
  setAsParent: getRequiredDescriptor(HierarchyElement.prototype, 'setAsParent'),
  checkParenting: getRequiredDescriptor(HierarchyElement.prototype, 'checkParenting'),
});

export default HCameraElement;
