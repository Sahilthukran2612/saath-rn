import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

// True while the on-screen keyboard is up. The floating bar uses it to get out of the way, and the helper window
// uses it to sit lower.
export default function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}
