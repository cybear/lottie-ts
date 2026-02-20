// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (args?: any) => void;

interface BaseEventThis {
  _cbs: Record<string, EventCallback[] | null>;
  triggerEvent(eventName: string, args?: unknown): void;
  addEventListener(eventName: string, callback: EventCallback): () => void;
  removeEventListener(eventName: string, callback?: EventCallback): void;
}

function BaseEvent(this: BaseEventThis) {}

BaseEvent.prototype = {
  triggerEvent(this: BaseEventThis, eventName: string, args?: unknown): void {
    if (this._cbs[eventName]) {
      const callbacks = this._cbs[eventName]!;
      for (let i = 0; i < callbacks.length; i += 1) {
        callbacks[i](args);
      }
    }
  },
  addEventListener(this: BaseEventThis, eventName: string, callback: EventCallback): () => void {
    if (!this._cbs[eventName]) {
      this._cbs[eventName] = [];
    }
    this._cbs[eventName]!.push(callback);

    return function (this: BaseEventThis) {
      this.removeEventListener(eventName, callback);
    }.bind(this);
  },
  removeEventListener(this: BaseEventThis, eventName: string, callback?: EventCallback): void {
    if (!callback) {
      this._cbs[eventName] = null;
    } else if (this._cbs[eventName]) {
      let i = 0;
      let len = this._cbs[eventName]!.length;
      while (i < len) {
        if (this._cbs[eventName]![i] === callback) {
          this._cbs[eventName]!.splice(i, 1);
          i -= 1;
          len -= 1;
        }
        i += 1;
      }
      if (!this._cbs[eventName]!.length) {
        this._cbs[eventName] = null;
      }
    }
  },
};

export default BaseEvent;
export type { EventCallback, BaseEventThis };
