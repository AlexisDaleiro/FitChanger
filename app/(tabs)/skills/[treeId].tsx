import { useTheme } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { copy } from '@/copy';

// SPEC-GAP: Tarea 1 exige Text placeholder; la primitiva Text y sus tokens pertenecen a Tarea 2.
export default function SkillTreeScreen() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center">
        <Text style={{ color: colors.text }}>{copy.skills.tree}</Text>
      </View>
    </SafeAreaView>
  );
}
