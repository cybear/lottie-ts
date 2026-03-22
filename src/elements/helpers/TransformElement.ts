import Matrix from '../../3rd_party/transformation-matrix';
import TransformPropertyFactory from '../../utils/TransformProperty';
import effectTypes from '../../utils/helpers/effectTypes';
import type { ElementData } from '../../types/lottieRuntime';

type MatrixInstance = InstanceType<typeof Matrix>;

interface HierarchyTransformLink {
  finalTransform: {
    mProp: { _mdf?: boolean; v: MatrixInstance };
  };
}

interface LocalTransformEffect {
  _mdf: boolean;
  _opMdf: boolean;
  matrix: MatrixInstance;
  opacity: number;
}

interface CompTransformWalk {
  finalTransform?: { mat: MatrixInstance };
  data: { hasMask?: boolean };
  comp: CompTransformWalk | unknown;
}

class TransformElement {
  declare data: ElementData & { ks?: unknown; ao?: unknown; ty?: number };
  declare finalTransform: {
    mProp: {
      o: { v: number; _mdf?: boolean };
      _mdf?: boolean;
      v: MatrixInstance;
      autoOriented?: boolean;
    };
    _matMdf: boolean;
    _localMatMdf: boolean;
    _opMdf: boolean;
    mat: MatrixInstance;
    localMat: MatrixInstance;
    localOpacity: number;
  };
  declare hierarchy: HierarchyTransformLink[] | undefined;
  declare _isFirstFrame: boolean;
  declare localTransforms: LocalTransformEffect[] | undefined;
  declare comp: CompTransformWalk;
  declare renderableEffectsManager: { getEffects(type: string): unknown[] } | undefined;
  declare mHelper: MatrixInstance;

  initTransform() {
    const mat = new Matrix();
    this.finalTransform = {
      mProp: this.data.ks
        ? (TransformPropertyFactory.getTransformProperty(
            this,
            this.data.ks,
            this,
          ) as TransformElement['finalTransform']['mProp'])
        : ({ o: 0 } as unknown as TransformElement['finalTransform']['mProp']),
      _matMdf: false,
      _localMatMdf: false,
      _opMdf: false,
      mat: mat,
      localMat: mat,
      localOpacity: 1,
    };
    if (this.data.ao) {
      this.finalTransform.mProp.autoOriented = true;
    }

    // TODO: check TYPE 11: Guided elements
    if (this.data.ty !== 11) {
      // this.createElements();
    }
  }

  renderTransform() {
    this.finalTransform._opMdf = this.finalTransform.mProp.o._mdf || this._isFirstFrame;
    this.finalTransform._matMdf = this.finalTransform.mProp._mdf || this._isFirstFrame;

    if (this.hierarchy) {
      let mat;
      const finalMat = this.finalTransform.mat;
      let i = 0;
      const len = this.hierarchy.length;
      // Checking if any of the transformation matrices in the hierarchy chain has changed.
      if (!this.finalTransform._matMdf) {
        while (i < len) {
          if (this.hierarchy[i].finalTransform.mProp._mdf) {
            this.finalTransform._matMdf = true;
            break;
          }
          i += 1;
        }
      }

      if (this.finalTransform._matMdf) {
        mat = this.finalTransform.mProp.v.props;
        finalMat.cloneFromProps(mat);
        for (i = 0; i < len; i += 1) {
          finalMat.multiply(this.hierarchy[i].finalTransform.mProp.v);
        }
      }
    }
    if (!this.localTransforms || this.finalTransform._matMdf) {
      this.finalTransform._localMatMdf = this.finalTransform._matMdf;
    }
    if (this.finalTransform._opMdf) {
      this.finalTransform.localOpacity = this.finalTransform.mProp.o.v;
    }
  }

  renderLocalTransform() {
    if (this.localTransforms) {
      let i = 0;
      const len = this.localTransforms.length;
      this.finalTransform._localMatMdf = this.finalTransform._matMdf;
      if (!this.finalTransform._localMatMdf || !this.finalTransform._opMdf) {
        while (i < len) {
          if (this.localTransforms[i]._mdf) {
            this.finalTransform._localMatMdf = true;
          }
          if (this.localTransforms[i]._opMdf && !this.finalTransform._opMdf) {
            this.finalTransform.localOpacity = this.finalTransform.mProp.o.v;
            this.finalTransform._opMdf = true;
          }
          i += 1;
        }
      }
      if (this.finalTransform._localMatMdf) {
        const localMat = this.finalTransform.localMat;
        this.localTransforms[0].matrix.clone(localMat);
        for (i = 1; i < len; i += 1) {
          const lmat = this.localTransforms[i].matrix;
          localMat.multiply(lmat);
        }
        localMat.multiply(this.finalTransform.mat);
      }
      if (this.finalTransform._opMdf) {
        let localOp = this.finalTransform.localOpacity;
        for (i = 0; i < len; i += 1) {
          localOp *= this.localTransforms[i].opacity * 0.01;
        }
        this.finalTransform.localOpacity = localOp;
      }
    }
  }

  searchEffectTransforms() {
    if (this.renderableEffectsManager) {
      const transformEffects = this.renderableEffectsManager.getEffects(effectTypes.TRANSFORM_EFFECT);
      if (transformEffects.length) {
        this.localTransforms = [];
        this.finalTransform.localMat = new Matrix();
        let i = 0;
        const len = transformEffects.length;
        for (i = 0; i < len; i += 1) {
          this.localTransforms.push(transformEffects[i] as LocalTransformEffect);
        }
      }
    }
  }

  globalToLocal(pt: number[]) {
    const transforms: Array<{ mat: MatrixInstance }> = [];
    transforms.push(this.finalTransform);
    let flag = true;
    let comp: CompTransformWalk | unknown = this.comp;
    while (flag) {
      if ((comp as CompTransformWalk).finalTransform) {
        if ((comp as CompTransformWalk).data.hasMask) {
          transforms.splice(0, 0, (comp as CompTransformWalk).finalTransform!);
        }
        comp = (comp as CompTransformWalk).comp;
      } else {
        flag = false;
      }
    }
    let i: number;
    const len = transforms.length;
    let ptNew: number[];
    for (i = 0; i < len; i += 1) {
      ptNew = transforms[i].mat.applyToPointArray(0, 0, 0);
      // ptNew = transforms[i].mat.applyToPointArray(pt[0],pt[1],pt[2]);
      pt = [pt[0] - ptNew[0], pt[1] - ptNew[1], 0];
    }
    return pt;
  }
}

TransformElement.prototype.mHelper = new Matrix();

export default TransformElement;
