// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnimationData = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PropData = Record<string, any>;

class SlotManager {
  animationData: AnimationData;

  constructor(animationData: AnimationData) {
    this.animationData = animationData;
  }

  getProp(data: PropData): PropData {
    if (this.animationData.slots && this.animationData.slots[data.sid]) {
      return Object.assign(data, this.animationData.slots[data.sid].p);
    }
    return data;
  }
}

function slotFactory(animationData: AnimationData): SlotManager {
  return new SlotManager(animationData);
}

export default slotFactory;
