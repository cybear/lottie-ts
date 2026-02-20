(function () {
  let lastTime = 0;
  const vendors = ['ms', 'moz', 'webkit', 'o'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any;

  for (let x = 0; x < vendors.length && !win.requestAnimationFrame; x += 1) { // eslint-disable-line no-plusplus
    win.requestAnimationFrame = win[vendors[x] + 'RequestAnimationFrame'];
    win.cancelAnimationFrame = win[vendors[x] + 'CancelAnimationFrame']
      || win[vendors[x] + 'CancelRequestAnimationFrame'];
  }

  if (!win.requestAnimationFrame) {
    win.requestAnimationFrame = function (callback: (time: number) => void): number {
      const currTime = new Date().getTime();
      const timeToCall = Math.max(0, 16 - (currTime - lastTime));
      const id = setTimeout(function () {
        callback(currTime + timeToCall);
      }, timeToCall);
      lastTime = currTime + timeToCall;
      return id as unknown as number;
    };
  }

  if (!win.cancelAnimationFrame) {
    win.cancelAnimationFrame = function (id: number) {
      clearTimeout(id);
    };
  }
}());
