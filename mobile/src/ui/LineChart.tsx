import { View } from 'react-native';
import Svg, { Polyline, Circle, Line as SvgLine } from 'react-native-svg';
import { colors, spacing } from '../theme';
import { AppText } from './Typography';

/**
 * Minimal responsive line chart (SVG) for weight trends. Plots `data` points
 * across a fixed 300×140 viewBox; the SVG scales to the container width. Shows a
 * soft baseline grid and a dot on the last point.
 */
export function LineChart({
  data,
  height = 150,
  color = colors.primary,
  xLabels,
}: {
  data: number[];
  height?: number;
  color?: string;
  xLabels?: string[];
}) {
  const W = 300;
  const H = 140;
  const padX = 8;
  const padY = 14;

  if (data.length < 2) {
    return (
      <View style={{ height, alignItems: 'center', justifyContent: 'center' }}>
        <AppText variant="small" tone="faint">—</AppText>
      </View>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = (W - padX * 2) / (data.length - 1);

  const points = data.map((v, i) => {
    const x = padX + i * stepX;
    const y = padY + (1 - (v - min) / range) * (H - padY * 2);
    return { x, y };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(' ');
  const last = points[points.length - 1];

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((g) => (
          <SvgLine key={g} x1={padX} y1={padY + g * (H - padY * 2)} x2={W - padX} y2={padY + g * (H - padY * 2)} stroke={colors.border} strokeWidth={1} />
        ))}
        <Polyline points={polyline} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx={last.x} cy={last.y} r={4.5} fill={color} stroke={colors.surface} strokeWidth={2} />
      </Svg>
      {xLabels && xLabels.length > 0 ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
          {xLabels.map((l, i) => (
            <AppText key={i} variant="tiny" tone="faint">{l}</AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}
