import { degToRads } from '../common';
import PropertyFactory from '../PropertyFactory';
import TextSelectorProp from './TextSelectorProperty';

type PropOrStub = { propType: boolean } | ReturnType<typeof PropertyFactory.getProp>;

interface AnimatorPropsJson {
  a: Record<string, unknown>;
  s: { t?: unknown } & Record<string, unknown>;
}

class TextAnimatorDataProperty {
  a: Record<string, PropOrStub>;
  s: ReturnType<typeof TextSelectorProp.getTextSelectorProp> & { t?: unknown };

  constructor(elem: unknown, animatorProps: AnimatorPropsJson, container: unknown) {
    const defaultData: { propType: boolean } = { propType: false };
    const getProp = PropertyFactory.getProp;
    const textAnimatorAnimatables = animatorProps.a;
    this.a = {
      r: textAnimatorAnimatables.r ? getProp(elem, textAnimatorAnimatables.r, 0, degToRads, container) : defaultData,
      rx: textAnimatorAnimatables.rx ? getProp(elem, textAnimatorAnimatables.rx, 0, degToRads, container) : defaultData,
      ry: textAnimatorAnimatables.ry ? getProp(elem, textAnimatorAnimatables.ry, 0, degToRads, container) : defaultData,
      sk: textAnimatorAnimatables.sk ? getProp(elem, textAnimatorAnimatables.sk, 0, degToRads, container) : defaultData,
      sa: textAnimatorAnimatables.sa ? getProp(elem, textAnimatorAnimatables.sa, 0, degToRads, container) : defaultData,
      s: textAnimatorAnimatables.s ? getProp(elem, textAnimatorAnimatables.s, 1, 0.01, container) : defaultData,
      a: textAnimatorAnimatables.a ? getProp(elem, textAnimatorAnimatables.a, 1, 0, container) : defaultData,
      o: textAnimatorAnimatables.o ? getProp(elem, textAnimatorAnimatables.o, 0, 0.01, container) : defaultData,
      p: textAnimatorAnimatables.p ? getProp(elem, textAnimatorAnimatables.p, 1, 0, container) : defaultData,
      sw: textAnimatorAnimatables.sw ? getProp(elem, textAnimatorAnimatables.sw, 0, 0, container) : defaultData,
      sc: textAnimatorAnimatables.sc ? getProp(elem, textAnimatorAnimatables.sc, 1, 0, container) : defaultData,
      fc: textAnimatorAnimatables.fc ? getProp(elem, textAnimatorAnimatables.fc, 1, 0, container) : defaultData,
      fh: textAnimatorAnimatables.fh ? getProp(elem, textAnimatorAnimatables.fh, 0, 0, container) : defaultData,
      fs: textAnimatorAnimatables.fs ? getProp(elem, textAnimatorAnimatables.fs, 0, 0.01, container) : defaultData,
      fb: textAnimatorAnimatables.fb ? getProp(elem, textAnimatorAnimatables.fb, 0, 0.01, container) : defaultData,
      t: textAnimatorAnimatables.t ? getProp(elem, textAnimatorAnimatables.t, 0, 0, container) : defaultData,
    } as Record<string, PropOrStub>;

    this.s = TextSelectorProp.getTextSelectorProp(elem, animatorProps.s, container) as TextAnimatorDataProperty['s'];
    this.s.t = animatorProps.s.t;
  }
}

export default TextAnimatorDataProperty;
