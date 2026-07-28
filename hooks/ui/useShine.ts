import { useCallback, useEffect, useState } from "react";
import { LayoutChangeEvent } from "react-native";
import {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const SHINE_SWEEP_DURATION_MS = 1000;
const SHINE_PAUSE_MS = 2000;
const shineSweepTimingConfig = { duration: SHINE_SWEEP_DURATION_MS };
const shineResetTimingConfig = { duration: 0 };

// Returns an animated translateX style plus a layout handler for a periodic light-sweep effect across an element.
export function useShine(isEnabled: boolean, bandWidth: number) {
  const startX = -bandWidth;
  const shineOffset = useSharedValue(startX);
  const [elementWidth, setElementWidth] = useState(0);

  const handleShineLayout = useCallback((event: LayoutChangeEvent) => {
    setElementWidth(event.nativeEvent.layout.width);
  }, []);

  useEffect(() => {
    if (!isEnabled || elementWidth === 0) {
      shineOffset.value = startX;
      return;
    }
    shineOffset.value = startX;
    shineOffset.value = withRepeat(
      withSequence(
        withDelay(
          SHINE_PAUSE_MS,
          withTiming(elementWidth, shineSweepTimingConfig),
        ),
        withTiming(startX, shineResetTimingConfig),
      ),
      -1,
      false,
    );
  }, [isEnabled, elementWidth, shineOffset, bandWidth]);

  const shineStyle = useAnimatedStyle(() => {
    const animatedStyle = { transform: [{ translateX: shineOffset.value }] };
    return animatedStyle;
  });

  const result = { shineStyle, handleShineLayout };
  return result;
}
