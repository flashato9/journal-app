import { useEffect } from "react";
import {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const SPIN_DURATION_MS = 800;
const spinTimingConfig = {
  duration: SPIN_DURATION_MS,
  reduceMotion: ReduceMotion.Never,
};

// Returns an animated rotate style that spins continuously while isSpinning is true.
export function useSpin(isSpinning: boolean) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (!isSpinning) {
      rotation.value = 0;
      return;
    }
    rotation.value = withRepeat(withTiming(360, spinTimingConfig), -1, false);
  }, [isSpinning, rotation]);

  const spinStyle = useAnimatedStyle(() => {
    const animatedStyle = { transform: [{ rotate: `${rotation.value}deg` }] };
    return animatedStyle;
  });

  const result = { spinStyle };
  return result;
}
