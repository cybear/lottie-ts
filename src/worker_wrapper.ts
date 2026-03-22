function workerContent() {
  class ProxyElement {
    _state: string;
    _isDirty: boolean;
    _isProxy: boolean;
    _changedStyles: any[];
    _changedAttributes: any[];
    _changedElements: any[];
    _textContent: any;
    type: any;
    namespace: any;
    children: any[];
    attributes: Record<string, any>;
    style: any;
    parentNode: any;

    constructor(type: any, namespace: any) {
      this._state = 'init';
      this._isDirty = false;
      this._isProxy = true;
      this._changedStyles = [];
      this._changedAttributes = [];
      this._changedElements = [];
      this._textContent = null;
      this.type = type;
      this.namespace = namespace;
      this.children = [];
      localIdCounter += 1;
      this.attributes = {
        id: 'l_d_' + localIdCounter,
      };
      this.style = new (Style as any)(this);
    }

    appendChild(_child: any) {
      _child.parentNode = this;
      this.children.push(_child);
      this._isDirty = true;
      this._changedElements.push([_child, this.attributes.id]);
    }

    insertBefore(_newElement: any, _nextElement: any) {
      const children = this.children;
      for (let i = 0; i < children.length; i += 1) {
        if (children[i] === _nextElement) {
          children.splice(i, 0, _newElement);
          this._isDirty = true;
          this._changedElements.push([_newElement, this.attributes.id, _nextElement.attributes.id]);
          return;
        }
      }
      children.push(_nextElement);
    }

    setAttribute(_attribute: any, _value: any) {
      this.attributes[_attribute] = _value;
      if (!this._isDirty) {
        this._isDirty = true;
      }
      this._changedAttributes.push(_attribute);
    }

    serialize() {
      return {
        type: this.type,
        namespace: this.namespace,
        style: this.style.serialize(),
        attributes: this.attributes,
        children: this.children.map(function (child: any) {
          return child.serialize();
        }),
        textContent: this._textContent,
      };
    }

    // eslint-disable-next-line class-methods-use-this
    addEventListener(_: any, _callback: any) {
      setTimeout(_callback, 1);
    }

    setAttributeNS(_: any, _attribute: any, _value: any) {
      this.attributes[_attribute] = _value;
      if (!this._isDirty) {
        this._isDirty = true;
      }
      this._changedAttributes.push(_attribute);
    }
  }

  Object.defineProperty(ProxyElement.prototype, 'textContent', {
    set: function (this: any, _value: any) {
      this._isDirty = true;
      this._textContent = _value;
    },
  });

  let localIdCounter = 0;
  const animations: Record<string, any> = {};

  const styleProperties = ['width', 'height', 'display', 'transform', 'opacity', 'contentVisibility', 'mix-blend-mode'];

  function Style(this: any, element: any) {
    this.element = element;
  }
  Style.prototype = {
    serialize: function (this: any) {
      const obj: Record<string, any> = {};
      for (let i = 0; i < styleProperties.length; i += 1) {
        const propertyKey = styleProperties[i];
        const keyName = '_' + propertyKey;
        if (keyName in this) {
          obj[propertyKey] = this[keyName];
        }
      }
      return obj;
    },
  };
  styleProperties.forEach(function (propertyKey: string) {
    Object.defineProperty(Style.prototype, propertyKey, {
      set: function (this: any, value: any) {
        if (!this.element._isDirty) {
          this.element._isDirty = true;
        }
        this.element._changedStyles.push(propertyKey);
        const keyName = '_' + propertyKey;
        this[keyName] = value;
      },
      get: function (this: any) {
        const keyName = '_' + propertyKey;
        return this[keyName];
      },
    });
  });

  function CanvasContext(this: any, element: any) {
    this.element = element;
  }

  CanvasContext.prototype = {
    createRadialGradient: function (this: any, ...gradArgs: any[]) {
      const instruction: { t: string; a: any[]; stops: any[] } = {
        t: 'rGradient',
        a: gradArgs,
        stops: [],
      };
      function addColorStop(...stopArgs: any[]) {
        instruction.stops.push(stopArgs);
      }
      this.element.instructions.push(instruction);
      return {
        addColorStop: addColorStop,
      };
    },

    createLinearGradient: function (this: any, ...gradArgs: any[]) {
      const instruction: { t: string; a: any[]; stops: any[] } = {
        t: 'lGradient',
        a: gradArgs,
        stops: [],
      };
      function addColorStop(...stopArgs: any[]) {
        instruction.stops.push(stopArgs);
      }
      this.element.instructions.push(instruction);
      return {
        addColorStop: addColorStop,
      };
    },
  };

  Object.defineProperties(CanvasContext.prototype, {
    canvas: {
      enumerable: true,
      get: function (this: any) {
        return this.element;
      },
    },
  });

  const canvasContextMethods = [
    'fillRect',
    'setTransform',
    'drawImage',
    'beginPath',
    'moveTo',
    'save',
    'restore',
    'fillText',
    'setLineDash',
    'clearRect',
    'clip',
    'rect',
    'stroke',
    'fill',
    'closePath',
    'bezierCurveTo',
    'lineTo',
  ];

  canvasContextMethods.forEach(function (method: string) {
    (CanvasContext.prototype as any)[method] = function (this: any, ...args: any[]) {
      this.element.instructions.push({
        t: method,
        a: args,
      });
    };
  });

  const canvasContextProperties = [
    'globalAlpha',
    'strokeStyle',
    'fillStyle',
    'lineCap',
    'lineJoin',
    'lineWidth',
    'miterLimit',
    'lineDashOffset',
    'globalCompositeOperation',
  ];

  canvasContextProperties.forEach(function (property: string) {
    Object.defineProperty(CanvasContext.prototype, property, {
      set: function (this: any, _value: any) {
        this.element.instructions.push({
          t: property,
          a: _value,
        });
      },
    });
  });

  class CanvasElement extends ProxyElement {
    instructions: any[];
    width: number;
    height: number;
    context: any;

    constructor(type: any, namespace: any) {
      super(type, namespace);
      this.instructions = [];
      this.width = 0;
      this.height = 0;
      this.context = new (CanvasContext as any)(this);
    }

    getContext() {
      return this.context;
    }

    resetInstructions() {
      this.instructions.length = 0;
    }
  }

  function createElement(namespace: any, type: any) {
    if (type === 'canvas') {
      return new CanvasElement(type, namespace);
    }
    return new ProxyElement(type, namespace);
  }

  const document: any = {
    // eslint-disable-line no-redeclare
    createElementNS: function (namespace: any, type: any) {
      return createElement(namespace, type);
    },
    createElement: function (type: any) {
      return createElement('', type);
    },
    getElementsByTagName: function () {
      return [];
    },
    body: createElement('', 'body'),
    _isProxy: true,
  };
  /* eslint-enable */
  const lottieInternal = (function () {
    'use strict';

    /* <%= contents %> */

    function addElementToList(element: any, list: any[]) {
      list.push(element);
      element._isDirty = false;
      element._changedStyles.length = 0;
      element._changedAttributes.length = 0;
      element._changedElements.length = 0;
      element._textContent = null;
      element.children.forEach(function (child: any) {
        addElementToList(child, list);
      });
    }

    function addChangedAttributes(element: any) {
      const changedAttributes = element._changedAttributes;
      const attributes: any[] = [];
      let attribute;
      for (let i = 0; i < changedAttributes.length; i += 1) {
        attribute = changedAttributes[i];
        attributes.push([attribute, element.attributes[attribute]]);
      }
      return attributes;
    }

    function addChangedStyles(element: any) {
      const changedStyles = element._changedStyles;
      const styles: any[] = [];
      let style;
      for (let i = 0; i < changedStyles.length; i += 1) {
        style = changedStyles[i];
        styles.push([style, element.style[style]]);
      }
      return styles;
    }

    function addChangedElements(element: any, elements: any[]) {
      const changedElements = element._changedElements;
      const elementsList: any[] = [];
      let elementData;
      for (let i = 0; i < changedElements.length; i += 1) {
        elementData = changedElements[i];
        elementsList.push([elementData[0].serialize(), elementData[1], elementData[2]]);
        addElementToList(elementData[0], elements);
      }
      return elementsList;
    }

    function loadAnimation(payload: any) {
      const params = payload.params;
      let wrapper: any;
      const elements: any[] = [];
      let canvas: any;
      const LottieAPI = (self as any).lottie;
      if (params.renderer === 'svg') {
        wrapper = document.createElement('div');
        params.container = wrapper;
      } else {
        canvas = params.rendererSettings.canvas;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvas.width = params.animationData.w;
          canvas.height = params.animationData.h;
        }
        const ctx = canvas.getContext('2d');
        params.rendererSettings.context = ctx;
      }
      const animation: any = LottieAPI.loadAnimation(params);
      animation.addEventListener('error', function (error: any) {
        console.log(error); // eslint-disable-line
      });
      animation.onError = function (error: any) {
        console.log('ERRORO', error); // eslint-disable-line
      };
      animation.addEventListener('_play', function () {
        self.postMessage({
          type: 'playing',
          payload: {
            id: payload.id,
          },
        });
      });
      animation.addEventListener('_pause', function () {
        self.postMessage({
          type: 'paused',
          payload: {
            id: payload.id,
          },
        });
      });
      if (params.renderer === 'svg') {
        animation.addEventListener('DOMLoaded', function () {
          const serialized = wrapper.serialize();
          addElementToList(wrapper, elements);
          self.postMessage({
            type: 'SVGloaded',
            payload: {
              id: payload.id,
              tree: serialized.children[0],
            },
          });
        });
        animation.addEventListener('drawnFrame', function (event: any) {
          const changedElements: any[] = [];
          let element;
          for (let i = 0; i < elements.length; i += 1) {
            element = elements[i];
            if (element._isDirty) {
              const changedElement = {
                id: element.attributes.id,
                styles: addChangedStyles(element),
                attributes: addChangedAttributes(element),
                elements: addChangedElements(element, elements),
                textContent: element._textContent || undefined,
              };
              changedElements.push(changedElement);
              element._isDirty = false;
              element._changedAttributes.length = 0;
              element._changedStyles.length = 0;
              element._changedElements.length = 0;
              element._textContent = null;
            }
          }
          self.postMessage({
            type: 'SVGupdated',
            payload: {
              elements: changedElements,
              id: payload.id,
              currentTime: event.currentTime,
            },
          });
        });
      } else if (canvas._isProxy) {
        animation.addEventListener('drawnFrame', function (event: any) {
          self.postMessage({
            type: 'CanvasUpdated',
            payload: {
              instructions: canvas.instructions,
              id: payload.id,
              currentTime: event.currentTime,
            },
          });
          canvas.resetInstructions();
        });
      }
      animation.addEventListener('DOMLoaded', function () {
        self.postMessage({
          type: 'DOMLoaded',
          payload: {
            id: payload.id,
            totalFrames: animation.totalFrames,
            frameRate: animation.frameRate,
            firstFrame: animation.firstFrame,
            currentFrame: animation.currentFrame,
            playDirection: animation.playDirection,
            isSubframeEnabled: animation.isSubframeEnabled,
            currentRawFrame: animation.currentRawFrame,
            timeCompleted: animation.timeCompleted,
          },
        });
      });
      animations[payload.id] = {
        animation: animation,
        events: {},
      };
    }

    return {
      loadAnimation: loadAnimation,
    };
  })();
  onmessage = function (evt: any) {
    const data = evt.data;
    const type = data.type;
    const payload = data.payload;
    if (type === 'load') {
      lottieInternal.loadAnimation(payload);
    } else if (type === 'pause') {
      if (animations[payload.id]) {
        animations[payload.id].animation.pause();
      }
    } else if (type === 'play') {
      if (animations[payload.id]) {
        animations[payload.id].animation.play();
      }
    } else if (type === 'stop') {
      if (animations[payload.id]) {
        animations[payload.id].animation.stop();
      }
    } else if (type === 'setSpeed') {
      if (animations[payload.id]) {
        animations[payload.id].animation.setSpeed(payload.value);
      }
    } else if (type === 'setDirection') {
      if (animations[payload.id]) {
        animations[payload.id].animation.setDirection(payload.value);
      }
    } else if (type === 'setLoop') {
      if (animations[payload.id]) {
        animations[payload.id].animation.setLoop(payload.value);
      }
    } else if (type === 'goToAndPlay') {
      if (animations[payload.id]) {
        animations[payload.id].animation.goToAndPlay(payload.value, payload.isFrame);
      }
    } else if (type === 'goToAndStop') {
      if (animations[payload.id]) {
        animations[payload.id].animation.goToAndStop(payload.value, payload.isFrame);
      }
    } else if (type === 'setSubframe') {
      if (animations[payload.id]) {
        animations[payload.id].animation.setSubframe(payload.value);
      }
    } else if (type === 'addEventListener') {
      if (animations[payload.id]) {
        const eventCallback = function (...cbArgs: any[]) {
          self.postMessage({
            type: 'event',
            payload: {
              id: payload.id,
              callbackId: payload.callbackId,
              argument: cbArgs[0],
            },
          });
        };
        animations[payload.id].events[payload.callbackId] = {
          callback: eventCallback,
        };
        animations[payload.id].animation.addEventListener(payload.eventName, eventCallback);
      }
    } else if (type === 'removeEventListener') {
      if (animations[payload.id]) {
        const entry = animations[payload.id].events[payload.callbackId];
        animations[payload.id].animation.removeEventListener(payload.eventName, entry.callback);
      }
    } else if (type === 'destroy') {
      if (animations[payload.id]) {
        animations[payload.id].animation.destroy();
        animations[payload.id] = null;
      }
    } else if (type === 'resize') {
      if (animations[payload.id]) {
        animations[payload.id].animation.resize(payload.width, payload.height);
      }
    } else if (type === 'playSegments') {
      if (animations[payload.id]) {
        animations[payload.id].animation.playSegments(payload.arr, payload.forceFlag);
      }
    } else if (type === 'resetSegments') {
      if (animations[payload.id]) {
        animations[payload.id].animation.resetSegments(payload.forceFlag);
      }
    } else if (type === 'updateDocumentData') {
      animations[payload.id].animation.updateDocumentData(payload.path, payload.documentData, payload.index);
    }
  };
}

