import { useCallback } from "react";
import {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const SHAKE_DISTANCE_PX = 2;
const SHAKE_ROTATION_DEGREES = 2;
const SHAKE_SEGMENT_DURATION_MS = 50;
const shakeTimingConfig = {
  duration: SHAKE_SEGMENT_DURATION_MS,
  reduceMotion: ReduceMotion.Never,
};

export type ShakeMode = "horizontal" | "rotate";

// Returns an animated style plus a shake() trigger for a brief oscillating nudge.
export function useShake(mode: ShakeMode) {
  const shakeOffset = useSharedValue(0);
  const shakeMagnitude =
    mode === "rotate" ? SHAKE_ROTATION_DEGREES : SHAKE_DISTANCE_PX;

  const shake = useCallback(() => {
    shakeOffset.value = withSequence(
      withTiming(-shakeMagnitude, shakeTimingConfig),
      withTiming(shakeMagnitude, shakeTimingConfig),
      withTiming(-shakeMagnitude, shakeTimingConfig),
      withTiming(shakeMagnitude, shakeTimingConfig),
      withTiming(0, shakeTimingConfig),
    );
  }, [shakeOffset, shakeMagnitude]);

  const shakeStyle = useAnimatedStyle(() => {
    const isRotating = mode === "rotate";
    const translateX = isRotating ? 0 : shakeOffset.value;
    const rotate = isRotating ? `${shakeOffset.value}deg` : "0deg";
    const animatedStyle = {
      transform: [{ translateX }, { rotate }],
    };
    return animatedStyle;
  });

  const result = { shake, shakeStyle };
  return result;
}
