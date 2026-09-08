import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { IconEye, IconEyeOff } from "@/components/Icons";
import { useThemeColors } from "@/lib/preferences";
import type { Palette } from "@/lib/theme";

type Props = Omit<TextInputProps, "secureTextEntry"> & {
  value: string;
  onChangeText: (value: string) => void;
};

export function PasswordField({ value, onChangeText, style, ...rest }: Props) {
  const colors = useThemeColors();
  const styles = makeStyles(colors);
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        {...rest}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!visible}
        autoComplete={rest.autoComplete ?? "password"}
        textContentType={rest.textContentType ?? "password"}
        autoCapitalize={rest.autoCapitalize ?? "none"}
        autoCorrect={rest.autoCorrect ?? false}
        style={[styles.input, style]}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        style={styles.toggle}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Hide password" : "Show password"}
      >
        {visible ? <IconEyeOff color={colors.muted} /> : <IconEye color={colors.muted} />}
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Palette) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.field,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "center",
    },
    input: {
      flex: 1,
      color: colors.text,
      paddingHorizontal: 14,
      paddingVertical: 12,
      paddingRight: 8,
      fontSize: 16,
    },
    toggle: {
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
  });
}
