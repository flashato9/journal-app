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

// Slides a card's arrow icon across, then calls navigate once the slide finishes; resets to rest position on focus.
export function useArrowSlideNavigate(navigate: () => void) {
  const arrowOffset = useSharedValue(-ARROW_LEFT_OFFSET_PX);
  const isNavigatingRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      arrowOffset.value = -ARROW_LEFT_OFFSET_PX;
    }, [arrowOffset]),
  );

  const handleSlideComplete = useCallback(
    (finished?: boolean) => {
      isNavigatingRef.current = false;
      if (finished) {
        navigate();
      }
    },
    [navigate],
  );

  const handlePress = useCallback(() => {
    if (isNavigatingRef.current) {
      return;
    }
    isNavigatingRef.current = true;
    arrowOffset.value = withTiming(0, arrowSlideTimingConfig, (finished) => {
      runOnJS(handleSlideComplete)(finished);
    });
  }, [arrowOffset, handleSlideComplete]);

  const arrowStyle = useAnimatedStyle(() => {
    const animatedStyle = { transform: [{ translateX: arrowOffset.value }] };
    return animatedStyle;
  });

  const result = { arrowStyle, handlePress };
  return result;
}
