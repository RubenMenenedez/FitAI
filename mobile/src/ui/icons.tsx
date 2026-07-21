import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { colors } from '../theme';

export interface IconProps {
  size?: number;
  color?: string;
  /** Stroke width in viewBox units (24). */
  weight?: number;
}

type SvgKids = React.ReactNode;

function Base({ size = 24, color = colors.text, children }: IconProps & { children: SvgKids }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  );
}

const stroke = (color: string, w: number) => ({
  stroke: color,
  strokeWidth: w,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function HomeIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M3 10.5 12 3l9 7.5" {...stroke(color, weight)} />
      <Path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" {...stroke(color, weight)} />
      <Path d="M9.5 21v-6h5v6" {...stroke(color, weight)} />
    </Base>
  );
}

export function CalendarIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Rect x="3.5" y="5" width="17" height="16" rx="3" {...stroke(color, weight)} />
      <Path d="M3.5 9.5h17M8 3v4M16 3v4" {...stroke(color, weight)} />
    </Base>
  );
}

export function ChartIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Polyline points="4,15 9,10 13,13 20,6" {...stroke(color, weight)} />
      <Path d="M4 20h16" {...stroke(color, weight)} />
    </Base>
  );
}

export function UserIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Circle cx="12" cy="8" r="4" {...stroke(color, weight)} />
      <Path d="M4.5 20a7.5 7.5 0 0 1 15 0" {...stroke(color, weight)} />
    </Base>
  );
}

export function CameraIcon({ size, color = colors.white, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M4 8.5a2 2 0 0 1 2-2h1.5l1.2-1.8a1 1 0 0 1 .83-.45h5a1 1 0 0 1 .83.45L16.5 6.5H18a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8.5Z" {...stroke(color, weight)} />
      <Circle cx="12" cy="12.5" r="3.2" {...stroke(color, weight)} />
    </Base>
  );
}

export function FlameIcon({ size, color = colors.fat, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path
        d="M12 3c.5 3-2 4-2 7a2 2 0 0 0 4 0c2 1.5 3 3.2 3 5.2A5.2 5.2 0 0 1 6.8 15c0-2.3 1.3-3.8 2.5-5C10.8 8.6 12 6.5 12 3Z"
        fill={color}
      />
    </Base>
  );
}

export function BellIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6Z" {...stroke(color, weight)} />
      <Path d="M10 19a2 2 0 0 0 4 0" {...stroke(color, weight)} />
    </Base>
  );
}

export function ChevronRightIcon({ size, color = colors.textFaint, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Polyline points="9,5 16,12 9,19" {...stroke(color, weight)} />
    </Base>
  );
}

export function ChevronLeftIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Polyline points="15,5 8,12 15,19" {...stroke(color, weight)} />
    </Base>
  );
}

export function PlusIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Line x1="12" y1="5" x2="12" y2="19" {...stroke(color, weight)} />
      <Line x1="5" y1="12" x2="19" y2="12" {...stroke(color, weight)} />
    </Base>
  );
}

export function CheckIcon({ size, color = colors.white, weight = 2.4 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Polyline points="5,12.5 10,17.5 19,7" {...stroke(color, weight)} />
    </Base>
  );
}

export function CloseIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Line x1="6" y1="6" x2="18" y2="18" {...stroke(color, weight)} />
      <Line x1="18" y1="6" x2="6" y2="18" {...stroke(color, weight)} />
    </Base>
  );
}

export function GearIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Circle cx="12" cy="12" r="3" {...stroke(color, weight)} />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" {...stroke(color, weight)} />
    </Base>
  );
}

export function CartIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M3 4h2l2 12h11l2-8H6" {...stroke(color, weight)} />
      <Circle cx="9" cy="20" r="1.4" fill={color} />
      <Circle cx="18" cy="20" r="1.4" fill={color} />
    </Base>
  );
}

export function UsersIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Circle cx="9" cy="8" r="3.2" {...stroke(color, weight)} />
      <Path d="M3.5 19a5.5 5.5 0 0 1 11 0" {...stroke(color, weight)} />
      <Path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-2.3-4.5" {...stroke(color, weight)} />
    </Base>
  );
}

export function TargetIcon({ size, color = colors.text, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Circle cx="12" cy="12" r="8.5" {...stroke(color, weight)} />
      <Circle cx="12" cy="12" r="4.5" {...stroke(color, weight)} />
      <Circle cx="12" cy="12" r="1.2" fill={color} />
    </Base>
  );
}

export function HeartIcon({ size, color = colors.danger, weight = 2, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Base size={size} color={color}>
      <Path
        d="M12 20s-7-4.4-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.6c0 5-7 9.4-7 9.4Z"
        {...(filled ? { fill: color } : stroke(color, weight))}
      />
    </Base>
  );
}

export function CommentIcon({ size, color = colors.textMuted, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3v-3H6a2 2 0 0 1-2-2V6Z" {...stroke(color, weight)} />
    </Base>
  );
}

export function SparkleIcon({ size, color = colors.primary, weight = 2 }: IconProps) {
  return (
    <Base size={size} color={color}>
      <Path d="M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6L12 4Z" fill={color} />
      <Path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" fill={color} />
    </Base>
  );
}
