import { useCallback, useEffect, useRef, useState } from "react";
import { CASE_ITEMS, CDN, LOADER_CLIP, LOADING_TEXTS, SCENES, TRANSITIONS } from "./data";
import { HD_IMAGES, pick } from "./images";

const TOTAL = SCENES.length;
const CASES_INDEX = SCENES.findIndex((s) => s.label === "Cases");

/**
 * Swap a <video>'s source and play it, resolving `onDone` once it has
 * actually finished (or a safe fallback timeout based on its real
 * duration elapses). Using the real duration — instead of a fixed
 * guess — is what stops long clips like "loading_to_homepage.mp4" or
 * "Homepage_aboutstart.mp4" from being cut off / skipped.
 */
function playClip(video: HTMLVideoElement, src: string, onDone: () => void) {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    onDone();
  };

  const armFallback = () => {
    const d = video.duration;
    const ms = Number.isFinite(d) && d > 0 ? d * 1000 + 260 : 3200;
    window.setTimeout(finish, ms);
  };

  try {
    video.pause();
  } catch {
    /* noop */
  }

  if (video.src !== src) {
    video.src = src;
    video.load();
  }
  video.currentTime = 0;

  if (video.readyState >= 1) {
    armFallback();
  } else {
    video.addEventListener("loadedmetadata", armFallback, { once: true });
  }
  video.addEventListener("ended", finish, { once: true });
  video.play().catch(finish);
}

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
  const [dir, setDir] = useState(1);
  const [progress, setProgress] = useState(0);
  const [bgIndex, setBgIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
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
  const casesScroll = useRef<HTMLDivElement>(null);
  const casesHead = useRef<HTMLDivElement>(null);

  currentRef.current = current;

  /* ---------- background preload: prime the browser cache for every
     clip up front so scene transitions never have to skip / stall
     waiting on the network. ---------- */
  useEffect(() => {
    const urls = new Set<string>();
    urls.add(LOADER_CLIP);
    Object.values(TRANSITIONS).forEach((f) => urls.add(CDN + f));
    SCENES.forEach((s) => {
      if (s.kind === "video") urls.add(s.src);
    });

    const nodes: HTMLVideoElement[] = [];
    urls.forEach((url) => {
      const v = document.createElement("video");
      v.preload = "auto";
      v.muted = true;
      v.playsInline = true;
      v.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;";
      v.src = url;
      document.body.appendChild(v);
      nodes.push(v);
    });

    return () => nodes.forEach((v) => v.remove());
  }, []);

  /* ---------- preloader: bar fill + cycling frames/text, then a
     clean, un-skippable play of loading_to_homepage.mp4 ---------- */
  useEffect(() => {
    let cancelled = false;
    let finished = false;

    const start = Date.now();
    const duration = 4000;
    let tick = 0;

    const cycle = window.setInterval(() => {
      if (cancelled) return;
      tick += 1;
      setBgIndex(tick % HD_IMAGES.length);
      setTextIndex(tick % LOADING_TEXTS.length);
    }, 500);

    const progressTimer = window.setInterval(() => {
      if (cancelled) return;
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(progressTimer);
        window.clearInterval(cycle);
        setTextIndex(LOADING_TEXTS.length - 1);
        finish();
      }
    }, 30);

    const finish = () => {
      if (finished || cancelled) return;
      finished = true;
      const v = transitionVideo.current;
      const done = () => {
        setWiping(false);
        setLoading(false);
      };
      if (!v) return done();
      setWiping(true);
      playClip(v, LOADER_CLIP, done);
    };

    return () => {
      cancelled = true;
      window.clearInterval(cycle);
      window.clearInterval(progressTimer);
    };
  }, []);

  /* ---------- navigation ---------- */
  const goTo = useCallback((rawIndex: number) => {
    const index = Math.max(0, Math.min(TOTAL - 1, rawIndex));
    const from = currentRef.current;
    if (index === from || animating.current) return;
    setDir(index > from ? 1 : -1);
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
      setWiping(true);
      playClip(v, CDN + clip, settle);
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
      const idx = currentRef.current;

      if (idx === TOTAL - 1 || idx === CASES_INDEX) {
        const box = idx === TOTAL - 1 ? contactScroll.current : casesScroll.current;
        if (box) {
          const atTop = box.scrollTop <= 0;
          const atBottom =
            Math.ceil(box.scrollTop + box.clientHeight) >= box.scrollHeight;
          if ((e.deltaY < 0 && !atTop) || (e.deltaY > 0 && !atBottom)) return;
        }
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

  /* ---------- cases: gentle auto-scroll through the grid ---------- */
  useEffect(() => {
    const active = current === CASES_INDEX && !loading;
    const box = casesScroll.current;
    if (!active || !box) return;

    let raf = 0;
    let paused = false;
    let resumeTimer = 0;

    const step = () => {
      if (!paused && box) {
        const max = box.scrollHeight - box.clientHeight;
        if (box.scrollTop < max - 1) {
          box.scrollTop += 0.6;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const pauseForAWhile = () => {
      paused = true;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        paused = false;
      }, 2600);
    };
    box.addEventListener("wheel", pauseForAWhile, { passive: true });
    box.addEventListener("touchstart", pauseForAWhile, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resumeTimer);
      box.removeEventListener("wheel", pauseForAWhile);
      box.removeEventListener("touchstart", pauseForAWhile);
    };
  }, [current, loading]);

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
        {HD_IMAGES.slice(0, 8).map((src, i) => (
          <img
            key={src}
            className={`lut-media lut-preloader-frame${i === bgIndex ? " is-active" : ""}`}
            src={src}
            alt=""
            aria-hidden="true"
          />
        ))}
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
            <span className="lut-bar-label" key={textIndex}>
              {String(Math.round(progress)).padStart(3, "0")}% — {LOADING_TEXTS[textIndex]}
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
              className={`lut-scene${active ? " is-active" : ""}${
                i === CASES_INDEX ? ` lut-cases-scene ${dir > 0 ? "enter-right" : "enter-left"}` : ""
              }`}
              aria-hidden={!active}
            >
              <div className="lut-media-wrap" style={parallax(14)}>
                {i === CASES_INDEX ? null : scene.kind === "video" ? (
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
              {i !== CASES_INDEX && <div className="lut-vignette" />}

              {i === 0 && (
                <div className="lut-overlay lut-home">
                  <h1 className="lut-logo">
                    LUT<span>STUDIOS</span>
                  </h1>
                  <nav className="lut-home-nav">
                    {[
                      [1, "About"],
                      [7, "Cases"],
                      [8, "Contact"],
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
                  <SplitTitle text={scene.title} active={active} />
                  <p className="lut-body">{scene.body}</p>
                </div>
              )}

              {i === CASES_INDEX && (
                <div
                  className="lut-overlay lut-gallery"
                  aria-hidden={!active}
                  ref={casesScroll}
                  onScroll={(e) => {
                    const el = casesHead.current;
                    if (!el) return;
                    const y = e.currentTarget.scrollTop;
                    const p = Math.min(1, y / 260);
                    el.style.transform = `translateY(${-p * 70}px)`;
                    el.style.opacity = String(1 - p);
                  }}
                >
                  <div className={`lut-cases-head${active ? " is-in" : ""}`} ref={casesHead}>
                    <h2 className="lut-cases-title">CASES</h2>
                    <p className="lut-cases-desc">
                      Our portfolio features a blend of client collaborations and our own
                      creative explorations. Each project, whether commercial or personal,
                      reflects our passion for visual storytelling and experimentation.
                    </p>
                  </div>
                  <div className="lut-cases-grid">
                    {pick(12, 0).map((src, k) => {
                      const item = CASE_ITEMS[k % CASE_ITEMS.length]!;
                      return (
                        <figure key={k} className="lut-case-card">
                          <div className="lut-tv-screen">
                            <img
                              src={src}
                              alt={item.title}
                              loading="lazy"
                              style={{ ["--i" as string]: k % 5 }}
                            />
                            <figcaption className="lut-case-info">
                              <span className="lut-case-title">{item.title}</span>
                              <span className="lut-case-tag">{item.tag}</span>
                            </figcaption>
                          </div>
                        </figure>
                      );
                    })}
                  </div>
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