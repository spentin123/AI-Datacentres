interface Props {
  size?: number;
  thickness?: number;
  color?: string;
  inset?: number;
  className?: string;
}

export function CornerBrackets({
  size = 14,
  thickness = 1,
  color = "var(--cyan)",
  inset = 0,
  className = "",
}: Props) {
  const s = size;
  const t = thickness;
  const positions = [
    { top: inset, left: inset, path: `M0 ${s} V0 H${s}` },
    { top: inset, right: inset, path: `M${s * 2} ${s} V0 H${s}` },
    { bottom: inset, left: inset, path: `M0 0 V${s} H${s}` },
    { bottom: inset, right: inset, path: `M${s * 2} 0 V${s} H${s}` },
  ];
  return (
    <>
      {positions.map((p, i) => (
        <svg
          key={i}
          width={s * 2}
          height={s}
          viewBox={`0 0 ${s * 2} ${s}`}
          className={`absolute pointer-events-none bracket-snap ${className}`}
          style={{
            top: p.top,
            bottom: p.bottom,
            left: p.left,
            right: p.right,
            overflow: "visible",
          }}
        >
          <path
            d={p.path}
            fill="none"
            stroke={color}
            strokeWidth={t}
            strokeLinecap="square"
          />
        </svg>
      ))}
    </>
  );
}
