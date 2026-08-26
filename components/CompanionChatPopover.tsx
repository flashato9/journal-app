import { MaterialIcons } from "@expo/vector-icons";
import { useContext, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CompanionChatSidebar from "@/components/CompanionChatSidebar";
import { getColors } from "@/constants/colors";
import { CompanionContext } from "@/context/CompanionContext";
import { useCompanionThreadList } from "@/hooks/companion/useCompanionThreadList";
import { useCompanionWindowLayout } from "@/hooks/companion/useCompanionWindowLayout";
import { useCompanionWindowResize } from "@/hooks/companion/useCompanionWindowResize";
import { useKeyboardHeight } from "@/hooks/ui/useKeyboardHeight";
import { logError, logInfo, logTrace } from "@/services/appLogger";
import {
  CompanionMessage,
  CompanionThread,
  getCompanionApi,
} from "@/services/companionApi";
import { UserTable } from "@/services/database";

const colors = getColors();
const ICON_SIZE = 56;
const ICON_MARGIN = 16;
const POPOVER_GAP = 12;
const DEFAULT_POPOVER_WIDTH = 320;
const DEFAULT_POPOVER_HEIGHT = 320;

// let popoverThreadsLogCount = 0;

function renderMessage({ item }: { item: CompanionMessage }) {
  const isUserMessage = item.role === "user";
  const speaker = isUserMessage ? "You" : "Companion";
  const rowStyle = [
    styles.row,
    isUserMessage ? styles.rowUser : styles.rowCompanion,
  ];
  const bubbleStyle = [
    styles.bubble,
    isUserMessage ? styles.bubbleUser : styles.bubbleCompanion,
  ];
  const messageTextStyle = isUserMessage
    ? styles.messageTextUser
    : styles.messageTextCompanion;

  const content = (
    <View style={rowStyle}>
      <Text style={styles.author}>{speaker}</Text>
      <View style={bubbleStyle}>
        <Text style={messageTextStyle}>{item.text}</Text>
      </View>
    </View>
  );
  return content;
}

function getMessageKey(item: CompanionMessage): string {
  const key = `${item.createdAt}-${item.role}`;
  return key;
}

async function sendUserMessage(
  threadKey: string,
  text: string,
  refreshActiveThread: (threadKey: string) => void,
): Promise<void> {
  const trimmedText = text.trim();
  if (!trimmedText) {
    logInfo("[Companion:userMessage] empty text, not sending");
    return;
  }
  const resourceId = UserTable.getOrCreateCompanionResourceId();
  if (!resourceId) {
    logInfo("[Companion:userMessage] no resourceId, not sending");
    return;
  }
  logInfo("[Companion:userMessage] sending", threadKey, trimmedText);
  try {
    const companionApi = getCompanionApi();
    const reply = await companionApi.sendUserMessage(
      threadKey,
      trimmedText,
      resourceId,
    );
    logInfo("[Companion:userMessage] reply received", reply);
    refreshActiveThread(threadKey);
  } catch (error) {
    logError("[Companion:userMessage] send failed", error);
  }
}

async function loadSelectedThread(
  threadKey: string,
  reportActiveThread: (thread: CompanionThread) => void,
): Promise<void> {
  const resourceId = UserTable.getOrCreateCompanionResourceId();
  if (!resourceId) {
    return;
  }
  const companionApi = getCompanionApi();
  const thread = await companionApi.getOrCreateThread(threadKey, resourceId);
  reportActiveThread(thread);
}

export default function CompanionChatPopover() {
  const {
    status,
    isChatOpen,
    activeThread,
    refreshActiveThread,
    reportActiveThread,
    threadListVersion,
  } = useContext(CompanionContext);
  logTrace("[Companion:popoverRender]", {
    isChatOpen,
    activeThreadKey: activeThread?.threadKey ?? null,
    status,
    threadListVersion,
  });
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const [inputText, setInputText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messageListRef = useRef<FlatList<CompanionMessage>>(null);
  const rightAnchor = insets.right + ICON_MARGIN;
  const bottomAnchor =
    insets.bottom + ICON_MARGIN + ICON_SIZE + POPOVER_GAP + keyboardHeight;
  const { initialWidth, initialHeight, saveLayout } = useCompanionWindowLayout(
    DEFAULT_POPOVER_WIDTH,
    DEFAULT_POPOVER_HEIGHT,
  );
  const { resizeGesture, layoutStyle, lockIconStyle, handleGlowStyle } =
    useCompanionWindowResize(
      initialWidth,
      initialHeight,
      rightAnchor,
      bottomAnchor,
      insets.top,
      colors.primary,
      colors.companionHandleGlow,
      saveLayout,
    );

  useEffect(() => {
    messageListRef.current?.scrollToEnd({ animated: false });
  }, []);

  const { threads } = useCompanionThreadList(
    isChatOpen && !!activeThread && status === "ready",
    threadListVersion,
  );

  if (!isChatOpen || !activeThread || status !== "ready") {
    return null;
  }

  const threadKey = activeThread.threadKey;
  // popoverThreadsLogCount += 1;
  logTrace("[Companion:popoverRender] Threads ->", threads);
  function onSend(): void {
    const textToSend = inputText;
    setInputText("");
    sendUserMessage(threadKey, textToSend, refreshActiveThread);
  }

  function scrollToLatestMessage(): void {
    messageListRef.current?.scrollToEnd({ animated: true });
  }

  function onToggleSidebar(): void {
    setIsSidebarOpen((currentIsSidebarOpen) => !currentIsSidebarOpen);
  }

  function onSelectThread(selectedThreadKey: string): void {
    loadSelectedThread(selectedThreadKey, reportActiveThread);
  }

  const positionStyle = {
    bottom: bottomAnchor,
  };
  const containerStyle = [styles.container, positionStyle, layoutStyle];
  const sidebarToggleIconName = isSidebarOpen ? "chevron-left" : "menu";
  const sidebar = isSidebarOpen ? (
    <CompanionChatSidebar
      threads={threads}
      activeThreadKey={threadKey}
      onSelectThread={onSelectThread}
    />
  ) : null;

  const content = (
    <Animated.View style={containerStyle}>
      <GestureDetector gesture={resizeGesture}>
        <Animated.View style={[styles.resizeHandle, handleGlowStyle]}>
          <Animated.View style={lockIconStyle}>
            <MaterialIcons name="lock" size={10} color={colors.text} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <View style={styles.header}>
        <Pressable onPress={onToggleSidebar} style={styles.sidebarToggle}>
          <MaterialIcons
            name={sidebarToggleIconName}
            size={18}
            color={colors.text}
          />
        </Pressable>
      </View>
      <View style={styles.body}>
        {sidebar}
        <View style={styles.mainColumn}>
          <FlatList
            ref={messageListRef}
            style={styles.messageList}
            data={activeThread.messages}
            keyExtractor={getMessageKey}
            renderItem={renderMessage}
            onContentSizeChange={scrollToLatestMessage}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={onSend}
              placeholder="Type a message"
              placeholderTextColor={colors.textMuted}
            />
            <Pressable onPress={onSend} style={styles.sendButton}>
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Animated.View>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 999,
  },
  resizeHandle: {
    position: "absolute",
    top: -20,
    left: -20,
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    marginBottom: 4,
  },
  sidebarToggle: {
    padding: 4,
  },
  body: {
    flex: 1,
    flexDirection: "row",
  },
  mainColumn: {
    flex: 1,
    flexDirection: "column",
  },
  messageList: {
    flex: 1,
    paddingRight: 8,
  },
  row: {
    marginBottom: 12,
  },
  rowCompanion: {
    alignItems: "flex-start",
  },
  rowUser: {
    alignItems: "flex-end",
  },
  author: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 2,
  },
  bubble: {
    maxWidth: "80%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  bubbleCompanion: {
    backgroundColor: colors.background,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
  },
  messageTextCompanion: {
    fontSize: 14,
    color: colors.text,
  },
  messageTextUser: {
    fontSize: 14,
    color: colors.dayCardAccentText,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sendButtonText: {
    color: colors.dayCardAccentText,
    fontSize: 14,
  },
});
