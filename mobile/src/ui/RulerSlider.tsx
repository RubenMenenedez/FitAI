import { useEffect, useRef, useState } from 'react';
import { View, ScrollView, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollPoint } from 'react-native';
import { colors } from '../theme';

const TICK_SPACING = 10;

/**
 * Horizontal ruler slider with snapping ticks (weight picker). Every 5th tick is
 * taller. A fixed center caret marks the selection; the numeric read-out is the
 * parent's responsibility. Reports the snapped value on settle.
 */
export function RulerSlider({
  min,
  max,
  step,
  value,
  onChange,
  tint = colors.primary,
}: {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  tint?: string;
}) {
  const ref = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);
  const count = Math.round((max - min) / step) + 1;
  const index = Math.max(0, Math.min(count - 1, Math.round((value - min) / step)));
  const sidePad = width / 2;

  useEffect(() => {
    if (width > 0) ref.current?.scrollTo({ x: index * TICK_SPACING, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, index]);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  function settle(e: NativeSyntheticEvent<{ contentOffset: NativeScrollPoint }>) {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.max(0, Math.min(count - 1, Math.round(x / TICK_SPACING)));
    const next = Math.round((min + i * step) * 100) / 100;
    if (next !== value) onChange(next);
  }

  return (
    <View onLayout={onLayout} style={{ height: 72, justifyContent: 'center' }}>
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={TICK_SPACING}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: sidePad, alignItems: 'center', height: 72 }}
        onMomentumScrollEnd={settle}
        onScrollEndDrag={settle}
      >
        {Array.from({ length: count }).map((_, i) => {
          const major = i % 5 === 0;
          return (
            <View key={i} style={{ width: TICK_SPACING, alignItems: 'center', justifyContent: 'center' }}>
              <View
                style={{
                  width: major ? 2 : 1,
                  height: major ? 34 : 20,
                  borderRadius: 1,
                  backgroundColor: major ? colors.borderStrong : colors.border,
                }}
              />
            </View>
          );
        })}
      </ScrollView>

      {/* Center caret */}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
        <View style={{ width: 3, height: 44, borderRadius: 2, backgroundColor: tint }} />
      </View>
    </View>
  );
}
