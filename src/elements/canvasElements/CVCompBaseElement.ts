import BaseRenderer from '../../renderers/BaseRenderer';

/** Canvas comp shell; concrete comps use `extendPrototype` onto `BaseRenderer` + `CanvasRendererBase`. */
abstract class CVCompBaseElement extends BaseRenderer {}

export default CVCompBaseElement;
