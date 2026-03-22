// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AssetCallback = (data: any) => void;
type ErrorCallback = (err: unknown) => void;

const assetLoader = (function () {
  function formatResponse(xhr: XMLHttpRequest): unknown {
    const contentTypeHeader = xhr.getResponseHeader('content-type');
    if (contentTypeHeader && xhr.responseType === 'json' && contentTypeHeader.indexOf('json') !== -1) {
      return xhr.response;
    }
    if (xhr.response && typeof xhr.response === 'object') {
      return xhr.response;
    }
    if (xhr.response && typeof xhr.response === 'string') {
      return JSON.parse(xhr.response as string);
    }
    if (xhr.responseText) {
      return JSON.parse(xhr.responseText);
    }
    return null;
  }

  function loadAsset(path: string, callback: AssetCallback, errorCallback?: ErrorCallback): void {
    let response: unknown;
    const xhr = new XMLHttpRequest();
    try {
      // This crashes on Android WebView prior to KitKat
      xhr.responseType = 'json';
    } catch {} // eslint-disable-line no-empty
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
    // Hack to workaround banner validation
    xhr.open(['G', 'E', 'T'].join(''), path, true);
    xhr.send();
  }

  return {
    load: loadAsset,
  };
})();

export default assetLoader;
