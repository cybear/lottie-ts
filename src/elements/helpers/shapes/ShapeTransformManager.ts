import Matrix from '../../../3rd_party/transformation-matrix';

type MatrixInstance = InstanceType<typeof Matrix>;

interface TransformFrameEntry {
  transform: {
    key: string;
    mProps: { _mdf?: boolean; v: MatrixInstance };
  };
}

interface TransformSequence {
  transforms: TransformFrameEntry[];
  finalTransform: MatrixInstance;
  _mdf: boolean;
}

class ShapeTransformManager {
  sequences: Record<string, TransformSequence>;
  sequenceList: TransformSequence[];
  transform_key_count: number;

  constructor() {
    this.sequences = {};
    this.sequenceList = [];
    this.transform_key_count = 0;
  }

  addTransformSequence(transforms: TransformFrameEntry[]) {
    let i: number;
    const len = transforms.length;
    let key = '_';
    for (i = 0; i < len; i += 1) {
      key += transforms[i].transform.key + '_';
    }
    let sequence = this.sequences[key];
    if (!sequence) {
      sequence = {
        transforms: transforms.slice(),
        finalTransform: new Matrix(),
        _mdf: false,
      };
      this.sequences[key] = sequence;
      this.sequenceList.push(sequence);
    }
    return sequence;
  }

  processSequence(sequence: TransformSequence, isFirstFrame: boolean) {
    let i = 0;
    const len = sequence.transforms.length;
    let _mdf = isFirstFrame;
    while (i < len && !isFirstFrame) {
      if (sequence.transforms[i].transform.mProps._mdf) {
        _mdf = true;
        break;
      }
      i += 1;
    }
    if (_mdf) {
      sequence.finalTransform.reset();
      for (i = len - 1; i >= 0; i -= 1) {
        sequence.finalTransform.multiply(sequence.transforms[i].transform.mProps.v);
      }
    }
    sequence._mdf = _mdf;
  }

  processSequences(isFirstFrame: boolean) {
    let i: number;
    const len = this.sequenceList.length;
    for (i = 0; i < len; i += 1) {
      this.processSequence(this.sequenceList[i], isFirstFrame);
    }
  }

  getNewKey() {
    this.transform_key_count += 1;
    return '_' + this.transform_key_count;
  }
}

export default ShapeTransformManager;
