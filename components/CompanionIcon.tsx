import { useRouter } from "expo-router";
import { useContext, useEffect } from "react";
import { Alert, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";
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
import { logInfo } from "@/services/appLogger";
import { UserTable } from "@/services/database";

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
  if (status === "connecting") {
    return "sleeping";
  }
  if (status === "offline") {
    return "offline";
  }
  return latestMessage?.mood ?? "neutral";
}

interface StatusLine {
  mood: CompanionMood;
  text: string;
}

const SLEEPY_LINES: StatusLine[] = [
  { mood: "sad", text: "I'm getting up, give me a second..." },
  { mood: "snarky", text: "Still booting. Rude of you to expect otherwise." },
  { mood: "neutral", text: "Not awake yet — try again in a bit." },
];

const OFFLINE_LINES: StatusLine[] = [
  { mood: "snarky", text: "I'm on vacation, leave me alone." },
  { mood: "snarky", text: "Out of office. Try again never." },
  { mood: "sad", text: "Can't reach home base right now." },
];

let sleepyLineIndex = 0;

function pickSleepyLine(): StatusLine {
  const line = SLEEPY_LINES[sleepyLineIndex % SLEEPY_LINES.length];
  sleepyLineIndex += 1;
  return line;
}

let offlineLineIndex = 0;

function pickOfflineLine(): StatusLine {
  const line = OFFLINE_LINES[offlineLineIndex % OFFLINE_LINES.length];
  offlineLineIndex += 1;
  return line;
}

async function handleSingleTap(
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
  if (status === "connecting") {
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
  if (status === "offline") {
    const offlineLine = pickOfflineLine();
    const message: CompanionMessage = {
      role: "companion",
      mood: offlineLine.mood,
      text: offlineLine.text,
      createdAt: Date.now(),
    };
    showTransientMessage(message);
    return;
  }
  if (!activeThreadKey) {
    return;
  }
  const resourceId = UserTable.getOrCreateCompanionResourceId();
  if (!resourceId) {
    return;
  }
  const companionApi = getCompanionApi();
  const thread = await companionApi.getOrCreateThread(
    activeThreadKey,
    resourceId,
  );
  logInfo("[Companion] chat opened", thread.threadKey);
  setIsChatOpen(true);
}

function handleTripleTap(
  status: CompanionStatus,
  retryConnection: () => void,
  navigateToAgentChat: () => void,
): void {
  if (status === "offline") {
    retryConnection();
    return;
  }
  if (status === "ready") {
    navigateToAgentChat();
  }
}

export default function CompanionIcon() {
  const {
    status,
    latestMessage,
    activeThread,
    isChatOpen,
    setIsChatOpen,
    showTransientMessage,
    retryConnection,
  } = useContext(CompanionContext);
  const activeThreadKey = activeThread?.threadKey ?? null;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isReady = status === "ready";
  const expression = computeCompanionExpression(status, latestMessage);
  const opacity = useSharedValue(SLEEPING_OPACITY);
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const keyboardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardHeight.value }],
  }));

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
  const outerStyle = [styles.positioned, positionStyle, keyboardAnimatedStyle];
  const containerStyle = [styles.container, animatedStyle];

  function onSingleTap(): void {
    handleSingleTap(
      status,
      activeThreadKey,
      isChatOpen,
      setIsChatOpen,
      showTransientMessage,
    );
  }

  function navigateToAgentChat(): void {
    router.push("/agent-chat");
  }

  function onTripleTap(): void {
    handleTripleTap(status, retryConnection, navigateToAgentChat);
  }

  const singleTapGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(onSingleTap);
  });
  const tripleTapGesture = Gesture.Tap()
    .numberOfTaps(3)
    .onEnd(() => {
      scheduleOnRN(onTripleTap);
    });
  const tapGesture = Gesture.Exclusive(tripleTapGesture, singleTapGesture);

  const content = (
    <Animated.View style={outerStyle}>
      <GestureDetector gesture={tapGesture}>
        <Animated.View style={containerStyle}>
          <CompanionFace expression={expression} />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
  return content;
}

const styles = StyleSheet.create({
  positioned: {
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
