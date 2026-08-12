import { useCallback, useEffect, useRef, useState } from "react";
import { CDN, LOADER_CLIP, SCENES, TRANSITIONS } from "./data";

const TOTAL = SCENES.length;

function SplitTitle({ text, active }: { text: string; active: boolean }) {
  return (
    <h2 className="lut-title" aria-label={text}>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className="lut-char"
          style={{
            transitionDelay: `${(active ? 220 : 0) + i * 26}ms`,
            opacity: active ? 1 : 0,
            transform: active
              ? "translateY(0) rotateX(0deg)"
              : "translateY(0.7em) rotateX(-70deg)",
          }}
        >
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </h2>
  );
}

export default function SceneExperience() {
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [wiping, setWiping] = useState(false);
  const [sound, setSound] = useState(false);
  const [sent, setSent] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const currentRef = useRef(0);
  const animating = useRef(false);
  const lockUntil = useRef(0);
  const transitionVideo = useRef<HTMLVideoElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const contactScroll = useRef<HTMLDivElement>(null);

  currentRef.current = current;

  /* ---------- preloader: load 24 HD frames, progress tracks real loads ---------- */
  useEffect(() => {
    let cancelled = false;
    let loaded = 0;
    let finished = false;
    const total = HD_IMAGES.length;

    const bump = (src: string) => {
      if (cancelled) return;
      loaded += 1;
      setProgress((loaded / total) * 100);
      setLoadedShot(src);
      if (loaded >= total) finish();
    };

    HD_IMAGES.forEach((src) => {
      const img = new Image();
      img.onload = () => bump(src);
      img.onerror = () => bump(src);
      img.src = src;
    });

    // hard ceiling so a slow network never traps the loader
    const guard = window.setTimeout(() => {
      if (!cancelled) {
        setProgress(100);
        finish();
      }
    }, 9000);

    const finish = () => {
      if (finished || cancelled) return;
      finished = true;
      window.clearTimeout(guard);
      const v = transitionVideo.current;
      const done = () => {
        setWiping(false);
        setLoading(false);
      };
      if (!v) return done();
      v.src = LOADER_CLIP;
      setWiping(true);
      v.currentTime = 0;
      v.addEventListener("ended", done, { once: true });
      v.play().catch(done);
      window.setTimeout(done, 2400);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ---------- navigation ---------- */
  const goTo = useCallback((rawIndex: number) => {
    const index = Math.max(0, Math.min(TOTAL - 1, rawIndex));
    const from = currentRef.current;
    if (index === from || animating.current) return;
    animating.current = true;

    const clip = TRANSITIONS[`${from}-${index}`];
    const v = transitionVideo.current;

    const settle = () => {
      setCurrent(index);
      currentRef.current = index;
      setWiping(false);
      lockUntil.current = Date.now() + 220;
      animating.current = false;
    };

    if (clip && v) {
      v.src = CDN + clip;
      setWiping(true);
      v.currentTime = 0;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        settle();
      };
      v.addEventListener("ended", finish, { once: true });
      v.play().catch(finish);
      window.setTimeout(finish, 2400);
    } else {
      setWiping(false);
      lockUntil.current = Date.now() + 900;
      setCurrent(index);
      currentRef.current = index;
      window.setTimeout(() => {
        animating.current = false;
      }, 900);
    }
  }, []);

  /* ---------- wheel / touch / keys ---------- */
  useEffect(() => {
    if (loading) return;

    const onWheel = (e: WheelEvent) => {
      const box = contactScroll.current;
      if (box && currentRef.current === TOTAL - 1) {
        const atTop = box.scrollTop <= 0;
        const atBottom =
          Math.ceil(box.scrollTop + box.clientHeight) >= box.scrollHeight;
        if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
      }
      e.preventDefault();
      if (Date.now() < lockUntil.current || animating.current) return;
      if (Math.abs(e.deltaY) < 6) return;
      goTo(currentRef.current + (e.deltaY > 0 ? 1 : -1));
    };

    let touchY: number | null = null;
    const onStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onEnd = (e: TouchEvent) => {
      if (touchY === null) return;
      const dy = touchY - (e.changedTouches[0]?.clientY ?? touchY);
      if (Math.abs(dy) > 60 && Date.now() >= lockUntil.current && !animating.current) {
        goTo(currentRef.current + (dy > 0 ? 1 : -1));
      }
      touchY = null;
    };

    const onKey = (e: KeyboardEvent) => {
      if (Date.now() < lockUntil.current || animating.current) return;
      if (e.key === "ArrowDown" || e.key === "PageDown") goTo(currentRef.current + 1);
      if (e.key === "ArrowUp" || e.key === "PageUp") goTo(currentRef.current - 1);
      if (e.key === "Home") goTo(0);
      if (e.key === "End") goTo(TOTAL - 1);
    };

    const onMove = (e: MouseEvent) => {
      setTilt({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMove);
    };
  }, [goTo, loading]);

  /* ---------- sound ---------- */
  useEffect(() => {
    const a = audio.current;
    if (!a) return;
    if (sound) a.play().catch(() => {});
    else a.pause();
  }, [sound]);

  const parallax = (depth: number) =>
    ({
      transform: `translate3d(${-tilt.x * depth}px, ${-tilt.y * depth}px, 0) scale(1.06)`,
    }) as const;

  return (
    <div className="lut-root">
      {/* preloader */}
      <div className={`lut-preloader${loading ? "" : " is-gone"}`} aria-hidden={!loading}>
        <video
          className="lut-media"
          src={CDN + "Homepage_loop.mp4"}
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="lut-scrim" />
        <div className="lut-preloader-inner">
          <div className="lut-wordmark">
            {"LUT".split("").map((c, i) => (
              <span key={i} style={{ animationDelay: `${i * 120}ms` }}>
                {c}
              </span>
            ))}
          </div>
          <div className="lut-bar">
            <div className="lut-bar-fill" style={{ width: `${progress}%` }} />
            <span className="lut-bar-label">
              {String(Math.round(progress)).padStart(3, "0")} — Loading
            </span>
          </div>
        </div>
      </div>

      {/* connecting clip layer */}
      <video
        ref={transitionVideo}
        className={`lut-transition${wiping ? " is-playing" : ""}`}
        muted
        playsInline
        preload="auto"
      />

      {/* scenes */}
      <main className="lut-stage">
        {SCENES.map((scene, i) => {
          const active = i === current && !loading;
          return (
            <section
              key={i}
              className={`lut-scene${active ? " is-active" : ""}`}
              aria-hidden={!active}
            >
              <div className="lut-media-wrap" style={parallax(14)}>
                {scene.kind === "video" ? (
                  <video
                    className="lut-media"
                    src={scene.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                  />
                ) : (
                  <img
                    className={`lut-media${scene.contain ? " is-contain" : ""}`}
                    src={scene.src}
                    alt={scene.title ?? scene.label}
                    loading={i < 3 ? "eager" : "lazy"}
                  />
                )}
              </div>
              <div className="lut-vignette" />

              {i === 0 && (
                <div className="lut-overlay lut-home">
                  <h1 className="lut-logo">
                    LUT<span>STUDIOS</span>
                  </h1>
                  <nav className="lut-home-nav">
                    {[
                      [1, "Showreel"],
                      [2, "About"],
                      [8, "Cases"],
                      [9, "Contact"],
                    ].map(([idx, label]) => (
                      <button
                        key={label as string}
                        onClick={() => goTo(idx as number)}
                        style={{ transitionDelay: `${(idx as number) * 40}ms` }}
                      >
                        <span>{label as string}</span>
                      </button>
                    ))}
                  </nav>
                  <div className="lut-hint">
                    <span className="lut-hint-line" />
                    scroll to discover
                  </div>
                </div>
              )}

              {scene.title && (
                <div className="lut-overlay lut-copy" style={parallax(-26)}>
                  <p className="lut-eyebrow">{scene.eyebrow}</p>
                  <SplitTitle text={scene.title} active={active} />
                  <p className="lut-body">{scene.body}</p>
                </div>
              )}

              {i === TOTAL - 1 && (
                <div className="lut-overlay lut-contact" ref={contactScroll}>
                  <div className="lut-contact-inner">
                    <h2 className="lut-ready">READY?</h2>
                    <div className="lut-glass">
                      <h3>Contact</h3>
                      <p>
                        To discuss a project or partnership, write to{" "}
                        <a href="mailto:info@lutstudios.com">info@lutstudios.com</a>.
                      </p>
                    </div>
                    <form
                      className="lut-glass lut-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        setSent(true);
                      }}
                    >
                      <div className="lut-row">
                        <label>
                          <span>Email</span>
                          <input type="email" name="email" required />
                        </label>
                        <label>
                          <span>Phone</span>
                          <input type="tel" name="phone" required />
                        </label>
                      </div>
                      <label>
                        <span>Name</span>
                        <input type="text" name="name" required />
                      </label>
                      <label>
                        <span>Message</span>
                        <textarea name="message" rows={3} required />
                      </label>
                      <button className="lut-btn" type="submit">
                        Send message
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </main>

      {/* chrome */}
      <div className={`lut-chrome${loading ? " is-hidden" : ""}`}>
        <button
          className={`lut-sound${sound ? " is-on" : ""}`}
          onClick={() => setSound((s) => !s)}
          aria-label="Toggle ambient sound"
        >
          <span />
          <span />
          <span />
          <span />
        </button>
        <nav className="lut-dots" aria-label="Scene navigation">
          {SCENES.map((s, i) => (
            <button
              key={i}
              className={`lut-dot${i === current ? " is-active" : ""}`}
              onClick={() => goTo(i)}
              aria-label={s.label}
            >
              <em>{s.label}</em>
            </button>
          ))}
        </nav>
        <div className="lut-counter">
          <strong>{String(current + 1).padStart(2, "0")}</strong>
          <i />
          {String(TOTAL).padStart(2, "0")}
        </div>
      </div>

      <div className={`lut-toast${sent ? " is-open" : ""}`}>
        <div>
          <p>Message sent</p>
          <span>Thank you — we&apos;ll be in touch shortly.</span>
        </div>
        <button onClick={() => setSent(false)}>Close</button>
      </div>

      <audio
        ref={audio}
        loop
        preload="none"
        src="https://assets.lutstudios.com/Jesse%20Gillis%20-%20Time%20to%20Meditate%20-%20Soothing%20Eternal%20Synth%20Pads%20Soft%20High%20Bells.wav"
      />
      <div className="lut-grain" />
    </div>
  );
}
