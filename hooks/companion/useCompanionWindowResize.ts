import { useWindowDimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

const ONE_INCH_DP = 160;
const GRID_CELL_DP = ONE_INCH_DP / 6;
const MIN_WIDTH = ONE_INCH_DP * 2;
const MIN_HEIGHT = ONE_INCH_DP * 2;
const SCREEN_MARGIN = 24;

// RN layout units follow Android's dp convention (160dp ≈ 1in at baseline
// density) — the closest cross-platform approximation available without a
// native PPI lookup. Grid cells snap to half that (GRID_CELL_DP).
function snapToGrid(value: number): number {
  "worklet";
  const snapped = Math.round(value / GRID_CELL_DP) * GRID_CELL_DP;
  return snapped;
}

export function useCompanionWindowResize(
  initialWidth: number,
  initialHeight: number,
  rightAnchor: number,
  bottomAnchor: number,
  topInset: number,
  glowBorderColor: string,
  glowShadowColor: string,
  onLock: (width: number, height: number) => void,
) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const width = useSharedValue(initialWidth);
  const height = useSharedValue(initialHeight);
  const savedWidth = useSharedValue(initialWidth);
  const savedHeight = useSharedValue(initialHeight);
  const isLocked = useSharedValue(false);
  const glowProgress = useSharedValue(0);
  const maxWidth = screenWidth - SCREEN_MARGIN;
  const topBoundary = topInset + SCREEN_MARGIN;
  const maxHeight = Math.min(
    screenHeight - SCREEN_MARGIN,
    screenHeight - bottomAnchor - topBoundary,
  );

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (isLocked.value) {
        return;
      }
      glowProgress.value = withTiming(1, { duration: 150 });
    })
    .onUpdate((event) => {
      if (isLocked.value) {
        return;
      }
      const candidateWidth = savedWidth.value - event.translationX;
      const candidateHeight = savedHeight.value - event.translationY;
      const clampedWidth = Math.min(
        Math.max(candidateWidth, MIN_WIDTH),
        maxWidth,
      );
      const clampedHeight = Math.min(
        Math.max(candidateHeight, MIN_HEIGHT),
        maxHeight,
      );
      width.value = Math.min(
        Math.max(snapToGrid(clampedWidth), MIN_WIDTH),
        maxWidth,
      );
      height.value = Math.min(
        Math.max(snapToGrid(clampedHeight), MIN_HEIGHT),
        maxHeight,
      );
    })
    .onEnd(() => {
      savedWidth.value = width.value;
      savedHeight.value = height.value;
    })
    .onFinalize(() => {
      glowProgress.value = withTiming(0, { duration: 200 });
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      isLocked.value = !isLocked.value;
      if (isLocked.value) {
        scheduleOnRN(onLock, width.value, height.value);
      }
    });

  const resizeGesture = Gesture.Exclusive(doubleTapGesture, panGesture);

  const layoutStyle = useAnimatedStyle(() => {
    const style = {
      width: width.value,
      height: height.value,
      left: screenWidth - rightAnchor - width.value,
    };
    return style;
  });

  const lockIconStyle = useAnimatedStyle(() => {
    const style = { opacity: isLocked.value ? 1 : 0 };
    return style;
  });

  const handleGlowStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      glowProgress.value,
      [0, 1],
      ["transparent", glowBorderColor],
    );
    const blurRadius = interpolate(glowProgress.value, [0, 1], [0, 10]);
    const style = {
      borderColor,
      boxShadow: [
        { offsetX: 0, offsetY: 0, blurRadius, color: glowShadowColor },
      ],
    };
    return style;
  });

  const result = { resizeGesture, layoutStyle, lockIconStyle, handleGlowStyle };
  return result;
}
