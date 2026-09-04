import { FeedList } from "@/components/FeedList";
import { colors } from "@/lib/theme";
import { View } from "react-native";

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FeedList homeRetap />
    </View>
  );
}
