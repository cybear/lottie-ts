import createNS from './helpers/svg_elements';
import createTag from './helpers/html_elements';
import getFontProperties from './getFontProperties';

const FontManager = (function () {
  const maxWaitingTime = 5000;
  const emptyChar = {
    w: 0,
    size: 0,
    shapes: [] as any[],
    data: {
      shapes: [] as any[],
    },
  };
  let combinedCharacters: number[] = [];
  // Hindi characters
  combinedCharacters = combinedCharacters.concat([
    2304, 2305, 2306, 2307, 2362, 2363, 2364, 2364, 2366, 2367, 2368, 2369, 2370, 2371, 2372, 2373, 2374, 2375, 2376,
    2377, 2378, 2379, 2380, 2381, 2382, 2383, 2387, 2388, 2389, 2390, 2391, 2402, 2403,
  ]);

  const BLACK_FLAG_CODE_POINT = 127988;
  const CANCEL_TAG_CODE_POINT = 917631;
  const A_TAG_CODE_POINT = 917601;
  const Z_TAG_CODE_POINT = 917626;
  const VARIATION_SELECTOR_16_CODE_POINT = 65039;
  const ZERO_WIDTH_JOINER_CODE_POINT = 8205;
  const REGIONAL_CHARACTER_A_CODE_POINT = 127462;
  const REGIONAL_CHARACTER_Z_CODE_POINT = 127487;

  const surrogateModifiers = ['d83cdffb', 'd83cdffc', 'd83cdffd', 'd83cdffe', 'd83cdfff'];

  function trimFontOptions(font: string): string {
    const familyArray = font.split(',');
    let i;
    const len = familyArray.length;
    const enabledFamilies: string[] = [];
    for (i = 0; i < len; i += 1) {
      if (familyArray[i] !== 'sans-serif' && familyArray[i] !== 'monospace') {
        enabledFamilies.push(familyArray[i]);
      }
    }
    return enabledFamilies.join(',');
  }

  interface FontNode {
    node: HTMLSpanElement;
    w: number;
    parent: HTMLSpanElement;
  }

  function setUpNode(font: string, family: string): FontNode {
    const parentNode = createTag('span') as HTMLSpanElement;
    // Node is invisible to screen readers.
    parentNode.setAttribute('aria-hidden', 'true');
    parentNode.style.fontFamily = family;
    const node = createTag('span') as HTMLSpanElement;
    // Characters that vary significantly among different fonts
    (node as any).innerText = 'giItT1WQy@!-/#';
    // Visible - so we can measure it - but not on the screen
    parentNode.style.position = 'absolute';
    parentNode.style.left = '-10000px';
    parentNode.style.top = '-10000px';
    // Large font size makes even subtle changes obvious
    parentNode.style.fontSize = '300px';
    // Reset any font properties
    parentNode.style.fontVariant = 'normal';
    parentNode.style.fontStyle = 'normal';
    parentNode.style.fontWeight = 'normal';
    parentNode.style.letterSpacing = '0';
    parentNode.appendChild(node);
    document.body.appendChild(parentNode);

    // Remember width with no applied web font
    const width = node.offsetWidth;
    node.style.fontFamily = trimFontOptions(font) + ', ' + family;
    return { node: node, w: width, parent: parentNode };
  }

  function checkLoadedFonts(this: any) {
    let i;
    const len = this.fonts.length;
    let node;
    let w;
    let loadedCount = len;
    for (i = 0; i < len; i += 1) {
      if (this.fonts[i].loaded) {
        loadedCount -= 1;
      } else if (this.fonts[i].fOrigin === 'n' || this.fonts[i].origin === 0) {
        this.fonts[i].loaded = true;
      } else {
        node = this.fonts[i].monoCase.node;
        w = this.fonts[i].monoCase.w;
        if (node.offsetWidth !== w) {
          loadedCount -= 1;
          this.fonts[i].loaded = true;
        } else {
          node = this.fonts[i].sansCase.node;
          w = this.fonts[i].sansCase.w;
          if (node.offsetWidth !== w) {
            loadedCount -= 1;
            this.fonts[i].loaded = true;
          }
        }
        if (this.fonts[i].loaded) {
          this.fonts[i].sansCase.parent.parentNode.removeChild(this.fonts[i].sansCase.parent);
          this.fonts[i].monoCase.parent.parentNode.removeChild(this.fonts[i].monoCase.parent);
        }
      }
    }

    if (loadedCount !== 0 && Date.now() - this.initTime < maxWaitingTime) {
      setTimeout(this.checkLoadedFontsBinded, 20);
    } else {
      setTimeout(this.setIsLoadedBinded, 10);
    }
  }

  function createHelper(fontData: any, def?: any): any {
    const engine = document.body && def ? 'svg' : 'canvas';
    let helper: any;
    const fontProps = getFontProperties(fontData);
    if (engine === 'svg') {
      const tHelper = createNS('text') as SVGTextElement;
      tHelper.style.fontSize = '100px';
      // tHelper.style.fontFamily = fontData.fFamily;
      tHelper.setAttribute('font-family', fontData.fFamily);
      tHelper.setAttribute('font-style', fontProps.style);
      tHelper.setAttribute('font-weight', fontProps.weight);
      tHelper.textContent = '1';
      if (fontData.fClass) {
        tHelper.style.fontFamily = 'inherit';
        tHelper.setAttribute('class', fontData.fClass);
      } else {
        tHelper.style.fontFamily = fontData.fFamily;
      }
      def.appendChild(tHelper);
      helper = tHelper;
    } else {
      const tCanvasHelper = new OffscreenCanvas(500, 500).getContext('2d');
      (tCanvasHelper as any).font = fontProps.style + ' ' + fontProps.weight + ' 100px ' + fontData.fFamily;
      helper = tCanvasHelper;
    }
    function measure(text: string) {
      if (engine === 'svg') {
        helper.textContent = text;
        return helper.getComputedTextLength();
      }
      return helper.measureText(text).width;
    }
    return {
      measureText: measure,
    };
  }

  function addFonts(this: any, fontData: any, defs: any) {
    if (!fontData) {
      this.isLoaded = true;
      return;
    }
    if (this.chars) {
      this.isLoaded = true;
      this.fonts = fontData.list;
      return;
    }
    if (!document.body) {
      this.isLoaded = true;
      fontData.list.forEach((data: any) => {
        data.helper = createHelper(data);
        data.cache = {};
      });
      this.fonts = fontData.list;
      return;
    }

    const fontArr = fontData.list;
    let i;
    const len = fontArr.length;
    let _pendingFonts = len;
    for (i = 0; i < len; i += 1) {
      let shouldLoadFont = true;
      let loadedSelector;
      let j;
      fontArr[i].loaded = false;
      fontArr[i].monoCase = setUpNode(fontArr[i].fFamily, 'monospace');
      fontArr[i].sansCase = setUpNode(fontArr[i].fFamily, 'sans-serif');
      if (!fontArr[i].fPath) {
        fontArr[i].loaded = true;
        _pendingFonts -= 1;
      } else if (fontArr[i].fOrigin === 'p' || fontArr[i].origin === 3) {
        loadedSelector = document.querySelectorAll(
          'style[f-forigin="p"][f-family="' +
            fontArr[i].fFamily +
            '"], style[f-origin="3"][f-family="' +
            fontArr[i].fFamily +
            '"]',
        );

        if (loadedSelector.length > 0) {
          shouldLoadFont = false;
        }

        if (shouldLoadFont) {
          const s = createTag('style') as HTMLStyleElement;
          s.setAttribute('f-forigin', fontArr[i].fOrigin);
          s.setAttribute('f-origin', fontArr[i].origin);
          s.setAttribute('f-family', fontArr[i].fFamily);
          s.type = 'text/css';
          (s as any).innerText =
            '@font-face {font-family: ' +
            fontArr[i].fFamily +
            "; font-style: normal; src: url('" +
            fontArr[i].fPath +
            "');}";
          defs.appendChild(s);
        }
      } else if (fontArr[i].fOrigin === 'g' || fontArr[i].origin === 1) {
        loadedSelector = document.querySelectorAll('link[f-forigin="g"], link[f-origin="1"]');

        for (j = 0; j < loadedSelector.length; j += 1) {
          if ((loadedSelector[j] as HTMLLinkElement).href.indexOf(fontArr[i].fPath) !== -1) {
            // Font is already loaded
            shouldLoadFont = false;
          }
        }

        if (shouldLoadFont) {
          const l = createTag('link') as HTMLLinkElement;
          l.setAttribute('f-forigin', fontArr[i].fOrigin);
          l.setAttribute('f-origin', fontArr[i].origin);
          l.type = 'text/css';
          l.rel = 'stylesheet';
          l.href = fontArr[i].fPath;
          document.body.appendChild(l);
        }
      } else if (fontArr[i].fOrigin === 't' || fontArr[i].origin === 2) {
        loadedSelector = document.querySelectorAll('script[f-forigin="t"], script[f-origin="2"]');

        for (j = 0; j < loadedSelector.length; j += 1) {
          if (fontArr[i].fPath === (loadedSelector[j] as HTMLScriptElement).src) {
            // Font is already loaded
            shouldLoadFont = false;
          }
        }

        if (shouldLoadFont) {
          const sc = createTag('link') as HTMLLinkElement;
          sc.setAttribute('f-forigin', fontArr[i].fOrigin);
          sc.setAttribute('f-origin', fontArr[i].origin);
          sc.setAttribute('rel', 'stylesheet');
          sc.setAttribute('href', fontArr[i].fPath);
          defs.appendChild(sc);
        }
      }
      fontArr[i].helper = createHelper(fontArr[i], defs);
      fontArr[i].cache = {};
      this.fonts.push(fontArr[i]);
    }
    if (_pendingFonts === 0) {
      this.isLoaded = true;
    } else {
      // On some cases even if the font is loaded, it won't load correctly when measuring text on canvas.
      // Adding this timeout seems to fix it
      setTimeout(this.checkLoadedFonts.bind(this), 100);
    }
  }

  function addChars(this: any, chars: any[]) {
    if (!chars) {
      return;
    }
    if (!this.chars) {
      this.chars = [];
    }
    let i;
    const len = chars.length;
    let j;
    let jLen = this.chars.length;
    let found;
    for (i = 0; i < len; i += 1) {
      j = 0;
      found = false;
      while (j < jLen) {
        if (
          this.chars[j].style === chars[i].style &&
          this.chars[j].fFamily === chars[i].fFamily &&
          this.chars[j].ch === chars[i].ch
        ) {
          found = true;
        }
        j += 1;
      }
      if (!found) {
        this.chars.push(chars[i]);
        jLen += 1;
      }
    }
  }

  function getCharData(this: any, char: string, style: string, font: string) {
    let i = 0;
    const len = this.chars.length;
    while (i < len) {
      if (this.chars[i].ch === char && this.chars[i].style === style && this.chars[i].fFamily === font) {
        return this.chars[i];
      }
      i += 1;
    }
    if (
      ((typeof char === 'string' && char.charCodeAt(0) !== 13) || !char) &&
      console &&
      console.warn && // eslint-disable-line no-console
      !this._warned
    ) {
      this._warned = true;
      console.warn('Missing character from exported characters list: ', char, style, font); // eslint-disable-line no-console
    }
    return emptyChar;
  }

  function measureText(this: any, char: string, fontName: string, size: number): number {
    const fontData = this.getFontByName(fontName);
    // Using the char instead of char.charCodeAt(0)
    // to avoid collisions between equal chars
    const index = char;
    if (!fontData.cache[index]) {
      const tHelper = fontData.helper;
      if (char === ' ') {
        const doubleSize = tHelper.measureText('|' + char + '|');
        const singleSize = tHelper.measureText('||');
        fontData.cache[index] = (doubleSize - singleSize) / 100;
      } else {
        fontData.cache[index] = tHelper.measureText(char) / 100;
      }
    }
    return fontData.cache[index] * size;
  }

  function getFontByName(this: any, name: string) {
    let i = 0;
    const len = this.fonts.length;
    while (i < len) {
      if (this.fonts[i].fName === name) {
        return this.fonts[i];
      }
      i += 1;
    }
    return this.fonts[0];
  }

  function getCodePoint(string: string): number {
    let codePoint = 0;
    const first = string.charCodeAt(0);
    if (first >= 0xd800 && first <= 0xdbff) {
      const second = string.charCodeAt(1);
      if (second >= 0xdc00 && second <= 0xdfff) {
        codePoint = (first - 0xd800) * 0x400 + second - 0xdc00 + 0x10000;
      }
    }
    return codePoint;
  }

  // Skin tone modifiers
  function isModifier(firstCharCode: number, secondCharCode: number): boolean {
    const sum = firstCharCode.toString(16) + secondCharCode.toString(16);
    return surrogateModifiers.indexOf(sum) !== -1;
  }

  function isZeroWidthJoiner(charCode: number): boolean {
    return charCode === ZERO_WIDTH_JOINER_CODE_POINT;
  }

  // This codepoint may change the appearance of the preceding character.
  // If that is a symbol, dingbat or emoji, U+FE0F forces it to be rendered
  // as a colorful image as compared to a monochrome text variant.
  function isVariationSelector(charCode: number): boolean {
    return charCode === VARIATION_SELECTOR_16_CODE_POINT;
  }

  // The regional indicator symbols are a set of 26 alphabetic Unicode
  /// characters (A–Z) intended to be used to encode ISO 3166-1 alpha-2
  // two-letter country codes in a way that allows optional special treatment.
  function isRegionalCode(string: string): boolean {
    const codePoint = getCodePoint(string);
    if (codePoint >= REGIONAL_CHARACTER_A_CODE_POINT && codePoint <= REGIONAL_CHARACTER_Z_CODE_POINT) {
      return true;
    }
    return false;
  }

  // Some Emoji implementations represent combinations of
  // two "regional indicator" letters as a single flag symbol.
  function isFlagEmoji(string: string): boolean {
    return isRegionalCode(string.substr(0, 2)) && isRegionalCode(string.substr(2, 2));
  }

  function isCombinedCharacter(char: number): boolean {
    return combinedCharacters.indexOf(char) !== -1;
  }

  // Regional flags start with a BLACK_FLAG_CODE_POINT
  // folowed by 5 chars in the TAG range
  // and end with a CANCEL_TAG_CODE_POINT
  function isRegionalFlag(text: string, index: number): boolean {
    let codePoint = getCodePoint(text.substr(index, 2));
    if (codePoint !== BLACK_FLAG_CODE_POINT) {
      return false;
    }
    let count = 0;
    index += 2;
    while (count < 5) {
      codePoint = getCodePoint(text.substr(index, 2));
      if (codePoint < A_TAG_CODE_POINT || codePoint > Z_TAG_CODE_POINT) {
        return false;
      }
      count += 1;
      index += 2;
    }
    return getCodePoint(text.substr(index, 2)) === CANCEL_TAG_CODE_POINT;
  }

  function setIsLoaded(this: any) {
    this.isLoaded = true;
  }

  const Font = function (this: any) {
    this.fonts = [];
    this.chars = null;
    this.typekitLoaded = 0;
    this.isLoaded = false;
    this._warned = false;
    this.initTime = Date.now();
    this.setIsLoadedBinded = this.setIsLoaded.bind(this);
    this.checkLoadedFontsBinded = this.checkLoadedFonts.bind(this);
  };
  (Font as any).isModifier = isModifier;
  (Font as any).isZeroWidthJoiner = isZeroWidthJoiner;
  (Font as any).isFlagEmoji = isFlagEmoji;
  (Font as any).isRegionalCode = isRegionalCode;
  (Font as any).isCombinedCharacter = isCombinedCharacter;
  (Font as any).isRegionalFlag = isRegionalFlag;
  (Font as any).isVariationSelector = isVariationSelector;
  (Font as any).BLACK_FLAG_CODE_POINT = BLACK_FLAG_CODE_POINT;

  const fontPrototype = {
    addChars: addChars,
    addFonts: addFonts,
    getCharData: getCharData,
    getFontByName: getFontByName,
    measureText: measureText,
    checkLoadedFonts: checkLoadedFonts,
    setIsLoaded: setIsLoaded,
  };

  Font.prototype = fontPrototype;

  return Font;
})();

export default FontManager;
