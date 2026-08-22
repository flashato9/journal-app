import { Gesture } from "react-native-gesture-handler";
import {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

const SWIPE_SNAP_DISTANCE_PX = 75;
const SWIPE_UP_TRIGGER_DELAY_MS = 500;
const plopSpringConfig = {
  damping: 10,
  stiffness: 150,
  reduceMotion: ReduceMotion.Never,
};

// Tracks an upward drag 1:1 with the finger, always plopping back to rest on release, calling onSwipeUp (after a short delay) only if released past a minimum upward distance.
export function useSwipeUpGesture(
  onSwipeUp: () => void | Promise<void>,
  isEnabled: boolean,
) {
  const translateY = useSharedValue(0);

  function handleSwipeUp(): void {
    setTimeout(onSwipeUp, SWIPE_UP_TRIGGER_DELAY_MS);
  }

  const gesture = Gesture.Pan()
    .enabled(isEnabled)
    .onUpdate((event) => {
      translateY.value = Math.min(0, event.translationY);
    })
    .onEnd((event) => {
      const isPastSnapThreshold = event.translationY <= -SWIPE_SNAP_DISTANCE_PX;
      translateY.value = withSpring(0, plopSpringConfig);
      if (isPastSnapThreshold) {
        runOnJS(handleSwipeUp)();
      }
    });

  const polaroidSwipeStyle = useAnimatedStyle(() => {
    const animatedStyle = {
      transform: [{ translateY: translateY.value }],
    };
    return animatedStyle;
  });

  const result = { gesture, polaroidSwipeStyle };
  return result;
}
