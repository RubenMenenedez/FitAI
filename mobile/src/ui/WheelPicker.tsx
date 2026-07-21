import { useEffect, useRef } from 'react';
import { View, ScrollView, Pressable, type NativeSyntheticEvent, type NativeScrollPoint } from 'react-native';
import { colors, spacing, radius } from '../theme';
import { AppText } from './Typography';

const ITEM_HEIGHT = 48;
const VISIBLE = 5; // odd → one centered row

/**
 * Vertical snap wheel picker. Renders `options` in a scroll column; the centered
 * row is the selection. Snaps to each row and reports the value on settle.
 */
export function WheelPicker<T extends string | number>({
  options,
  value,
  onChange,
  formatLabel,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  formatLabel?: (v: T) => string;
}) {
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, options.indexOf(value));
  const pad = (ITEM_HEIGHT * (VISIBLE - 1)) / 2;

  // Keep the wheel aligned to the selected value when it changes externally.
  useEffect(() => {
    ref.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function settle(e: NativeSyntheticEvent<{ contentOffset: NativeScrollPoint }>) {
    const y = e.nativeEvent.contentOffset.y;
    const i = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(options.length - 1, i));
    const next = options[clamped];
    if (next !== value) onChange(next);
  }

  return (
    <View style={{ height: ITEM_HEIGHT * VISIBLE }}>
      {/* Center selection highlight */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute', left: 0, right: 0, top: pad, height: ITEM_HEIGHT,
          borderRadius: radius.md, backgroundColor: colors.surfaceAlt,
        }}
      />
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: pad }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
      >
        {options.map((opt, i) => {
          const selected = i === index;
          return (
            <Pressable
              key={String(opt)}
              onPress={() => onChange(opt)}
              style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
            >
              <AppText
                style={{
                  fontSize: selected ? 24 : 18,
                  fontWeight: selected ? '800' : '500',
                  color: selected ? colors.text : colors.textFaint,
                }}
              >
                {formatLabel ? formatLabel(opt) : String(opt)}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
