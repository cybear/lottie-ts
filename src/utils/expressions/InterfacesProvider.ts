import LayerExpressionInterface from './LayerInterface';
import EffectsExpressionInterface from './EffectInterface';
import CompExpressionInterface from './CompInterface';
import ShapeExpressionInterface from './ShapeInterface';
import TextExpressionInterface from './TextInterface';
import FootageInterface from './FootageInterface';

type InterfaceFn = (...args: unknown[]) => unknown;

const interfaces: Record<string, InterfaceFn> = {
  layer: LayerExpressionInterface as InterfaceFn,
  effects: EffectsExpressionInterface as unknown as InterfaceFn,
  comp: CompExpressionInterface as InterfaceFn,
  shape: ShapeExpressionInterface as InterfaceFn,
  text: TextExpressionInterface as InterfaceFn,
  footage: FootageInterface as InterfaceFn,
};

function getInterface(type: string): InterfaceFn | null {
  return interfaces[type] ?? null;
}

export default getInterface;
