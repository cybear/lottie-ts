const markerParser = (function () {
  function parsePayloadLines(payload: string): Record<string, string> {
    const lines = payload.split('\r\n');
    const keys: Record<string, string> = {};
    let line: string[];
    let keysCount = 0;
    for (let i = 0; i < lines.length; i += 1) {
      line = lines[i].split(':');
      if (line.length === 2) {
        keys[line[0]] = line[1].trim();
        keysCount += 1;
      }
    }
    if (keysCount === 0) {
      throw new Error();
    }
    return keys;
  }

  interface RawMarker {
    tm: number;
    dr: number;
    cm?: string;
  }

  interface ParsedMarker {
    time: number;
    duration: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
  }

  return function (_markers: RawMarker[]): ParsedMarker[] {
    const markers: ParsedMarker[] = [];
    for (let i = 0; i < _markers.length; i += 1) {
      const _marker = _markers[i];
      const markerData: ParsedMarker = {
        time: _marker.tm,
        duration: _marker.dr,
      };
      try {
        markerData.payload = JSON.parse(_markers[i].cm ?? '');
      } catch (_) {
        try {
          markerData.payload = parsePayloadLines(_markers[i].cm ?? '');
        } catch (__) {
          markerData.payload = {
            name: _markers[i].cm,
          };
        }
      }
      markers.push(markerData);
    }
    return markers;
  };
}());

export default markerParser;
