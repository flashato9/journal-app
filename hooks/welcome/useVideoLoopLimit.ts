import { useEffect, useRef } from "react";
import { VideoPlayer } from "expo-video";

// Freezes the player on its final frame after it has looped maxLoops times, to save battery.
export function useVideoLoopLimit(player: VideoPlayer, maxLoops: number) {
  const loopCountRef = useRef(0);

  useEffect(() => {
    loopCountRef.current = 0;
    const subscription = player.addListener("playToEnd", () => {
      loopCountRef.current += 1;
      if (loopCountRef.current >= maxLoops) {
        player.loop = false;
        player.pause();
      }
    });
    return () => {
      subscription.remove();
    };
  }, [player, maxLoops]);
}
