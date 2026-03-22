import CompExpressionInterface from './CompInterface';
import ExpressionManagerImport from './ExpressionManager';

/** Narrow surface for `ExpressionManager` for callers that only need `resetFrame` / `initiateExpression`. */
type ExpressionManagerApi = {
  resetFrame: () => void;
  initiateExpression: (elem: unknown, data: unknown, prop: unknown) => () => void;
};

const ExpressionManager = ExpressionManagerImport as ExpressionManagerApi;

interface ExpressionRegistrant {
  release(): void;
}

interface AnimationWithRenderer {
  renderer: {
    compInterface?: unknown;
    globalData: {
      projectInterface: { registerComposition(renderer: unknown): void };
      pushExpression?: () => void;
      popExpression?: () => void;
      registerExpressionProperty?: (expression: ExpressionRegistrant) => void;
    };
  };
}

const Expressions = (function () {
  function initExpressions(animation: AnimationWithRenderer) {
    let stackCount = 0;
    const registers: ExpressionRegistrant[] = [];

    function pushExpression() {
      stackCount += 1;
    }

    function popExpression() {
      stackCount -= 1;
      if (stackCount === 0) {
        releaseInstances();
      }
    }

    function registerExpressionProperty(expression: ExpressionRegistrant) {
      if (registers.indexOf(expression) === -1) {
        registers.push(expression);
      }
    }

    function releaseInstances() {
      let i: number;
      const len = registers.length;
      for (i = 0; i < len; i += 1) {
        registers[i].release();
      }
      registers.length = 0;
    }

    animation.renderer.compInterface = CompExpressionInterface(animation.renderer);
    animation.renderer.globalData.projectInterface.registerComposition(animation.renderer);
    animation.renderer.globalData.pushExpression = pushExpression;
    animation.renderer.globalData.popExpression = popExpression;
    animation.renderer.globalData.registerExpressionProperty = registerExpressionProperty;
  }

  return {
    initExpressions,
    resetFrame: ExpressionManager.resetFrame,
  };
})();

export default Expressions;
