/* eslint-disable @typescript-eslint/no-explicit-any -- worker animation manager registry */
import AnimationItem from './AnimationItem';

const animationManager = (function () {
  const moduleOb: Record<string, any> = {};
  const registeredAnimations: any[] = [];
  let initTime = 0;
  let len = 0;
  let playingAnimationsNum = 0;
  let _stopped = true;
  let _isFrozen = false;

  function removeElement(ev: any) {
    let i = 0;
    const animItem = ev.target;
    while (i < len) {
      if (registeredAnimations[i].animation === animItem) {
        registeredAnimations.splice(i, 1);
        i -= 1;
        len -= 1;
        if (!animItem.isPaused) {
          subtractPlayingCount();
        }
      }
      i += 1;
    }
  }

  function registerAnimation(element: any, animationData: any) {
    if (!element) {
      return null;
    }
    let i = 0;
    while (i < len) {
      if (registeredAnimations[i].elem === element && registeredAnimations[i].elem !== null) {
        return registeredAnimations[i].animation;
      }
      i += 1;
    }
    const animItem = new AnimationItem();
    setupAnimation(animItem, element);
    animItem.setData(element, animationData);
    return animItem;
  }

  function getRegisteredAnimations() {
    let i;
    const lenAnims = registeredAnimations.length;
    const animations = [];
    for (i = 0; i < lenAnims; i += 1) {
      animations.push(registeredAnimations[i].animation);
    }
    return animations;
  }

  function addPlayingCount() {
    playingAnimationsNum += 1;
    activate();
  }

  function subtractPlayingCount() {
    playingAnimationsNum -= 1;
  }

  function setupAnimation(animItem: any, element: any) {
    animItem.addEventListener('destroy', removeElement);
    animItem.addEventListener('_active', addPlayingCount);
    animItem.addEventListener('_idle', subtractPlayingCount);
    registeredAnimations.push({ elem: element, animation: animItem });
    len += 1;
  }

  function loadAnimation(params: any) {
    const animItem = new AnimationItem();
    setupAnimation(animItem, null);
    animItem.setParams(params);
    return animItem;
  }

  function setSpeed(val: any, animation: any) {
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.setSpeed(val, animation);
    }
  }

  function setDirection(val: any, animation: any) {
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.setDirection(val, animation);
    }
  }

  function play(animation: any) {
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.play(animation);
    }
  }
  function resume(nowTime: number) {
    const elapsedTime = nowTime - initTime;
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.advanceTime(elapsedTime);
    }
    initTime = nowTime;
    if (playingAnimationsNum && !_isFrozen) {
      requestAnimationFrame(resume);
    } else {
      _stopped = true;
    }
  }

  function first(nowTime: number) {
    initTime = nowTime;
    requestAnimationFrame(resume);
  }

  function pause(animation: any) {
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.pause(animation);
    }
  }

  function goToAndStop(value: any, isFrame: any, animation: any) {
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.goToAndStop(value, isFrame, animation);
    }
  }

  function stop(animation: any) {
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.stop(animation);
    }
  }

  function togglePause(animation: any) {
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.togglePause(animation);
    }
  }

  function destroy(animation: any) {
    let i;
    for (i = len - 1; i >= 0; i -= 1) {
      registeredAnimations[i].animation.destroy(animation);
    }
  }

  function searchAnimations() {
    throw new Error('Cannot access DOM from worker thread');
  }

  function resize() {
    let i;
    for (i = 0; i < len; i += 1) {
      registeredAnimations[i].animation.resize();
    }
  }

  function activate() {
    if (!_isFrozen && playingAnimationsNum) {
      if (_stopped) {
        requestAnimationFrame(first);
        _stopped = false;
      }
    }
  }

  function freeze() {
    _isFrozen = true;
  }

  function unfreeze() {
    _isFrozen = false;
    activate();
  }

  moduleOb.registerAnimation = registerAnimation;
  moduleOb.loadAnimation = loadAnimation;
  moduleOb.setSpeed = setSpeed;
  moduleOb.setDirection = setDirection;
  moduleOb.play = play;
  moduleOb.pause = pause;
  moduleOb.stop = stop;
  moduleOb.togglePause = togglePause;
  moduleOb.searchAnimations = searchAnimations;
  moduleOb.resize = resize;
  // moduleOb.start = start;
  moduleOb.goToAndStop = goToAndStop;
  moduleOb.destroy = destroy;
  moduleOb.freeze = freeze;
  moduleOb.unfreeze = unfreeze;
  moduleOb.getRegisteredAnimations = getRegisteredAnimations;
  return moduleOb;
})();

export default animationManager;
