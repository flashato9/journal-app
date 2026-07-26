import { StyleSheet, Text } from "react-native";
import { Dropdown as ElementDropdown } from "react-native-element-dropdown";

interface DropdownOption<T extends string> {
  label: string;
  value: T;
}

interface DropdownProps<T extends string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
}

interface DropdownItem<T extends string> {
  label: string;
  value: T;
  itemTestID?: string;
}

export default function Dropdown<T extends string>({
  options,
  value,
  onChange,
  testID,
}: DropdownProps<T>) {
  const data: DropdownItem<T>[] = options.map((option) => {
    const item: DropdownItem<T> = {
      label: option.label,
      value: option.value,
      itemTestID: testID ? `${testID}-option-${option.value}` : undefined,
    };
    return item;
  });

  const handleChange = (item: DropdownItem<T>) => {
    onChange(item.value);
  };

  const renderDropdownItem = (item: DropdownItem<T>) => {
    const content = <Text style={styles.itemText}>{item.label}</Text>;
    return content;
  };

  const content = (
    <ElementDropdown
      style={styles.dropdown}
      selectedTextStyle={styles.selectedText}
      containerStyle={styles.menuContainer}
      itemContainerStyle={styles.item}
      renderItem={renderDropdownItem}
      data={data}
      labelField="label"
      valueField="value"
      itemTestIDField="itemTestID"
      value={value}
      onChange={handleChange}
      testID={testID ? `${testID}-toggle` : undefined}
    />
  );
  return content;
}

const styles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  selectedText: {
    fontSize: 16,
    color: "#000",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  itemText: {
    fontSize: 16,
    color: "#000",
  },
});
