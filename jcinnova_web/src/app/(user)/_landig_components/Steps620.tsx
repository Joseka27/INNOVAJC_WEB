"use client";

import { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import "./Steps620.css";

type Step = {
  title: string;
  text: string;
  icon: string;
  iconHover: string;
};

export default function StepsInfiniteCarouselMobile({
  seceSteps,
}: {
  seceSteps: Step[];
}) {
  const shellRef = useRef<HTMLDivElement | null>(null);

  const loopSteps = useMemo(() => {
    if (!seceSteps?.length) return [];
    return [...seceSteps, ...seceSteps, ...seceSteps];
  }, [seceSteps]);

  const getOneSetWidth = () => {
    const el = shellRef.current;
    if (!el || seceSteps.length === 0) return 0;
    return el.scrollWidth / 3;
  };

  const jumpToMiddle = (behavior: ScrollBehavior = "auto") => {
    const el = shellRef.current;
    if (!el) return;
    const one = getOneSetWidth();
    if (!one) return;
    el.scrollTo({ left: one, behavior });
  };

  useEffect(() => {
    jumpToMiddle("auto");

    const el = shellRef.current;
    if (!el || seceSteps.length === 0) return;

    let raf = 0;
    let isInteracting = false;

    const disableSnapOnceAndJump = (newLeft: number) => {
      const prevSnap = el.style.scrollSnapType;
      el.style.scrollSnapType = "none";
      el.scrollLeft = newLeft;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.scrollSnapType = prevSnap || "";
        });
      });
    };

    const onPointerDown = () => {
      isInteracting = true;
    };
    const onPointerUp = () => {
      isInteracting = false;
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (isInteracting) return;

        const one = getOneSetWidth();
        if (!one) return;

        const x = el.scrollLeft;

        const leftEdge = one * 0.35;
        const rightEdge = one * 1.65;

        if (x < leftEdge) {
          disableSnapOnceAndJump(x + one);
        } else if (x > rightEdge) {
          disableSnapOnceAndJump(x - one);
        }
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });
    window.addEventListener("pointercancel", onPointerUp, { passive: true });

    const onResize = () => jumpToMiddle("auto");
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("resize", onResize);
    };
  }, [seceSteps.length]);

  if (!seceSteps?.length) return null;

  return (
    <div className="m620_stepsLoopWrap">
      <div className="m620_stepsLoopShell" ref={shellRef}>
        <div className="m620_stepsLoopTrack">
          {loopSteps.map((s, idx) => (
            <article
              key={`${s.title}-${idx}`}
              className="m620_stepCard"
              aria-label={`Paso: ${s.title}`}
            >
              <div className="m620_stepIcon" aria-hidden>
                <div className="m620_iconSwap">
                  <Image
                    src={s.icon}
                    alt=""
                    width={34}
                    height={34}
                    className="m620_iconImg m620_iconDefault"
                    priority={idx < seceSteps.length}
                  />
                  <Image
                    src={s.iconHover}
                    alt=""
                    width={34}
                    height={34}
                    className="m620_iconImg m620_iconHover"
                    priority={idx < seceSteps.length}
                  />
                </div>
              </div>

              <div className="m620_stepBody">
                <h3 className="m620_stepTitle">{s.title}</h3>
                <p className="m620_stepText">{s.text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
