interface FontData {
  fStyle?: string;
  fWeight?: string;
}

interface FontProperties {
  style: string;
  weight: string;
}

function getFontProperties(fontData: FontData): FontProperties {
  const styles = fontData.fStyle ? fontData.fStyle.split(' ') : [];

  let fWeight = 'normal';
  let fStyle = 'normal';
  const len = styles.length;

  for (let i = 0; i < len; i += 1) {
    const styleName = styles[i].toLowerCase();
    switch (styleName) {
      case 'italic':
        fStyle = 'italic';
        break;
      case 'bold':
        fWeight = '700';
        break;
      case 'black':
        fWeight = '900';
        break;
      case 'medium':
        fWeight = '500';
        break;
      case 'regular':
      case 'normal':
        fWeight = '400';
        break;
      case 'light':
      case 'thin':
        fWeight = '200';
        break;
      default:
        break;
    }
  }

  return {
    style: fStyle,
    weight: fontData.fWeight || fWeight,
  };
}

export default getFontProperties;
export type { FontData, FontProperties };
