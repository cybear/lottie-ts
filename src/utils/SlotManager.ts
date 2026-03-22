// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimationData = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PropData = Record<string, any>;

interface SlotManagerThis {
  animationData: AnimationData;
}

function SlotManager(this: SlotManagerThis, animationData: AnimationData) {
  this.animationData = animationData;
}

SlotManager.prototype.getProp = function (this: SlotManagerThis, data: PropData): PropData {
  if (this.animationData.slots && this.animationData.slots[data.sid]) {
    return Object.assign(data, this.animationData.slots[data.sid].p);
  }
  return data;
};

function slotFactory(animationData: AnimationData): SlotManagerThis {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (SlotManager as any)(animationData);
}

export default slotFactory;
