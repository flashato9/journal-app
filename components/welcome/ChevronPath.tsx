import Animated from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";
import { useChevronGlow } from "@/hooks/welcome/useChevronGlow";

const CHEVRON_ARM_LENGTHS_PX = [73.125, 59.0625, 45, 30.9375];
const CHEVRON_HALF_ANGLES_DEGREES = [65, 65, 65, 65];
const CHEVRON_STROKE_WIDTHS_PX = [10, 7, 5, 3];
const CHEVRON_CANVAS_WIDTH_PX = 150;
const CHEVRON_CANVAS_HEIGHT_PX = 48;
const CHEVRON_APEX_X = CHEVRON_CANVAS_WIDTH_PX / 2;
const CHEVRON_APEX_Y = 6;

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ChevronPathData {
  d: string;
  strokeWidth: number;
}

function getChevronPathData(index: number): ChevronPathData {
  const armLength = CHEVRON_ARM_LENGTHS_PX[index];
  const halfAngleRadians = (CHEVRON_HALF_ANGLES_DEGREES[index] * Math.PI) / 180;
  const armDeltaX = armLength * Math.sin(halfAngleRadians);
  const armDeltaY = armLength * Math.cos(halfAngleRadians);
  const leftX = CHEVRON_APEX_X - armDeltaX;
  const rightX = CHEVRON_APEX_X + armDeltaX;
  const armEndY = CHEVRON_APEX_Y + armDeltaY;
  const pathData = `M ${leftX} ${armEndY} L ${CHEVRON_APEX_X} ${CHEVRON_APEX_Y} L ${rightX} ${armEndY}`;
  const chevronPathData = {
    d: pathData,
    strokeWidth: CHEVRON_STROKE_WIDTHS_PX[index],
  };
  return chevronPathData;
}

interface ChevronPathProps {
  index: number;
  failureTrigger: number;
}

export default function ChevronPath({
  index,
  failureTrigger,
}: ChevronPathProps) {
  const { animatedProps } = useChevronGlow(index, failureTrigger);
  const pathData = getChevronPathData(index);

  const content = (
    <Svg width={CHEVRON_CANVAS_WIDTH_PX} height={CHEVRON_CANVAS_HEIGHT_PX}>
      <AnimatedPath
        d={pathData.d}
        strokeWidth={pathData.strokeWidth}
        strokeLinecap="round"
        fill="none"
        animatedProps={animatedProps}
      />
    </Svg>
  );
  return content;
}
