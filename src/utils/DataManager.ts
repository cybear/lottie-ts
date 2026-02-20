import { getWebWorker } from '../main';

const dataManager = (function () {
  let _counterId = 1;
  const processes: Record<string, any> = {};
  let workerFn: ((e: any) => void) | undefined;
  let workerInstance: Worker | typeof workerProxy | undefined;
  const workerProxy = {
    onmessage: function (_e: any) {
      // placeholder
    },
    postMessage: function (path: any) {
      workerFn!({
        data: path,
      });
    },
  };
  const _workerSelf = {
    postMessage: function (data: any) {
      workerProxy.onmessage({
        data: data,
      });
    },
  };

  function createWorker(fn: (e: any) => void): Worker | typeof workerProxy {
    if ((window as any).Worker && (window as any).Blob && getWebWorker()) {
      const blob = new Blob(['var _workerSelf = self; self.onmessage = ', fn.toString()], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      return new Worker(url);
    }
    workerFn = fn;
    return workerProxy;
  }

  function setupWorker() {
    if (!workerInstance) {
      workerInstance = createWorker(function workerStart(e: any) {
        function dataFunctionManager() {
          function completeLayers(layers: any, comps: any) {
            let layerData;
            let i;
            const len = layers.length;
            let j;
            let jLen;
            let k;
            let kLen;
            for (i = 0; i < len; i += 1) {
              layerData = layers[i];
              if ('ks' in layerData && !layerData.completed) {
                layerData.completed = true;
                if (layerData.hasMask) {
                  const maskProps = layerData.masksProperties;
                  jLen = maskProps.length;
                  for (j = 0; j < jLen; j += 1) {
                    if (maskProps[j].pt.k.i) {
                      convertPathsToAbsoluteValues(maskProps[j].pt.k);
                    } else {
                      kLen = maskProps[j].pt.k.length;
                      for (k = 0; k < kLen; k += 1) {
                        if (maskProps[j].pt.k[k].s) {
                          convertPathsToAbsoluteValues(maskProps[j].pt.k[k].s[0]);
                        }
                        if (maskProps[j].pt.k[k].e) {
                          convertPathsToAbsoluteValues(maskProps[j].pt.k[k].e[0]);
                        }
                      }
                    }
                  }
                }
                if (layerData.ty === 0) {
                  layerData.layers = findCompLayers(layerData.refId, comps);
                  completeLayers(layerData.layers, comps);
                } else if (layerData.ty === 4) {
                  completeShapes(layerData.shapes);
                } else if (layerData.ty === 5) {
                  completeText(layerData);
                }
              }
            }
          }

          function completeChars(chars: any, assets: any) {
            if (chars) {
              let i = 0;
              const len = chars.length;
              for (i = 0; i < len; i += 1) {
                if (chars[i].t === 1) {
                  chars[i].data.layers = findCompLayers(chars[i].data.refId, assets);
                  completeLayers(chars[i].data.layers, assets);
                }
              }
            }
          }

          function findComp(id: any, comps: any) {
            let i = 0;
            const len = comps.length;
            while (i < len) {
              if (comps[i].id === id) {
                return comps[i];
              }
              i += 1;
            }
            return null;
          }

          function findCompLayers(id: any, comps: any) {
            const comp = findComp(id, comps);
            if (comp) {
              if (!comp.layers.__used) {
                comp.layers.__used = true;
                return comp.layers;
              }
              return JSON.parse(JSON.stringify(comp.layers));
            }
            return null;
          }

          function completeShapes(arr: any) {
            let i;
            const len = arr.length;
            let j;
            let jLen;
            for (i = len - 1; i >= 0; i -= 1) {
              if (arr[i].ty === 'sh') {
                if (arr[i].ks.k.i) {
                  convertPathsToAbsoluteValues(arr[i].ks.k);
                } else {
                  jLen = arr[i].ks.k.length;
                  for (j = 0; j < jLen; j += 1) {
                    if (arr[i].ks.k[j].s) {
                      convertPathsToAbsoluteValues(arr[i].ks.k[j].s[0]);
                    }
                    if (arr[i].ks.k[j].e) {
                      convertPathsToAbsoluteValues(arr[i].ks.k[j].e[0]);
                    }
                  }
                }
              } else if (arr[i].ty === 'gr') {
                completeShapes(arr[i].it);
              }
            }
          }

          function convertPathsToAbsoluteValues(path: any) {
            let i;
            const len = path.i.length;
            for (i = 0; i < len; i += 1) {
              path.i[i][0] += path.v[i][0];
              path.i[i][1] += path.v[i][1];
              path.o[i][0] += path.v[i][0];
              path.o[i][1] += path.v[i][1];
            }
          }

          function checkVersion(minimum: number[], animVersionString: string | null): boolean | null {
            const animVersion = animVersionString ? animVersionString.split('.') : ['100', '100', '100'];
            if (minimum[0] > Number(animVersion[0])) {
              return true;
            }
            if (Number(animVersion[0]) > minimum[0]) {
              return false;
            }
            if (minimum[1] > Number(animVersion[1])) {
              return true;
            }
            if (Number(animVersion[1]) > minimum[1]) {
              return false;
            }
            if (minimum[2] > Number(animVersion[2])) {
              return true;
            }
            if (Number(animVersion[2]) > minimum[2]) {
              return false;
            }
            return null;
          }

          const checkText = (function () {
            const minimumVersion = [4, 4, 14];

            function updateTextLayer(textLayer: any) {
              const documentData = textLayer.t.d;
              textLayer.t.d = {
                k: [
                  {
                    s: documentData,
                    t: 0,
                  },
                ],
              };
            }

            function iterateLayers(layers: any) {
              let i;
              const len = layers.length;
              for (i = 0; i < len; i += 1) {
                if (layers[i].ty === 5) {
                  updateTextLayer(layers[i]);
                }
              }
            }

            return function (animationData: any) {
              if (checkVersion(minimumVersion, animationData.v)) {
                iterateLayers(animationData.layers);
                if (animationData.assets) {
                  let i;
                  const len = animationData.assets.length;
                  for (i = 0; i < len; i += 1) {
                    if (animationData.assets[i].layers) {
                      iterateLayers(animationData.assets[i].layers);
                    }
                  }
                }
              }
            };
          })();

          const checkChars = (function () {
            const minimumVersion = [4, 7, 99];
            return function (animationData: any) {
              if (animationData.chars && !checkVersion(minimumVersion, animationData.v)) {
                let i;
                const len = animationData.chars.length;
                for (i = 0; i < len; i += 1) {
                  const charData = animationData.chars[i];
                  if (charData.data && charData.data.shapes) {
                    completeShapes(charData.data.shapes);
                    charData.data.ip = 0;
                    charData.data.op = 99999;
                    charData.data.st = 0;
                    charData.data.sr = 1;
                    charData.data.ks = {
                      p: { k: [0, 0], a: 0 },
                      s: { k: [100, 100], a: 0 },
                      a: { k: [0, 0], a: 0 },
                      r: { k: 0, a: 0 },
                      o: { k: 100, a: 0 },
                    };
                    if (!animationData.chars[i].t) {
                      charData.data.shapes.push({
                        ty: 'no',
                      });
                      charData.data.shapes[0].it.push({
                        p: { k: [0, 0], a: 0 },
                        s: { k: [100, 100], a: 0 },
                        a: { k: [0, 0], a: 0 },
                        r: { k: 0, a: 0 },
                        o: { k: 100, a: 0 },
                        sk: { k: 0, a: 0 },
                        sa: { k: 0, a: 0 },
                        ty: 'tr',
                      });
                    }
                  }
                }
              }
            };
          })();

          const checkPathProperties = (function () {
            const minimumVersion = [5, 7, 15];

            function updateTextLayer(textLayer: any) {
              const pathData = textLayer.t.p;
              if (typeof pathData.a === 'number') {
                pathData.a = {
                  a: 0,
                  k: pathData.a,
                };
              }
              if (typeof pathData.p === 'number') {
                pathData.p = {
                  a: 0,
                  k: pathData.p,
                };
              }
              if (typeof pathData.r === 'number') {
                pathData.r = {
                  a: 0,
                  k: pathData.r,
                };
              }
            }

            function iterateLayers(layers: any) {
              let i;
              const len = layers.length;
              for (i = 0; i < len; i += 1) {
                if (layers[i].ty === 5) {
                  updateTextLayer(layers[i]);
                }
              }
            }

            return function (animationData: any) {
              if (checkVersion(minimumVersion, animationData.v)) {
                iterateLayers(animationData.layers);
                if (animationData.assets) {
                  let i;
                  const len = animationData.assets.length;
                  for (i = 0; i < len; i += 1) {
                    if (animationData.assets[i].layers) {
                      iterateLayers(animationData.assets[i].layers);
                    }
                  }
                }
              }
            };
          })();

          const checkColors = (function () {
            const minimumVersion = [4, 1, 9];

            function iterateShapes(shapes: any) {
              let i;
              const len = shapes.length;
              let j;
              let jLen;
              for (i = 0; i < len; i += 1) {
                if (shapes[i].ty === 'gr') {
                  iterateShapes(shapes[i].it);
                } else if (shapes[i].ty === 'fl' || shapes[i].ty === 'st') {
                  if (shapes[i].c.k && shapes[i].c.k[0].i) {
                    jLen = shapes[i].c.k.length;
                    for (j = 0; j < jLen; j += 1) {
                      if (shapes[i].c.k[j].s) {
                        shapes[i].c.k[j].s[0] /= 255;
                        shapes[i].c.k[j].s[1] /= 255;
                        shapes[i].c.k[j].s[2] /= 255;
                        shapes[i].c.k[j].s[3] /= 255;
                      }
                      if (shapes[i].c.k[j].e) {
                        shapes[i].c.k[j].e[0] /= 255;
                        shapes[i].c.k[j].e[1] /= 255;
                        shapes[i].c.k[j].e[2] /= 255;
                        shapes[i].c.k[j].e[3] /= 255;
                      }
                    }
                  } else {
                    shapes[i].c.k[0] /= 255;
                    shapes[i].c.k[1] /= 255;
                    shapes[i].c.k[2] /= 255;
                    shapes[i].c.k[3] /= 255;
                  }
                }
              }
            }

            function iterateLayers(layers: any) {
              let i;
              const len = layers.length;
              for (i = 0; i < len; i += 1) {
                if (layers[i].ty === 4) {
                  iterateShapes(layers[i].shapes);
                }
              }
            }

            return function (animationData: any) {
              if (checkVersion(minimumVersion, animationData.v)) {
                iterateLayers(animationData.layers);
                if (animationData.assets) {
                  let i;
                  const len = animationData.assets.length;
                  for (i = 0; i < len; i += 1) {
                    if (animationData.assets[i].layers) {
                      iterateLayers(animationData.assets[i].layers);
                    }
                  }
                }
              }
            };
          })();

          const checkShapes = (function () {
            const minimumVersion = [4, 4, 18];

            function completeClosingShapes(arr: any) {
              let i;
              const len = arr.length;
              let j;
              let jLen;
              for (i = len - 1; i >= 0; i -= 1) {
                if (arr[i].ty === 'sh') {
                  if (arr[i].ks.k.i) {
                    arr[i].ks.k.c = arr[i].closed;
                  } else {
                    jLen = arr[i].ks.k.length;
                    for (j = 0; j < jLen; j += 1) {
                      if (arr[i].ks.k[j].s) {
                        arr[i].ks.k[j].s[0].c = arr[i].closed;
                      }
                      if (arr[i].ks.k[j].e) {
                        arr[i].ks.k[j].e[0].c = arr[i].closed;
                      }
                    }
                  }
                } else if (arr[i].ty === 'gr') {
                  completeClosingShapes(arr[i].it);
                }
              }
            }

            function iterateLayers(layers: any) {
              let layerData;
              let i;
              const len = layers.length;
              let j;
              let jLen;
              let k;
              let kLen;
              for (i = 0; i < len; i += 1) {
                layerData = layers[i];
                if (layerData.hasMask) {
                  const maskProps = layerData.masksProperties;
                  jLen = maskProps.length;
                  for (j = 0; j < jLen; j += 1) {
                    if (maskProps[j].pt.k.i) {
                      maskProps[j].pt.k.c = maskProps[j].cl;
                    } else {
                      kLen = maskProps[j].pt.k.length;
                      for (k = 0; k < kLen; k += 1) {
                        if (maskProps[j].pt.k[k].s) {
                          maskProps[j].pt.k[k].s[0].c = maskProps[j].cl;
                        }
                        if (maskProps[j].pt.k[k].e) {
                          maskProps[j].pt.k[k].e[0].c = maskProps[j].cl;
                        }
                      }
                    }
                  }
                }
                if (layerData.ty === 4) {
                  completeClosingShapes(layerData.shapes);
                }
              }
            }

            return function (animationData: any) {
              if (checkVersion(minimumVersion, animationData.v)) {
                iterateLayers(animationData.layers);
                if (animationData.assets) {
                  let i;
                  const len = animationData.assets.length;
                  for (i = 0; i < len; i += 1) {
                    if (animationData.assets[i].layers) {
                      iterateLayers(animationData.assets[i].layers);
                    }
                  }
                }
              }
            };
          })();

          function completeData(animationData: any) {
            if (animationData.__complete) {
              return;
            }
            checkColors(animationData);
            checkText(animationData);
            checkChars(animationData);
            checkPathProperties(animationData);
            checkShapes(animationData);
            completeLayers(animationData.layers, animationData.assets);
            completeChars(animationData.chars, animationData.assets);
            animationData.__complete = true;
          }

          function completeText(data: any) {
            if (data.t.a.length === 0 && !('m' in data.t.p)) {
              // data.singleShape = true;
            }
          }

          const moduleOb: any = {};
          moduleOb.completeData = completeData;
          moduleOb.checkColors = checkColors;
          moduleOb.checkChars = checkChars;
          moduleOb.checkPathProperties = checkPathProperties;
          moduleOb.checkShapes = checkShapes;
          moduleOb.completeLayers = completeLayers;

          return moduleOb;
        }
        const self: any = _workerSelf;
        if (!self.dataManager) {
          self.dataManager = dataFunctionManager();
        }

        if (!self.assetLoader) {
          self.assetLoader = (function () {
            function formatResponse(xhr: XMLHttpRequest) {
              // using typeof doubles the time of execution of this method,
              // so if available, it's better to use the header to validate the type
              const contentTypeHeader = xhr.getResponseHeader('content-type');
              if (contentTypeHeader && xhr.responseType === 'json' && contentTypeHeader.indexOf('json') !== -1) {
                return xhr.response;
              }
              if (xhr.response && typeof xhr.response === 'object') {
                return xhr.response;
              }
              if (xhr.response && typeof xhr.response === 'string') {
                return JSON.parse(xhr.response);
              }
              if (xhr.responseText) {
                return JSON.parse(xhr.responseText);
              }
              return null;
            }

            function loadAsset(
              path: string,
              fullPath: string,
              callback: (data: any) => void,
              errorCallback: ((err: any) => void) | undefined,
            ) {
              let response;
              const xhr = new XMLHttpRequest();
              // set responseType after calling open or IE will break.
              try {
                // This crashes on Android WebView prior to KitKat
                xhr.responseType = 'json';
              } catch (err) {} // eslint-disable-line no-empty
              xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                  if (xhr.status === 200) {
                    response = formatResponse(xhr);
                    callback(response);
                  } else {
                    try {
                      response = formatResponse(xhr);
                      callback(response);
                    } catch (err) {
                      if (errorCallback) {
                        errorCallback(err);
                      }
                    }
                  }
                }
              };
              try {
                // Hack to workaround banner validation
                xhr.open(['G', 'E', 'T'].join(''), path, true);
              } catch (error) {
                // Hack to workaround banner validation
                xhr.open(['G', 'E', 'T'].join(''), fullPath + '/' + path, true);
              }
              xhr.send();
            }
            return {
              load: loadAsset,
            };
          })();
        }

        if (e.data.type === 'loadAnimation') {
          self.assetLoader.load(
            e.data.path,
            e.data.fullPath,
            function (data: any) {
              self.dataManager.completeData(data);
              self.postMessage({
                id: e.data.id,
                payload: data,
                status: 'success',
              });
            },
            function () {
              self.postMessage({
                id: e.data.id,
                status: 'error',
              });
            },
          );
        } else if (e.data.type === 'complete') {
          const animation = e.data.animation;
          self.dataManager.completeData(animation);
          self.postMessage({
            id: e.data.id,
            payload: animation,
            status: 'success',
          });
        } else if (e.data.type === 'loadData') {
          self.assetLoader.load(
            e.data.path,
            e.data.fullPath,
            function (data: any) {
              self.postMessage({
                id: e.data.id,
                payload: data,
                status: 'success',
              });
            },
            function () {
              self.postMessage({
                id: e.data.id,
                status: 'error',
              });
            },
          );
        }
      });

      (workerInstance as any).onmessage = function (event: any) {
        const data = event.data;
        const id = data.id;
        const process = processes[id];
        processes[id] = null;
        if (data.status === 'success') {
          process.onComplete(data.payload);
        } else if (process.onError) {
          process.onError();
        }
      };
    }
  }

  function createProcess(onComplete: (data: any) => void, onError: (() => void) | undefined): string {
    _counterId += 1;
    const id = 'processId_' + _counterId;
    processes[id] = {
      onComplete: onComplete,
      onError: onError,
    };
    return id;
  }

  function loadAnimation(path: string, onComplete: (data: any) => void, onError: (() => void) | undefined) {
    setupWorker();
    const processId = createProcess(onComplete, onError);
    (workerInstance as any).postMessage({
      type: 'loadAnimation',
      path: path,
      fullPath: window.location.origin + window.location.pathname,
      id: processId,
    });
  }

  function loadData(path: string, onComplete: (data: any) => void, onError: (() => void) | undefined) {
    setupWorker();
    const processId = createProcess(onComplete, onError);
    (workerInstance as any).postMessage({
      type: 'loadData',
      path: path,
      fullPath: window.location.origin + window.location.pathname,
      id: processId,
    });
  }

  function completeAnimation(anim: any, onComplete: (data: any) => void, onError: (() => void) | undefined) {
    setupWorker();
    const processId = createProcess(onComplete, onError);
    (workerInstance as any).postMessage({
      type: 'complete',
      animation: anim,
      id: processId,
    });
  }

  return {
    loadAnimation: loadAnimation,
    loadData: loadData,
    completeAnimation: completeAnimation,
  };
})();

export default dataManager;
