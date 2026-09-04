import { FeedList } from "@/components/FeedList";
import { useThemeColors } from "@/lib/preferences";
import { View } from "react-native";

export default function HomeScreen() {
  const colors = useThemeColors();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FeedList homeRetap />
    </View>
  );
}
