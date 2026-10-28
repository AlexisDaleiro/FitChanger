import type { LucideIconData } from 'lucide-react-native';
import Svg, { Circle, Path, Rect, type SvgProps } from 'react-native-svg';
import Reanimated, {
  interpolateColor,
  useAnimatedProps,
  type SharedValue,
} from 'react-native-reanimated';

import { tokens } from '@/theme/tokens';

const AnimatedSvg = Reanimated.createAnimatedComponent(Svg);
const shapes = { path: Path, circle: Circle, rect: Rect };

export interface TabIconProps {
  icon: LucideIconData;
  progress: SharedValue<number>;
}

export function TabIcon({ icon, progress }: TabIconProps) {
  const animatedProps = useAnimatedProps<SvgProps>(() => ({
    color: interpolateColor(
      progress.get(),
      [0, 1],
      [tokens.colors.text.tertiary, tokens.colors.text.primary],
    ),
  }));

  // Lucide copia stroke en cada hijo. Sus datos oficiales permiten heredar
  // currentColor y animar el SVG nativo sin renderizar React por frame.
  return (
    <AnimatedSvg
      accessible={false}
      width={tokens.tabBar.iconSize}
      height={tokens.tabBar.iconSize}
      viewBox={`0 0 ${icon.size ?? icon.width} ${icon.size ?? icon.height}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={tokens.tabBar.iconStrokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      color={tokens.colors.text.tertiary}
      animatedProps={animatedProps}
    >
      {icon.node.map(([tag, attributes]) => {
        if (tag !== 'path' && tag !== 'circle' && tag !== 'rect') return null;
        const Shape = shapes[tag];
        const { key, ...props } = attributes;
        return <Shape key={key} {...props} />;
      })}
    </AnimatedSvg>
  );
}
