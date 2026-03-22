const svgNS = 'http://www.w3.org/2000/svg';

let locationHref = '';
let _useWebWorker = false;

const initialDefaultFrame = -999999;

const setWebWorker = (flag: unknown) => {
  _useWebWorker = !!flag;
};
const getWebWorker = () => _useWebWorker;

const setLocationHref = (value: string) => {
  locationHref = value;
};
const getLocationHref = () => locationHref;

export { svgNS, initialDefaultFrame, setWebWorker, getWebWorker, setLocationHref, getLocationHref };
