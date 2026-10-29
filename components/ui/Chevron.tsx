type Direction = "down" | "up" | "left" | "right";

type Props = Readonly<{
  /** When true, rotates a down chevron to point up (dropdowns / collapses). */
  open?: boolean;
  direction?: Direction;
  className?: string;
}>;

const ROTATION: Record<Direction, number> = {
  down: 0,
  up: 180,
  left: 90,
  right: -90,
};

/** Filled caret matching native select arrows. */
export function Chevron({ open = false, direction = "down", className = "" }: Props) {
  const rotation = open ? ROTATION.up : ROTATION[direction];
  const classes = ["ui-chevron", className].filter(Boolean).join(" ");
  return (
    <svg
      className={classes}
      viewBox="0 0 10 6"
      width="10"
      height="6"
      aria-hidden
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path d="M0 0.5 L5 5.5 L10 0.5 Z" fill="currentColor" />
    </svg>
  );
}
