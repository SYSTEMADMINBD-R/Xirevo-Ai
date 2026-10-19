import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

/** The equation printed under the plot. */
export const HEART_EQUATION = "(x² + y² − 1)³ − x²y³ = 0";

/** True for `/graph` (with or without anything after it). */
export function isGraphCommand(text: string) {
  return /^\/graph\b/i.test(text.trim());
}

/**
 * Classic heart curve, sampled parametrically:
 *   x = 16 sin³t
 *   y = 13 cos t − 5 cos 2t − 2 cos 3t − cos 4t
 * It traces the same heart-shaped outline as the implicit equation above.
 * The result is an SVG path inside a 200×200 viewBox.
 */
function heartPath(steps = 260) {
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const x = 16 * Math.sin(t) ** 3;
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    points.push(`${(100 + x * 4).toFixed(2)},${(90 - y * 4).toFixed(2)}`);
  }
  return `M ${points.join(" L ")} Z`;
}

const HEART_D = heartPath();

/** Floating sparks around the curve (deterministic, so no re-render jitter). */
const SPARKS = [
  { x: 18, y: 24, size: 3, delay: 0, duration: 4.2 },
  { x: 78, y: 12, size: 2, delay: 0.9, duration: 5.1 },
  { x: 88, y: 46, size: 4, delay: 1.7, duration: 4.6 },
  { x: 12, y: 62, size: 2, delay: 2.4, duration: 5.6 },
  { x: 52, y: 88, size: 3, delay: 0.4, duration: 4.9 },
  { x: 30, y: 40, size: 2, delay: 1.2, duration: 5.4 },
  { x: 66, y: 74, size: 2, delay: 2.9, duration: 4.3 },
];

export function HeartGraphDialog({
  open,
  onOpenChange,
  equation = HEART_EQUATION,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The equation text to print (the user's, when they typed one). */
  equation?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-[calc(100%-1.5rem)] overflow-y-auto border-rose-400/25 bg-[#0a0c11] p-0 sm:max-w-md">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 110%, rgba(255,77,126,0.22) 0%, rgba(255,77,126,0.06) 45%, transparent 72%)",
          }}
        />

        <DialogHeader className="relative px-5 pt-5 pb-0 sm:px-6 sm:pt-6">
          <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-rose-300/80">
            <Heart className="size-3 fill-current" />
            Love Protocol · /graph
          </span>
          <DialogTitle className="mt-1.5 text-[17px] font-semibold tracking-tight text-foreground sm:text-lg">
            One curve. One heart.
          </DialogTitle>
          <DialogDescription className="break-words font-mono text-[11.5px] leading-5 text-rose-100/60 sm:text-xs">
            {equation}
          </DialogDescription>
        </DialogHeader>

        {/* ---------- Plot ---------- */}
        <div className="relative mx-4 mt-3 aspect-square w-[calc(100%-2rem)] overflow-hidden rounded-2xl border border-rose-300/15 bg-[#0c0f16] sm:mx-5 sm:w-[calc(100%-2.5rem)]">
          {/* graph paper */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize: "10% 10%",
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 55% at 50% 52%, rgba(255,77,126,0.18) 0%, transparent 70%)",
            }}
          />
          <svg
            viewBox="0 0 200 200"
            className="relative size-full"
            role="img"
            aria-label={`Plot of ${equation}`}
          >
            <defs>
              <linearGradient id="heart-stroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffd0e2" />
                <stop offset="45%" stopColor="#ff5c8a" />
                <stop offset="100%" stopColor="#ff2d55" />
              </linearGradient>
              <radialGradient id="heart-fill" cx="50%" cy="55%" r="60%">
                <stop offset="0%" stopColor="#ff5c8a" stopOpacity="0.35" />
                <stop offset="70%" stopColor="#ff2d55" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#ff2d55" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* axes */}
            <line
              x1="0"
              y1="100"
              x2="200"
              y2="100"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="0.6"
            />
            <line
              x1="100"
              y1="0"
              x2="100"
              y2="200"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth="0.6"
            />
            <text x="193" y="96" fill="rgba(255,255,255,0.3)" fontSize="6">
              x
            </text>
            <text x="104" y="8" fill="rgba(255,255,255,0.3)" fontSize="6">
              y
            </text>

            {/* fill blooms in once the outline is traced */}
            <motion.path
              d={HEART_D}
              fill="url(#heart-fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.7, duration: 1.1, ease: "easeOut" }}
            />

            {/* soft glow under the stroke */}
            <motion.path
              d={HEART_D}
              fill="none"
              stroke="#ff4d7e"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "blur(5px)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.55 }}
              transition={{ delay: 1.5, duration: 0.9 }}
            />

            {/* the curve draws itself */}
            <motion.path
              d={HEART_D}
              fill="none"
              stroke="url(#heart-stroke)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2.1, ease: "easeInOut" }}
              style={{ filter: "drop-shadow(0 0 6px rgba(255,92,138,0.55))" }}
            />

            {/* the tip of the heart beats forever */}
            <motion.circle
              cx="100"
              cy="158"
              r="2.6"
              fill="#ffd9e5"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0.45, 1] }}
              transition={{
                delay: 2.1,
                duration: 1.6,
                repeat: Infinity,
                repeatDelay: 0.6,
              }}
              style={{ filter: "drop-shadow(0 0 6px rgba(255,180,205,0.9))" }}
            />
          </svg>

          {/* floating sparks */}
          {SPARKS.map((spark, i) => (
            <motion.span
              key={i}
              aria-hidden
              className="absolute rounded-full bg-rose-200"
              style={{
                left: `${spark.x}%`,
                top: `${spark.y}%`,
                width: spark.size,
                height: spark.size,
                boxShadow: "0 0 10px rgba(255,150,190,0.85)",
              }}
              initial={{ opacity: 0, y: 6, scale: 0.4 }}
              animate={{ opacity: [0, 0.9, 0], y: [6, -14], scale: [0.4, 1, 0.6] }}
              transition={{
                delay: 2 + spark.delay,
                duration: spark.duration,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.div
          className="relative px-5 pt-4 pb-5 sm:px-6 sm:pb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <p className="text-[13px] leading-6 text-foreground/85">
            Every point on this curve spells the same name —{" "}
            <span className="font-semibold text-rose-300">Romoni</span>.
          </p>
          <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground/70">
            Every value of t traces this heart. Type{" "}
            <span className="rounded bg-white/10 px-1 py-0.5 font-mono text-[10.5px] text-rose-100/80">
              /graph
            </span>{" "}
            anytime · Esc to close
          </p>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
