/* eslint-disable @typescript-eslint/no-explicit-any -- bundle entry: effect ctor variance at registration boundary */
import lottie from './html_light';
import { setExpressionsPlugin, setExpressionInterfaces } from '../utils/common';
import Expressions from '../utils/expressions/Expressions';
import interfacesProvider from '../utils/expressions/InterfacesProvider';
import expressionPropertyDecorator from '../utils/expressions/ExpressionPropertyDecorator';
import expressionTextPropertyDecorator from '../utils/expressions/ExpressionTextPropertyDecorator';
// SVG effects
import { registerEffect } from '../elements/svgElements/SVGEffects';
import SVGTintFilter from '../elements/svgElements/effects/SVGTintEffect';
import SVGFillFilter from '../elements/svgElements/effects/SVGFillFilter';
import SVGStrokeEffect from '../elements/svgElements/effects/SVGStrokeEffect';
import SVGTritoneFilter from '../elements/svgElements/effects/SVGTritoneFilter';
import SVGProLevelsFilter from '../elements/svgElements/effects/SVGProLevelsFilter';
import SVGDropShadowEffect from '../elements/svgElements/effects/SVGDropShadowEffect';
import SVGMatte3Effect from '../elements/svgElements/effects/SVGMatte3Effect';
import SVGGaussianBlurEffect from '../elements/svgElements/effects/SVGGaussianBlurEffect';
import SVGTransformEffect from '../elements/svgElements/effects/SVGTransformEffect';

const registerSvgEffect = registerEffect as (id: number, effect: any, countsAsEffect?: boolean) => void;

// Registering expression plugin
setExpressionsPlugin(Expressions);
setExpressionInterfaces(interfacesProvider);
expressionPropertyDecorator();
expressionTextPropertyDecorator();
registerSvgEffect(20, SVGTintFilter, true);
registerSvgEffect(21, SVGFillFilter, true);
registerSvgEffect(22, SVGStrokeEffect, false);
registerSvgEffect(23, SVGTritoneFilter, true);
registerSvgEffect(24, SVGProLevelsFilter, true);
registerSvgEffect(25, SVGDropShadowEffect, true);
registerSvgEffect(28, SVGMatte3Effect, false);
registerSvgEffect(29, SVGGaussianBlurEffect, true);
registerSvgEffect(35, SVGTransformEffect, false);

export default lottie;
