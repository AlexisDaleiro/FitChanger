import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/Text';
import { copy } from '@/copy';

export default function SkillTreeScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center">
        <Text>{copy.skills.tree}</Text>
      </View>
    </SafeAreaView>
  );
}
