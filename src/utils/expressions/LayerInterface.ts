/* eslint-disable @typescript-eslint/no-explicit-any -- layer space/transform helpers for expressions */
import { getDescriptor } from '../functionExtensions';
import Matrix from '../../3rd_party/transformation-matrix';
import MaskManagerInterface from './MaskInterface';
import TransformExpressionInterface from './TransformInterface';

const LayerExpressionInterface = (function () {
  function getMatrix(this: any, time?: number) {
    const toWorldMat = new Matrix();
    if (time !== undefined) {
      const propMatrix = this._elem.finalTransform.mProp.getValueAtTime(time);
      propMatrix.clone(toWorldMat);
    } else {
      const transformMat = this._elem.finalTransform.mProp;
      transformMat.applyToMatrix(toWorldMat);
    }
    return toWorldMat;
  }

  function toWorldVec(this: any, arr: number[], time?: number) {
    const toWorldMat = this.getMatrix(time);
    toWorldMat.props[12] = 0;
    toWorldMat.props[13] = 0;
    toWorldMat.props[14] = 0;
    return this.applyPoint(toWorldMat, arr);
  }

  function toWorld(this: any, arr: number[], time?: number) {
    const toWorldMat = this.getMatrix(time);
    return this.applyPoint(toWorldMat, arr);
  }

  function fromWorldVec(this: any, arr: number[], time?: number) {
    const toWorldMat = this.getMatrix(time);
    toWorldMat.props[12] = 0;
    toWorldMat.props[13] = 0;
    toWorldMat.props[14] = 0;
    return this.invertPoint(toWorldMat, arr);
  }

  function fromWorld(this: any, arr: number[], time?: number) {
    const toWorldMat = this.getMatrix(time);
    return this.invertPoint(toWorldMat, arr);
  }

  function applyPoint(this: any, matrix: InstanceType<typeof Matrix>, arr: number[]) {
    if (this._elem.hierarchy && this._elem.hierarchy.length) {
      let i;
      const len = this._elem.hierarchy.length;
      for (i = 0; i < len; i += 1) {
        this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(matrix);
      }
    }
    return matrix.applyToPointArray(arr[0], arr[1], arr[2] || 0);
  }

  function invertPoint(this: any, matrix: InstanceType<typeof Matrix>, arr: number[]) {
    if (this._elem.hierarchy && this._elem.hierarchy.length) {
      let i;
      const len = this._elem.hierarchy.length;
      for (i = 0; i < len; i += 1) {
        this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(matrix);
      }
    }
    return matrix.inversePoint(arr);
  }

  function fromComp(this: any, arr: number[]) {
    const toWorldMat = new Matrix();
    toWorldMat.reset();
    this._elem.finalTransform.mProp.applyToMatrix(toWorldMat);
    if (this._elem.hierarchy && this._elem.hierarchy.length) {
      let i;
      const len = this._elem.hierarchy.length;
      for (i = 0; i < len; i += 1) {
        this._elem.hierarchy[i].finalTransform.mProp.applyToMatrix(toWorldMat);
      }
      return toWorldMat.inversePoint(arr);
    }
    return toWorldMat.inversePoint(arr);
  }

  function sampleImage() {
    return [1, 1, 1, 1];
  }

  return function (elem: any) {
    const _thisLayerFunction: any = function (name: string | number) {
      switch (name) {
        case 'ADBE Root Vectors Group':
        case 'Contents':
        case 2:
          return _thisLayerFunction.shapeInterface;
        case 1:
        case 6:
        case 'Transform':
        case 'transform':
        case 'ADBE Transform Group':
          return transformInterface;
        case 4:
        case 'ADBE Effect Parade':
        case 'effects':
        case 'Effects':
          return _thisLayerFunction.effect;
        case 'ADBE Text Properties':
          return _thisLayerFunction.textInterface;
        default:
          return null;
      }
    };
    function _registerMaskInterface(maskManager: any) {
      _thisLayerFunction.mask = new (MaskManagerInterface as any)(maskManager, elem);
    }
    function _registerEffectsInterface(effects: any) {
      _thisLayerFunction.effect = effects;
    }

    _thisLayerFunction.getMatrix = getMatrix;
    _thisLayerFunction.invertPoint = invertPoint;
    _thisLayerFunction.applyPoint = applyPoint;
    _thisLayerFunction.toWorld = toWorld;
    _thisLayerFunction.toWorldVec = toWorldVec;
    _thisLayerFunction.fromWorld = fromWorld;
    _thisLayerFunction.fromWorldVec = fromWorldVec;
    _thisLayerFunction.toComp = toWorld;
    _thisLayerFunction.fromComp = fromComp;
    _thisLayerFunction.sampleImage = sampleImage;
    _thisLayerFunction.sourceRectAtTime = elem.sourceRectAtTime.bind(elem);
    _thisLayerFunction._elem = elem;
    const transformInterface = TransformExpressionInterface(elem.finalTransform.mProp);
    const ti = transformInterface as object;
    const anchorPointDescriptor = getDescriptor(ti, 'anchorPoint')!;
    Object.defineProperties(_thisLayerFunction, {
      hasParent: {
        get: function () {
          return elem.hierarchy.length;
        },
      },
      parent: {
        get: function () {
          return elem.hierarchy[0].layerInterface;
        },
      },
      rotation: getDescriptor(ti, 'rotation')!,
      scale: getDescriptor(ti, 'scale')!,
      position: getDescriptor(ti, 'position')!,
      opacity: getDescriptor(ti, 'opacity')!,
      anchorPoint: anchorPointDescriptor,
      anchor_point: anchorPointDescriptor,
      transform: {
        get: function () {
          return transformInterface;
        },
      },
      active: {
        get: function () {
          return elem.isInRange;
        },
      },
    });

    _thisLayerFunction.startTime = elem.data.st;
    _thisLayerFunction.index = elem.data.ind;
    _thisLayerFunction.source = elem.data.refId;
    _thisLayerFunction.height = elem.data.ty === 0 ? elem.data.h : 100;
    _thisLayerFunction.width = elem.data.ty === 0 ? elem.data.w : 100;
    _thisLayerFunction.inPoint = elem.data.ip / elem.comp.globalData.frameRate;
    _thisLayerFunction.outPoint = elem.data.op / elem.comp.globalData.frameRate;
    _thisLayerFunction._name = elem.data.nm;

    _thisLayerFunction.registerMaskInterface = _registerMaskInterface;
    _thisLayerFunction.registerEffectsInterface = _registerEffectsInterface;
    return _thisLayerFunction;
  };
})();

export default LayerExpressionInterface;
