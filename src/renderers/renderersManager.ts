const renderers: Record<string, unknown> = {};

const registerRenderer = (key: string, value: unknown) => {
  renderers[key] = value;
};

function getRenderer(key: string): unknown {
  return renderers[key];
}

function getRegisteredRenderer(): string {
  if (renderers.canvas) {
    return 'canvas';
  }
  for (const key in renderers) {
    if (renderers[key]) {
      return key;
    }
  }
  return '';
}

export { registerRenderer, getRenderer, getRegisteredRenderer };
