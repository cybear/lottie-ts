type TypedArrayType = 'float32' | 'int16' | 'uint8c' | string;
/** Typed or fallback numeric buffers from `createTypedArray`. */
export type NumberArray = number[] | Float32Array | Int16Array | Uint8ClampedArray;

const createTypedArray: (type: TypedArrayType, len: number) => NumberArray = (function () {
  function createRegularArray(type: TypedArrayType, len: number): number[] {
    let i = 0;
    const arr: number[] = [];
    let value: number;
    switch (type) {
      case 'int16':
      case 'uint8c':
        value = 1;
        break;
      default:
        value = 1.1;
        break;
    }
    for (i = 0; i < len; i += 1) {
      arr.push(value);
    }
    return arr;
  }

  function createTypedArrayFactory(type: TypedArrayType, len: number): NumberArray {
    if (type === 'float32') {
      return new Float32Array(len);
    }
    if (type === 'int16') {
      return new Int16Array(len);
    }
    if (type === 'uint8c') {
      return new Uint8ClampedArray(len);
    }
    return createRegularArray(type, len);
  }

  if (typeof Uint8ClampedArray === 'function' && typeof Float32Array === 'function') {
    return createTypedArrayFactory;
  }
  return createRegularArray;
})();

function createSizedArray(len: number): unknown[] {
  return Array.from({ length: len });
}

export { createTypedArray, createSizedArray };
