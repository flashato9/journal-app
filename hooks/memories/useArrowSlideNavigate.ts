import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef } from "react";
import {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

const ARROW_LEFT_OFFSET_PX = 32;
const ARROW_SLIDE_DURATION_MS = 400;
const arrowSlideTimingConfig = {
  duration: ARROW_SLIDE_DURATION_MS,
  reduceMotion: ReduceMotion.Never,
};

// Slides a card's arrow icon across on hold or tap, navigating only once the touch is released; resets to rest position on focus.
export function useArrowSlideNavigate(navigate: () => void) {
  const arrowOffset = useSharedValue(-ARROW_LEFT_OFFSET_PX);
  const isNavigatingRef = useRef(false);
  const isHoldingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      arrowOffset.value = -ARROW_LEFT_OFFSET_PX;
      isHoldingRef.current = false;
      isNavigatingRef.current = false;
    }, [arrowOffset]),
  );

  const navigateOnce = useCallback(() => {
    if (isNavigatingRef.current) {
      return;
    }
    isNavigatingRef.current = true;
    navigate();
  }, [navigate]);

  const handleTapSlideComplete = useCallback(
    (finished?: boolean) => {
      if (finished) {
        navigateOnce();
      }
    },
    [navigateOnce],
  );

  const handleLongPress = useCallback(() => {
    isHoldingRef.current = true;
    arrowOffset.value = withTiming(0, arrowSlideTimingConfig);
  }, [arrowOffset]);

  const handlePressOut = useCallback(() => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      navigateOnce();
      return;
    }
    arrowOffset.value = withTiming(0, arrowSlideTimingConfig, (finished) => {
      runOnJS(handleTapSlideComplete)(finished);
    });
  }, [arrowOffset, handleTapSlideComplete, navigateOnce]);

  const arrowStyle = useAnimatedStyle(() => {
    const animatedStyle = { transform: [{ translateX: arrowOffset.value }] };
    return animatedStyle;
  });

  const result = { arrowStyle, handleLongPress, handlePressOut };
  return result;
}
