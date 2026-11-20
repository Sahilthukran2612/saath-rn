import React from 'react';
import { Text } from 'react-native';

// Hindi on Android: a Text whose width comes from its own content (a button label, a title in a row) is measured
// a little narrower than it draws, so its last word wraps onto a second line that is then clipped ("संपर्क जोड़ें"
// showed as "संपर्क"). Seen on an Android 15 emulator. Two no-break spaces after the text give it the missing
// room and change nothing visible. English text is left exactly as it is.
const DEVANAGARI = /[ऀ-ॿ]/;
const SLACK = '  ';

export const hasDevanagari = (children) => {
  if (typeof children === 'string') return DEVANAGARI.test(children);
  if (Array.isArray(children)) return children.some(hasDevanagari);
  return false;
};

export const withSlack = (children) => {
  if (!hasDevanagari(children)) return children;
  return Array.isArray(children) ? [...children, SLACK] : `${children}${SLACK}`;
};

const AppText = React.forwardRef(function AppText({ children, ...rest }, ref) {
  return (
    <Text ref={ref} {...rest}>
      {withSlack(children)}
    </Text>
  );
});

export default AppText;
