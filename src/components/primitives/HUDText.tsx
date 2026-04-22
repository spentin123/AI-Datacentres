import { useEffect, useState } from "react";

interface TypewriterProps {
  text: string;
  speed?: number;
  startDelay?: number;
  onDone?: () => void;
  showCaret?: boolean;
  className?: string;
}

export function Typewriter({
  text,
  speed = 22,
  startDelay = 0,
  onDone,
  showCaret = true,
  className = "",
}: TypewriterProps) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setOut("");
    setDone(false);
    let i = 0;
    let tmo: ReturnType<typeof setTimeout>;
    const start = setTimeout(() => {
      const tick = () => {
        i++;
        setOut(text.slice(0, i));
        if (i >= text.length) {
          setDone(true);
          onDone?.();
          return;
        }
        tmo = setTimeout(tick, speed);
      };
      tick();
    }, startDelay);
    return () => {
      clearTimeout(start);
      clearTimeout(tmo);
    };
  }, [text, speed, startDelay, onDone]);

  return (
    <span className={className}>
      {out}
      {showCaret && !done && <span className="caret" />}
    </span>
  );
}
