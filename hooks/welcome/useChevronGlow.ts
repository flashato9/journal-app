import { useEffect } from "react";
import {
  interpolateColor,
  ReduceMotion,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { getColors } from "@/constants/colors";

const colors = getColors();
const CHEVRON_GLOW_COLOR = "#ffffff";
const OSCILLATION_MIN_OPACITY = 0.55;
const OSCILLATION_MAX_OPACITY = 1;
const OSCILLATION_DURATION_MS = 1400;
const OSCILLATION_STAGGER_MS = 180;
const FAILURE_FLASH_DURATION_MS = 150;
const FAILURE_FLASH_COUNT = 3;
const oscillationTimingConfig = {
  duration: OSCILLATION_DURATION_MS,
  reduceMotion: ReduceMotion.Never,
};
const failureFlashTimingConfig = {
  duration: FAILURE_FLASH_DURATION_MS,
  reduceMotion: ReduceMotion.Never,
};

// Drives one chevron's idle brightness shimmer and its brief red flash on login failure.
export function useChevronGlow(index: number, failureTrigger: number) {
  const opacity = useSharedValue(OSCILLATION_MAX_OPACITY);
  const failureGlow = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      index * OSCILLATION_STAGGER_MS,
      withRepeat(
        withSequence(
          withTiming(OSCILLATION_MIN_OPACITY, oscillationTimingConfig),
          withTiming(OSCILLATION_MAX_OPACITY, oscillationTimingConfig),
        ),
        -1,
        true,
      ),
    );
  }, [index, opacity]);

  useEffect(() => {
    if (!failureTrigger) {
      return;
    }
    failureGlow.value = withRepeat(
      withSequence(
        withTiming(1, failureFlashTimingConfig),
        withTiming(0, failureFlashTimingConfig),
      ),
      FAILURE_FLASH_COUNT,
      false,
    );
  }, [failureTrigger, failureGlow]);

  const animatedProps = useAnimatedProps(() => {
    const chevronAnimatedProps = {
      opacity: opacity.value,
      stroke: interpolateColor(
        failureGlow.value,
        [0, 1],
        [CHEVRON_GLOW_COLOR, colors.error],
      ),
    };
    return chevronAnimatedProps;
  });

  const result = { animatedProps };
  return result;
}
