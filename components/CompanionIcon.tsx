import { useContext, useEffect } from "react";
import { Alert, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CompanionFace, {
  CompanionExpressionState,
} from "@/components/CompanionFace";
import { getColors } from "@/constants/colors";
import { CompanionContext, CompanionStatus } from "@/context/CompanionContext";
import {
  CompanionMessage,
  CompanionMood,
  getCompanionApi,
} from "@/services/companionApi";

const colors = getColors();
const ICON_SIZE = 56;
const ICON_MARGIN = 16;
const SLEEPING_OPACITY = 0.4;
const READY_OPACITY = 1;
const WAKE_TRANSITION_DURATION_MS = 800;

function computeCompanionExpression(
  status: CompanionStatus,
  latestMessage: CompanionMessage | null,
): CompanionExpressionState {
  if (status !== "ready") {
    return "sleeping";
  }
  return latestMessage?.mood ?? "neutral";
}

interface SleepyLine {
  mood: CompanionMood;
  text: string;
}

const SLEEPY_LINES: SleepyLine[] = [
  { mood: "sad", text: "I'm getting up, give me a second..." },
  { mood: "snarky", text: "Still booting. Rude of you to expect otherwise." },
  { mood: "neutral", text: "Not awake yet — try again in a bit." },
];

let sleepyLineIndex = 0;

function pickSleepyLine(): SleepyLine {
  const line = SLEEPY_LINES[sleepyLineIndex % SLEEPY_LINES.length];
  sleepyLineIndex += 1;
  return line;
}

async function handleCompanionIconPress(
  status: CompanionStatus,
  activeThreadKey: string | null,
  isChatOpen: boolean,
  setIsChatOpen: (isChatOpen: boolean) => void,
  showTransientMessage: (message: CompanionMessage) => void,
): Promise<void> {
  if (isChatOpen) {
    setIsChatOpen(false);
    return;
  }
  if (status !== "ready") {
    const sleepyLine = pickSleepyLine();
    const message: CompanionMessage = {
      role: "companion",
      mood: sleepyLine.mood,
      text: sleepyLine.text,
      createdAt: Date.now(),
    };
    showTransientMessage(message);
    Alert.alert("Companion", "Connecting to the companion...");
    return;
  }
  if (!activeThreadKey) {
    return;
  }
  const companionApi = getCompanionApi();
  const thread = await companionApi.getOrCreateThread(activeThreadKey);
  console.log("[Companion] chat opened", thread.threadKey);
  setIsChatOpen(true);
}

export default function CompanionIcon() {
  const {
    status,
    latestMessage,
    activeThread,
    isChatOpen,
    setIsChatOpen,
    showTransientMessage,
  } = useContext(CompanionContext);
  const activeThreadKey = activeThread?.threadKey ?? null;
  const insets = useSafeAreaInsets();
  const isReady = status === "ready";
  const expression = computeCompanionExpression(status, latestMessage);
  const opacity = useSharedValue(SLEEPING_OPACITY);

  useEffect(() => {
    const targetOpacity = isReady ? READY_OPACITY : SLEEPING_OPACITY;
    opacity.value = withTiming(targetOpacity, {
      duration: WAKE_TRANSITION_DURATION_MS,
    });
  }, [isReady, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const style = { opacity: opacity.value };
    return style;
  });

  const positionStyle = {
    bottom: insets.bottom + ICON_MARGIN,
    right: insets.right + ICON_MARGIN,
  };
  const pressableStyle = [styles.pressable, positionStyle];
  const containerStyle = [styles.container, animatedStyle];

  function onPress(): void {
    handleCompanionIconPress(
      status,
      activeThreadKey,
      isChatOpen,
      setIsChatOpen,
      showTransientMessage,
    );
  }

  const content = (
    <Pressable onPress={onPress} style={pressableStyle}>
      <Animated.View style={containerStyle}>
        <CompanionFace expression={expression} />
      </Animated.View>
    </Pressable>
  );
  return content;
}

const styles = StyleSheet.create({
  pressable: {
    position: "absolute",
    zIndex: 1000,
  },
  container: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
  },
});
