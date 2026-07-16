import { useCallback } from "react";
import { Gesture } from "react-native-gesture-handler";
import {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Pinch-to-zoom + pan-while-zoomed for a single image, e.g. inside
// components/memories/MediaGallery/MediaPreviewModal.tsx. Kept separate from
// that component so its rendering stays focused on the modal chrome
// (backdrop, close button) rather than gesture math.
export function useImageZoomGesture() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const reset = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, [
    scale,
    savedScale,
    translateX,
    translateY,
    savedTranslateX,
    savedTranslateY,
  ]);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Don't allow zooming out past the image's original size.
      savedScale.value = scale.value < 1 ? 1 : scale.value;
      scale.value = withTiming(savedScale.value);
    });

  const panGesture = Gesture.Pan()
    // Without this, a two-finger pinch also feeds its centroid movement into
    // this gesture's onUpdate, translating the image while it's being
    // zoomed instead of scaling in place around center.
    .minPointers(1)
    .maxPointers(1)
    .onUpdate((event) => {
      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const gesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return { gesture, animatedStyle, reset };
}
