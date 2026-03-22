type Matrix16 = number[];

interface LetterPropsMdf {
  o: boolean;
  sw: boolean;
  sc: boolean;
  fc: boolean;
  m: boolean;
  p: boolean;
}

class LetterProps {
  o: number | undefined;
  sw: unknown;
  sc: unknown;
  fc: unknown;
  m: unknown;
  p: Matrix16;
  _mdf: LetterPropsMdf;

  constructor(o?: number, sw?: unknown, sc?: unknown, fc?: unknown, m?: unknown, p?: Matrix16) {
    this.o = o;
    this.sw = sw;
    this.sc = sc;
    this.fc = fc;
    this.m = m;
    this.p = p ?? [];
    this._mdf = {
      o: true,
      sw: !!sw,
      sc: !!sc,
      fc: !!fc,
      m: true,
      p: true,
    };
  }

  update(o: number | undefined, sw: unknown, sc: unknown, fc: unknown, m: unknown, p: Matrix16): boolean {
    this._mdf.o = false;
    this._mdf.sw = false;
    this._mdf.sc = false;
    this._mdf.fc = false;
    this._mdf.m = false;
    this._mdf.p = false;
    let updated = false;

    if (this.o !== o) {
      this.o = o;
      this._mdf.o = true;
      updated = true;
    }
    if (this.sw !== sw) {
      this.sw = sw;
      this._mdf.sw = true;
      updated = true;
    }
    if (this.sc !== sc) {
      this.sc = sc;
      this._mdf.sc = true;
      updated = true;
    }
    if (this.fc !== fc) {
      this.fc = fc;
      this._mdf.fc = true;
      updated = true;
    }
    if (this.m !== m) {
      this.m = m;
      this._mdf.m = true;
      updated = true;
    }
    if (
      p.length &&
      (this.p[0] !== p[0] ||
        this.p[1] !== p[1] ||
        this.p[4] !== p[4] ||
        this.p[5] !== p[5] ||
        this.p[12] !== p[12] ||
        this.p[13] !== p[13])
    ) {
      this.p = p;
      this._mdf.p = true;
      updated = true;
    }
    return updated;
  }
}

export default LetterProps;
