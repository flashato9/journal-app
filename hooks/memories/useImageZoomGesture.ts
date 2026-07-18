import { useCallback } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Pinch-to-zoom for a single image, e.g. inside
// components/memories/MediaGallery/MediaPreviewModal.tsx. Kept separate from
// that component so its rendering stays focused on the modal chrome
// (backdrop, close button) rather than gesture math.
export function useImageZoomGesture() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const reset = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    focalX.value = 0;
    focalY.value = 0;
  }, [scale, savedScale, focalX, focalY]);

  // No pan gesture — the image intentionally can't be dragged. Instead, the
  // pinch's own focal point drives the transform (translate to focal point,
  // scale, translate back), so zooming anchors on wherever the fingers are
  // rather than always scaling from dead center.
  const gesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    })
    .onEnd(() => {
      // Don't allow zooming out past the image's original size.
      savedScale.value = scale.value < 1 ? 1 : scale.value;
      scale.value = withTiming(savedScale.value);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: focalX.value },
      { translateY: focalY.value },
      { scale: scale.value },
      { translateX: -focalX.value },
      { translateY: -focalY.value },
    ],
  }));

  return { gesture, animatedStyle, reset };
}
