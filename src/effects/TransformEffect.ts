import effectTypes from '../utils/helpers/effectTypes';
import Matrix from '../3rd_party/transformation-matrix';
import { degToRads } from '../utils/common';
import type { GroupEffectLike } from '../types/lottieRuntime';

type MatrixInstance = InstanceType<typeof Matrix>;

class TransformEffect {
  declare effectsManager: GroupEffectLike;
  declare type: string;
  declare matrix: MatrixInstance;
  declare opacity: number;
  declare _mdf: boolean;
  declare _opMdf: boolean;

  init(effectsManager: GroupEffectLike) {
    this.effectsManager = effectsManager;
    this.type = effectTypes.TRANSFORM_EFFECT;
    this.matrix = new Matrix() as MatrixInstance;
    this.opacity = -1;
    this._mdf = false;
    this._opMdf = false;
  }

  renderFrame(forceFrame: boolean) {
    this._opMdf = false;
    this._mdf = false;
    if (forceFrame || this.effectsManager._mdf) {
      const effectElements = this.effectsManager.effectElements;
      const anchor = effectElements[0].p.v as number[];
      const position = effectElements[1].p.v as number[];
      const isUniformScale = effectElements[2].p.v === 1;
      const scaleHeight = effectElements[3].p.v as number;
      const scaleWidth = isUniformScale ? scaleHeight : (effectElements[4].p.v as number);
      const skew = effectElements[5].p.v as number;
      const skewAxis = effectElements[6].p.v as number;
      const rotation = effectElements[7].p.v as number;
      this.matrix.reset();
      this.matrix.translate(-anchor[0], -anchor[1], anchor[2]);
      this.matrix.scale(scaleWidth * 0.01, scaleHeight * 0.01, 1);
      this.matrix.rotate(-rotation * degToRads);
      this.matrix.skewFromAxis(-skew * degToRads, (skewAxis + 90) * degToRads);
      this.matrix.translate(position[0], position[1], 0);
      this._mdf = true;
      if (this.opacity !== effectElements[8].p.v) {
        this.opacity = effectElements[8].p.v as number;
        this._opMdf = true;
      }
    }
  }
}

export default TransformEffect;
