import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import CompanionFace from "@/components/CompanionFace";
import { getColors } from "@/constants/colors";
import { logTrace } from "@/services/appLogger";
import { CompanionThread } from "@/services/companionApi";

const colors = getColors();
const FOLDER_NAME = "MemoryJournalApp";
const SIDEBAR_WIDTH = 120;

interface CompanionChatSidebarProps {
  threads: CompanionThread[];
  activeThreadKey: string;
  onSelectThread: (threadKey: string) => void;
}

function renderThreadRow(
  thread: CompanionThread,
  activeThreadKey: string,
  onSelectThread: (threadKey: string) => void,
) {
  const isActive = thread.threadKey === activeThreadKey;
  const rowStyle = [styles.threadRow, isActive ? styles.threadRowActive : null];

  function onPress(): void {
    onSelectThread(thread.threadKey);
  }

  const content = (
    <Pressable key={thread.threadKey} onPress={onPress} style={rowStyle}>
      <Text style={styles.threadLabel} numberOfLines={1}>
        {thread.threadKey}
      </Text>
    </Pressable>
  );
  return content;
}

export default function CompanionChatSidebar({
  threads,
  activeThreadKey,
  onSelectThread,
}: CompanionChatSidebarProps) {
  const [isFolderOpen, setIsFolderOpen] = useState(false);
  logTrace("[Companion:sidebarRender] Threads ->", threads);
  logTrace(
    "[Companion:sidebarProps]",
    threads.map((thread) => thread.threadKey),
    "active:",
    activeThreadKey,
    "folderOpen:",
    isFolderOpen,
  );

  function onToggleFolder(): void {
    setIsFolderOpen((currentIsFolderOpen) => !currentIsFolderOpen);
  }

  const folderChevronName = isFolderOpen ? "expand-more" : "chevron-right";
  const threadRows = isFolderOpen
    ? threads.map((thread) =>
        renderThreadRow(thread, activeThreadKey, onSelectThread),
      )
    : null;

  const content = (
    <View style={styles.container}>
      <View style={styles.iconRow}>
        {/* <CompanionFace expression="neutral" /> */}
      </View>
      <Pressable onPress={onToggleFolder} style={styles.folderRow}>
        <MaterialIcons name={folderChevronName} size={16} color={colors.text} />
        <MaterialIcons name="folder" size={14} color={colors.text} />
        <Text style={styles.folderLabel} numberOfLines={1}>
          {FOLDER_NAME}
        </Text>
      </Pressable>
      {threadRows}
    </View>
  );
  return content;
}

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
    borderColor: colors.border,
    paddingRight: 6,
    marginRight: 6,
  },
  iconRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: 4,
  },
  folderLabel: {
    fontSize: 11,
    color: colors.text,
    flexShrink: 1,
  },
  threadRow: {
    paddingVertical: 4,
    paddingLeft: 18,
  },
  threadRowActive: {
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  threadLabel: {
    fontSize: 12,
    color: colors.text,
  },
});