function createWorker(fn: () => void) {
  const blob = new Blob(['(' + fn.toString() + '())'], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  return new Worker(url);
}
const _lottieWorkerFacade = (function () {
  'use strict';

  const workerInstance = createWorker(workerContent);
  let animationIdCounter = 0;
  let eventsIdCounter = 0;
  const animations: Record<string, any> = {};
  const defaultSettings = {
    rendererSettings: {},
  };

  function createTree(data: any, container: any, map: any, afterElement?: any) {
    let elem: any;
    if (data.type === 'div') {
      elem = document.createElement('div');
    } else {
      elem = document.createElementNS(data.namespace, data.type);
    }
    if (data.textContent) {
      elem.textContent = data.textContent;
    }
    for (const attr in data.attributes) {
      if (Object.prototype.hasOwnProperty.call(data.attributes, attr)) {
        if (attr === 'href') {
          elem.setAttributeNS('http://www.w3.org/1999/xlink', attr, data.attributes[attr]);
        } else {
          elem.setAttribute(attr, data.attributes[attr]);
        }
        if (attr === 'id') {
          map[data.attributes[attr]] = elem;
        }
      }
    }
    for (const style in data.style) {
      if (Object.prototype.hasOwnProperty.call(data.style, style)) {
        elem.style[style] = data.style[style];
      }
    }
    data.children.forEach(function (element: any) {
      createTree(element, elem, map);
    });
    if (!afterElement) {
      container.appendChild(elem);
    } else {
      container.insertBefore(elem, afterElement);
    }
  }

  const handleAnimationLoaded = (function () {
    return function (payload: any) {
      const animation = animations[payload.id];
      animation._loaded = true;
      // if callbacks have been added before the animation has loaded
      animation.pendingCallbacks.forEach(function (callbackData: any) {
        animation.animInstance.addEventListener(callbackData.eventName, callbackData.callback);
        if (callbackData.eventName === 'DOMLoaded') {
          callbackData.callback();
        }
      });
      animation.animInstance.totalFrames = payload.totalFrames;
      animation.animInstance.frameRate = payload.frameRate;
      animation.animInstance.firstFrame = payload.firstFrame;
      animation.animInstance.playDirection = payload.playDirection;
      animation.animInstance.currentFrame = payload.isSubframeEnabled
        ? payload.currentRawFrame
        : ~~payload.currentRawFrame; // eslint-disable-line no-bitwise

      if (payload.timeCompleted !== payload.totalFrames && payload.currentFrame > payload.timeCompleted) {
        animation.animInstance.currentFrame = payload.timeCompleted;
      }
    };
  })();

  const handleSVGLoaded = (function () {
    return function (payload: any) {
      const animation = animations[payload.id];
      const container = animation.container;
      const elements = animation.elements;
      createTree(payload.tree, container, elements);
    };
  })();

  function addNewElements(newElements: any, elements: any) {
    let element;
    for (let i = 0; i < newElements.length; i += 1) {
      element = newElements[i];
      const parent = elements[element[1]];
      if (parent) {
        let sibling;
        if (element[2]) {
          sibling = elements[element[2]];
        }
        createTree(element[0], parent, elements, sibling);
        newElements.splice(i, 1);
        i -= 1;
      }
    }
  }

  function updateElementStyles(element: any, styles: any) {
    let style;
    for (let i = 0; i < styles.length; i += 1) {
      style = styles[i];
      element.style[style[0]] = style[1];
    }
  }

  function updateElementAttributes(element: any, attributes: any) {
    let attribute;
    for (let i = 0; i < attributes.length; i += 1) {
      attribute = attributes[i];
      element.setAttribute(attribute[0], attribute[1]);
    }
  }

  function updateTextContent(element: any, text: any) {
    if (text) {
      element.textContent = text;
    }
  }

  function handleAnimationUpdate(payload: any) {
    const changedElements = payload.elements;
    const animation = animations[payload.id];
    if (animation) {
      const elements = animation.elements;
      let elementData;
      for (let i = 0; i < changedElements.length; i += 1) {
        elementData = changedElements[i];
        const element = elements[elementData.id];
        addNewElements(elementData.elements, elements);
        updateElementStyles(element, elementData.styles);
        updateElementAttributes(element, elementData.attributes);
        updateTextContent(element, elementData.textContent);
      }
      animation.animInstance.currentFrame = payload.currentTime;
    }
  }

  function createInstructionsHandler(canvas: any) {
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const map: Record<string, any> = {
      beginPath: ctx.beginPath,
      closePath: ctx.closePath,
      rect: ctx.rect,
      clip: ctx.clip,
      clearRect: ctx.clearRect,
      setTransform: ctx.setTransform,
      moveTo: ctx.moveTo,
      bezierCurveTo: ctx.bezierCurveTo,
      lineTo: ctx.lineTo,
      fill: ctx.fill,
      save: ctx.save,
      restore: ctx.restore,
    };
    return function (instructions: any) {
      for (let i = 0; i < instructions.length; i += 1) {
        const instruction = instructions[i];
        const fn = map[instruction.t];
        if (fn) {
          fn.apply(ctx, instruction.a);
        } else {
          (ctx as any)[instruction.t] = instruction.a;
        }
      }
    };
  }

  function handleCanvasAnimationUpdate(payload: any) {
    const animation = animations[payload.id];
    animation.instructionsHandler(payload.instructions);
  }

  function handleEvent(payload: any) {
    const animation = animations[payload.id];
    if (animation) {
      const callbacks = animation.callbacks;
      if (callbacks[payload.callbackId]) {
        callbacks[payload.callbackId].callback(payload.argument);
      }
    }
  }

  function handlePlaying(payload: any) {
    const animation = animations[payload.id];
    if (animation) {
      animation.animInstance.isPaused = false;
    }
  }

  function handlePaused(payload: any) {
    const animation = animations[payload.id];
    if (animation) {
      animation.animInstance.isPaused = true;
    }
  }

  const messageHandlers: Record<string, (p: any) => void> = {
    DOMLoaded: handleAnimationLoaded,
    SVGloaded: handleSVGLoaded,
    SVGupdated: handleAnimationUpdate,
    CanvasUpdated: handleCanvasAnimationUpdate,
    event: handleEvent,
    playing: handlePlaying,
    paused: handlePaused,
  };

  workerInstance.onmessage = function (event: MessageEvent) {
    const t = event.data.type as string;
    if (messageHandlers[t]) {
      messageHandlers[t](event.data.payload);
    }
  };

  function resolveAnimationData(params: any) {
    return new Promise<any>(function (resolve, reject) {
      const paramsCopy = Object.assign({}, defaultSettings, params);
      if (paramsCopy.animType && !paramsCopy.renderer) {
        paramsCopy.renderer = paramsCopy.animType;
      }
      if (paramsCopy.wrapper) {
        if (!paramsCopy.container) {
          paramsCopy.container = paramsCopy.wrapper;
        }
        delete paramsCopy.wrapper;
      }
      if (paramsCopy.animationData) {
        resolve(paramsCopy);
      } else if (paramsCopy.path) {
        fetch(paramsCopy.path)
          .then(function (response: any) {
            return response.json();
          })
          .then(function (animationData: any) {
            paramsCopy.animationData = animationData;
            delete paramsCopy.path;
            resolve(paramsCopy);
          });
      } else {
        reject();
      }
    });
  }

  function loadAnimation(params: any) {
    animationIdCounter += 1;
    const animationId = 'lottie_animationId_' + animationIdCounter;
    const animation: any = {
      elements: {},
      callbacks: {},
      pendingCallbacks: [] as any[],
      status: 'init',
    };
    const animInstance: any = {
      id: animationId,
      isPaused: true,
      pause: function () {
        workerInstance.postMessage({
          type: 'pause',
          payload: {
            id: animationId,
          },
        });
      },
      play: function () {
        workerInstance.postMessage({
          type: 'play',
          payload: {
            id: animationId,
          },
        });
      },
      stop: function () {
        workerInstance.postMessage({
          type: 'stop',
          payload: {
            id: animationId,
          },
        });
      },
      setSpeed: function (value: any) {
        workerInstance.postMessage({
          type: 'setSpeed',
          payload: {
            id: animationId,
            value: value,
          },
        });
      },
      setDirection: function (value: any) {
        workerInstance.postMessage({
          type: 'setDirection',
          payload: {
            id: animationId,
            value: value,
          },
        });
      },
      setLoop: function (value: any) {
        workerInstance.postMessage({
          type: 'setLoop',
          payload: {
            id: animationId,
            value: value,
          },
        });
      },
      goToAndStop: function (value: any, isFrame: any) {
        workerInstance.postMessage({
          type: 'goToAndStop',
          payload: {
            id: animationId,
            value: value,
            isFrame: isFrame,
          },
        });
      },
      goToAndPlay: function (value: any, isFrame: any) {
        workerInstance.postMessage({
          type: 'goToAndPlay',
          payload: {
            id: animationId,
            value: value,
            isFrame: isFrame,
          },
        });
      },
      playSegments: function (arr: any, forceFlag: any) {
        workerInstance.postMessage({
          type: 'playSegments',
          payload: {
            id: animationId,
            arr: arr,
            forceFlag: forceFlag,
          },
        });
      },
      setSubframe: function (value: any) {
        workerInstance.postMessage({
          type: 'setSubframe',
          payload: {
            id: animationId,
            value: value,
          },
        });
      },
      addEventListener: function (eventName: any, callback: any) {
        if (!animation._loaded) {
          animation.pendingCallbacks.push({
            eventName: eventName,
            callback: callback,
          });
        } else {
          eventsIdCounter += 1;
          const callbackId = 'callback_' + eventsIdCounter;
          animation.callbacks[callbackId] = {
            eventName: eventName,
            callback: callback,
          };
          workerInstance.postMessage({
            type: 'addEventListener',
            payload: {
              id: animationId,
              callbackId: callbackId,
              eventName: eventName,
            },
          });
        }
      },
      removeEventListener: function (eventName: any, callback: any) {
        Object.keys(animation.callbacks).forEach(function (key: string) {
          if (
            animation.callbacks[key].eventName === eventName &&
            (animation.callbacks[key].callback === callback || !callback)
          ) {
            delete animation.callbacks[key];
            workerInstance.postMessage({
              type: 'removeEventListener',
              payload: {
                id: animationId,
                callbackId: key,
                eventName: eventName,
              },
            });
          }
        });
      },
      destroy: function () {
        if (animation.status === 'init') {
          animation.status = 'destroyable';
        } else {
          animation.status = 'destroyed';
          animations[animationId] = null;
          if (animation.container) {
            animation.container.innerHTML = '';
          }
          workerInstance.postMessage({
            type: 'destroy',
            payload: {
              id: animationId,
            },
          });
        }
      },
      resize: function (width: any, height: any) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        workerInstance.postMessage({
          type: 'resize',
          payload: {
            id: animationId,
            // Till Worker thread knows nothing about container, we've to pass it here
            width: width || (animation.container ? animation.container.offsetWidth * devicePixelRatio : 0),
            height: height || (animation.container ? animation.container.offsetHeight * devicePixelRatio : 0),
          },
        });
      },
      updateDocumentData: function (path: any, documentData: any, index: any) {
        workerInstance.postMessage({
          type: 'updateDocumentData',
          payload: {
            id: animationId,
            path: path,
            documentData: documentData,
            index: index,
          },
        });
      },
    };
    animation.animInstance = animInstance;
    resolveAnimationData(params).then(function (animationParams: any) {
      if (animation.status === 'destroyable') {
        animation.animInstance.destroy();
        return;
      }
      animation.status = 'loaded';
      const transferedObjects: any[] = [];
      if (animationParams.container) {
        animation.container = animationParams.container;
        delete animationParams.container;
      }
      if (animationParams.renderer === 'canvas') {
        let canvas = animationParams.rendererSettings.canvas;

        // If no custom canvas was passed
        if (!canvas) {
          const devicePixelRatio = window.devicePixelRatio || 1;
          canvas = document.createElement('canvas');
          animation.container.appendChild(canvas);
          canvas.width =
            (animation.container ? animation.container.offsetWidth : animationParams.animationData.w) *
            devicePixelRatio;
          canvas.height =
            (animation.container ? animation.container.offsetHeight : animationParams.animationData.h) *
            devicePixelRatio;
          canvas.style.width = '100%';
          canvas.style.height = '100%';
        }

        // Transfer control to offscreen if it's not already
        let transferCanvas = canvas;
        if (typeof OffscreenCanvas === 'undefined') {
          animation.canvas = canvas;
          animation.instructionsHandler = createInstructionsHandler(canvas);
        } else {
          if (!(canvas instanceof OffscreenCanvas)) {
            transferCanvas = canvas.transferControlToOffscreen();
            animationParams.rendererSettings.canvas = transferCanvas;
          }
          transferedObjects.push(transferCanvas);
        }
      }
      animations[animationId] = animation;
      workerInstance.postMessage(
        {
          type: 'load',
          payload: {
            params: animationParams,
            id: animationId,
          },
        },
        transferedObjects,
      );
    });
    return animInstance;
  }

  const lottiejs = {
    loadAnimation: loadAnimation,
  };
  return lottiejs;
})();
