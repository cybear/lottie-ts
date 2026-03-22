import { isSafari } from './common';
import createNS from './helpers/svg_elements';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import dataManager from './DataManager';
import createTag from './helpers/html_elements';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ImageEntry = { img: any; assetData: any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssetData = Record<string, any>;

const proxyImage = (function () {
  const canvas = createTag('canvas') as HTMLCanvasElement;
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 1, 1);
  return canvas;
})();

function getAssetsPath(assetData: AssetData, assetsPath: string, originalPath: string): string {
  let path = '';
  if (assetData.e) {
    path = assetData.p;
  } else if (assetsPath) {
    let imagePath = assetData.p;
    if (imagePath.indexOf('images/') !== -1) {
      imagePath = imagePath.split('/')[1];
    }
    path = assetsPath + imagePath;
  } else {
    path = originalPath;
    path += assetData.u ? assetData.u : '';
    path += assetData.p;
  }
  return path;
}

class ImagePreloader {
  _imageLoaded: () => void;
  _footageLoaded: () => void;
  assetsPath = '';
  path = '';
  totalImages = 0;
  totalFootages = 0;
  loadedAssets = 0;
  loadedFootagesCount = 0;
  imagesLoadedCb: ((err: null) => void) | null = null;
  images: ImageEntry[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _elementHelper!: any;
  _createImageData!: (assetData: AssetData) => ImageEntry;

  constructor() {
    this._imageLoaded = this.imageLoaded.bind(this);
    this._footageLoaded = this.footageLoaded.bind(this);
    this.testImageLoaded = this.testImageLoaded.bind(this);
    this.createFootageData = this.createFootageData.bind(this);
  }

  imageLoaded() {
    this.loadedAssets += 1;
    if (this.loadedAssets === this.totalImages && this.loadedFootagesCount === this.totalFootages) {
      if (this.imagesLoadedCb) {
        this.imagesLoadedCb(null);
      }
    }
  }

  footageLoaded() {
    this.loadedFootagesCount += 1;
    if (this.loadedAssets === this.totalImages && this.loadedFootagesCount === this.totalFootages) {
      if (this.imagesLoadedCb) {
        this.imagesLoadedCb(null);
      }
    }
  }

  testImageLoaded(img: SVGElement) {
    let _count = 0;
    const intervalId = setInterval(() => {
      const box = (img as SVGGraphicsElement).getBBox();
      if (box.width || _count > 500) {
        this._imageLoaded();
        clearInterval(intervalId);
      }
      _count += 1;
    }, 50);
  }

  createImageData(assetData: AssetData): ImageEntry {
    const path = getAssetsPath(assetData, this.assetsPath, this.path);
    const img = createNS('image');
    if (isSafari) {
      this.testImageLoaded(img);
    } else {
      img.addEventListener('load', this._imageLoaded, false);
    }
    const ob: ImageEntry = { img, assetData };
    img.addEventListener(
      'error',
      () => {
        ob.img = proxyImage;
        this._imageLoaded();
      },
      false,
    );
    img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', path);
    if (this._elementHelper.append) {
      this._elementHelper.append(img);
    } else {
      this._elementHelper.appendChild(img);
    }
    return ob;
  }

  createImgData(assetData: AssetData): ImageEntry {
    const path = getAssetsPath(assetData, this.assetsPath, this.path);
    const img = createTag('img') as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.addEventListener('load', this._imageLoaded, false);
    const ob: ImageEntry = { img, assetData };
    img.addEventListener(
      'error',
      () => {
        ob.img = proxyImage;
        this._imageLoaded();
      },
      false,
    );
    img.src = path;
    return ob;
  }

  createFootageData(data: AssetData): ImageEntry {
    const ob: ImageEntry = { img: null, assetData: data };
    const path = getAssetsPath(data, this.assetsPath, this.path);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dataManager as any).loadData(
      path,
      (footageData: unknown) => {
        ob.img = footageData;
        this._footageLoaded();
      },
      () => {
        ob.img = {};
        this._footageLoaded();
      },
    );
    return ob;
  }

  loadAssets(assets: AssetData[], cb: (err: null) => void) {
    this.imagesLoadedCb = cb;
    let i: number;
    const len = assets.length;
    for (i = 0; i < len; i += 1) {
      if (!assets[i].layers) {
        if (!assets[i].t || assets[i].t === 'seq') {
          this.totalImages += 1;
          this.images.push(this._createImageData(assets[i]));
        } else if (assets[i].t === 3) {
          this.totalFootages += 1;
          this.images.push(this.createFootageData(assets[i]));
        }
      }
    }
  }

  setPath(path: string) {
    this.path = path || '';
  }

  setAssetsPath(path: string) {
    this.assetsPath = path || '';
  }

  getAsset(assetData: AssetData): unknown {
    let i = 0;
    const len = this.images.length;
    while (i < len) {
      if (this.images[i].assetData === assetData) {
        return this.images[i].img;
      }
      i += 1;
    }
    return null;
  }

  destroy() {
    this.imagesLoadedCb = null;
    this.images.length = 0;
  }

  loadedImages(): boolean {
    return this.totalImages === this.loadedAssets;
  }

  loadedFootages(): boolean {
    return this.totalFootages === this.loadedFootagesCount;
  }

  setCacheType(type: string, elementHelper: unknown) {
    if (type === 'svg') {
      this._elementHelper = elementHelper;
      this._createImageData = this.createImageData.bind(this);
    } else {
      this._createImageData = this.createImgData.bind(this);
    }
  }
}

export default ImagePreloader;
