// svgNS is imported from main.js (JS file, typed as string by allowJs).
// We assert the literal type so the correct createElementNS overload is used.
import { svgNS } from '../../main';

function createNS(type: string): SVGElement {
  return document.createElementNS(svgNS as 'http://www.w3.org/2000/svg', type);
}

export default createNS;
