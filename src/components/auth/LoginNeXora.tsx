import { type FormEvent, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { API_BASE_URL } from "@/config/api";
import {
  clearSavedLogin,
  getRememberLoginPreference,
  getSavedLogin,
  setAuthToken,
  setRememberLoginPreference,
  setSavedLogin,
} from "@/config/auth";

export interface LoginNeXoraProps {
  brandName?: string;
  accent?: string;
  accent2?: string;
  reduceMotion?: boolean;
  email: string;
  password: string;
  remember: boolean;
  showPassword: boolean;
  errorMessage?: string;
  isLoading?: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRememberChange: (value: boolean) => void;
  onShowPasswordToggle: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const LOGO_URL = `${import.meta.env.BASE_URL}logo.png`;

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
@keyframes nx-rise{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}
@keyframes nx-floatA{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
@keyframes nx-floatB{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes nx-floatC{0%,100%{transform:translateY(0)}50%{transform:translateY(-19px)}}
@keyframes nx-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes nx-draw{from{stroke-dashoffset:640}to{stroke-dashoffset:0}}
@keyframes nx-donut{from{stroke-dashoffset:264}to{stroke-dashoffset:79}}
@keyframes nx-cardin{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes nx-blink{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes nx-orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
@keyframes nx-orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,40px)}}
.nx-root ::placeholder{color:rgba(198,188,224,.42)}
.nx-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklch,var(--accent) 26%,transparent)}
.nx-submit:hover:not(:disabled){filter:brightness(1.08)}
.nx-submit:disabled{opacity:.72;cursor:not-allowed}
.nx-link:hover{color:#fff!important}
`;

const glass: React.CSSProperties = {
  borderRadius: 16,
  background: "rgba(23,15,40,.72)",
  border: "1px solid rgba(255,255,255,.09)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  boxShadow: "0 24px 50px -18px rgba(0,0,0,.7)",
};

const barBase: React.CSSProperties = {
  flex: 1,
  borderRadius: "5px 5px 0 0",
  transformOrigin: "bottom",
};

export function LoginNeXora({
  brandName = "NeXora",
  accent = "#8b5cf6",
  accent2 = "#ec4899",
  reduceMotion = false,
  email,
  password,
  remember,
  showPassword,
  errorMessage,
  isLoading = false,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onShowPasswordToggle,
  onSubmit,
}: LoginNeXoraProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const fatRef = useRef<HTMLDivElement>(null);
  const convRef = useRef<HTMLDivElement>(null);

  const animState = reduceMotion ? "paused" : "running";

  useEffect(() => {
    let raf = 0;
    const dur = 1500;
    const t0 = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = ease(p);
      if (fatRef.current) fatRef.current.textContent = "R$ " + Math.round(431 * e) + "K";
      if (convRef.current) convRef.current.textContent = (18.4 * e).toFixed(1).replace(".", ",") + "%";
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let onMove: ((ev: MouseEvent) => void) | null = null;
    if (!reduceMotion) {
      onMove = (ev: MouseEvent) => {
        const el = rootRef.current;
        const layer = floatRef.current;
        if (!el || !layer) return;
        const r = el.getBoundingClientRect();
        const dx = (ev.clientX - r.left) / r.width - 0.5;
        const dy = (ev.clientY - r.top) / r.height - 0.5;
        layer.style.transform = `translate(${dx * -22}px, ${dy * -16}px)`;
      };
      window.addEventListener("mousemove", onMove);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (onMove) window.removeEventListener("mousemove", onMove);
    };
  }, [reduceMotion]);

  const rootStyle = {
    position: "relative",
    minHeight: "100vh",
    width: "100%",
    overflow: "hidden",
    background: "radial-gradient(130% 100% at 82% 8%, #1a1030 0%, #0e0920 42%, #0b0714 100%)",
    color: "#f4f1fb",
    fontFamily: "'Manrope',system-ui,sans-serif",
    WebkitFontSmoothing: "antialiased",
    ["--accent" as string]: accent,
    ["--accent2" as string]: accent2,
    ["--anim" as string]: animState,
  } as React.CSSProperties;

  return (
    <div ref={rootRef} className="nx-root" style={rootStyle}>
      <style>{GLOBAL_CSS}</style>

      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 78% 20%, color-mix(in oklch, var(--accent) 32%, transparent) 0%, transparent 40%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "-14%", right: "-6%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklch, var(--accent) 55%, transparent) 0%, transparent 68%)", filter: "blur(30px)", opacity: 0.5, animation: "nx-orb1 16s ease-in-out infinite", animationPlayState: "var(--anim)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-16%", left: "26%", width: 460, height: 460, borderRadius: "50%", background: "radial-gradient(circle, color-mix(in oklch, var(--accent2) 45%, transparent) 0%, transparent 68%)", filter: "blur(38px)", opacity: 0.32, animation: "nx-orb2 19s ease-in-out infinite", animationPlayState: "var(--anim)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)", backgroundSize: "52px 52px", maskImage: "radial-gradient(120% 90% at 60% 30%, #000 0%, transparent 78%)", WebkitMaskImage: "radial-gradient(120% 90% at 60% 30%, #000 0%, transparent 78%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(140% 120% at 50% 120%, transparent 55%, rgba(6,3,14,.7) 100%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 56px 0" }}>
        <img
          src={LOGO_URL}
          alt={brandName}
          style={{ height: 40, width: "auto", maxWidth: "min(220px, 42vw)", objectFit: "contain", display: "block" }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 24, padding: "0 56px", minHeight: "calc(100vh - 92px)", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 440px", maxWidth: 560, padding: "40px 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "7px 14px", borderRadius: 999, border: "1px solid color-mix(in oklch, var(--accent) 42%, transparent)", background: "color-mix(in oklch, var(--accent) 12%, transparent)", fontSize: 12, letterSpacing: ".16em", fontWeight: 600, color: "color-mix(in oklch, var(--accent) 40%, #fff)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent2)", boxShadow: "0 0 10px var(--accent2)", animation: "nx-blink 2.4s ease-in-out infinite", animationPlayState: "var(--anim)" }} />
            AGENTES DE IA · BUSINESS INTELLIGENCE
          </div>

          <h1 style={{ fontFamily: "'Sora'", fontWeight: 800, fontSize: "clamp(38px,4.4vw,64px)", lineHeight: 1.04, letterSpacing: "-.025em", margin: "26px 0 0" }}>
            Você pergunta.
            <span
              style={{
                display: "block",
                background: "linear-gradient(100deg, var(--accent) 0%, var(--accent2) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              A IA constrói o BI.
            </span>
          </h1>

          <p style={{ fontSize: 17.5, lineHeight: 1.62, color: "rgba(214,205,236,.72)", margin: "22px 0 0", maxWidth: 470 }}>
            Agentes de IA transformam sua pergunta em painéis, cruzam os indicadores e explicam a decisão — na primeira tela, sem complexidade de enterprise.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 26px", marginTop: 30 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, color: "rgba(214,205,236,.82)" }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", background: "color-mix(in oklch, var(--accent) 18%, transparent)", color: "#5eead4", fontSize: 13 }}>✓</span>
              Painéis prontos em minutos
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 14.5, color: "rgba(214,205,236,.82)" }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, display: "grid", placeItems: "center", background: "color-mix(in oklch, var(--accent) 18%, transparent)", color: "#5eead4", fontSize: 13 }}>✓</span>
              IA que explica cada número
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 38 }}>
            <div style={{ display: "flex" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #14092a", background: "linear-gradient(135deg,#7c6cf0,#c026d3)" }} />
              <div style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #14092a", background: "linear-gradient(135deg,#22d3ee,#7c6cf0)", marginLeft: -11 }} />
              <div style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid #14092a", background: "linear-gradient(135deg,#f59e0b,#ec4899)", marginLeft: -11 }} />
            </div>
            <span style={{ fontSize: 13.5, color: "rgba(214,205,236,.6)", lineHeight: 1.4 }}>
              Mais de 2.400 times de dados<br />já decidem com a {brandName}
            </span>
          </div>
        </div>

        <div style={{ flex: "1 1 560px", position: "relative", minHeight: 660, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div ref={floatRef} style={{ position: "absolute", inset: 0, transition: "transform .25s ease-out", pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: "2%", right: "-2%", width: 296, animation: "nx-rise .7s cubic-bezier(.2,.7,.3,1) .05s both" }}>
              <div style={{ animation: "nx-floatA 7.5s ease-in-out infinite", animationPlayState: "var(--anim)", animationDelay: ".7s" }}>
                <div style={{ ...glass, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".12em", color: "rgba(198,188,224,.55)", fontWeight: 600 }}>FATURAMENTO</div>
                    <div ref={fatRef} style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 22, marginTop: 5 }}>R$ 0K</div>
                    <div style={{ fontSize: 11.5, color: "#34d399", marginTop: 3 }}>▲ 12%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".12em", color: "rgba(198,188,224,.55)", fontWeight: 600 }}>CONVERSÃO</div>
                    <div ref={convRef} style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 22, marginTop: 5 }}>0,0%</div>
                    <div style={{ fontSize: 11.5, color: "#34d399", marginTop: 3 }}>▲ 2,1%</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", top: "-1%", left: "-4%", width: 250, animation: "nx-rise .7s cubic-bezier(.2,.7,.3,1) .18s both" }}>
              <div style={{ animation: "nx-floatC 8.5s ease-in-out infinite", animationPlayState: "var(--anim)", animationDelay: ".85s" }}>
                <div style={{ ...glass, padding: "15px 15px 6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(232,226,246,.9)" }}>Receita mensal</span>
                    <span style={{ fontSize: 11, color: "#34d399" }}>+18%</span>
                  </div>
                  <svg viewBox="0 0 220 74" style={{ width: "100%", height: 64, marginTop: 6, overflow: "visible" }}>
                    <defs>
                      <linearGradient id="nxarea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity=".38" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0 60 L30 52 L60 55 L90 38 L120 42 L150 24 L180 28 L220 10 L220 74 L0 74 Z" fill="url(#nxarea)" />
                    <path d="M0 60 L30 52 L60 55 L90 38 L120 42 L150 24 L180 28 L220 10" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="640" style={{ animation: "nx-draw 1.6s ease-out .5s both" }} />
                  </svg>
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", bottom: "16%", left: "-8%", width: 236, animation: "nx-rise .7s cubic-bezier(.2,.7,.3,1) .3s both" }}>
              <div style={{ animation: "nx-floatB 7s ease-in-out infinite", animationPlayState: "var(--anim)", animationDelay: ".95s" }}>
                <div style={{ ...glass, padding: 15 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(232,226,246,.9)" }}>Vendas por região</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 9, height: 78, marginTop: 12 }}>
                    <div style={{ ...barBase, height: "46%", background: "linear-gradient(180deg,var(--accent),color-mix(in oklch,var(--accent) 55%,transparent))", animation: "nx-grow .8s cubic-bezier(.2,.8,.3,1) .6s both" }} />
                    <div style={{ ...barBase, height: "74%", background: "linear-gradient(180deg,var(--accent),color-mix(in oklch,var(--accent) 55%,transparent))", animation: "nx-grow .8s cubic-bezier(.2,.8,.3,1) .72s both" }} />
                    <div style={{ ...barBase, height: "38%", background: "linear-gradient(180deg,var(--accent),color-mix(in oklch,var(--accent) 55%,transparent))", animation: "nx-grow .8s cubic-bezier(.2,.8,.3,1) .84s both" }} />
                    <div style={{ ...barBase, height: "88%", background: "linear-gradient(180deg,var(--accent2),color-mix(in oklch,var(--accent2) 50%,transparent))", animation: "nx-grow .8s cubic-bezier(.2,.8,.3,1) .96s both" }} />
                    <div style={{ ...barBase, height: "60%", background: "linear-gradient(180deg,var(--accent),color-mix(in oklch,var(--accent) 55%,transparent))", animation: "nx-grow .8s cubic-bezier(.2,.8,.3,1) 1.08s both" }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", bottom: "6%", right: "1%", width: 186, animation: "nx-rise .7s cubic-bezier(.2,.7,.3,1) .42s both" }}>
              <div style={{ animation: "nx-floatA 8s ease-in-out infinite", animationPlayState: "var(--anim)", animationDelay: "1.05s" }}>
                <div style={{ ...glass, padding: 15, display: "flex", alignItems: "center", gap: 13 }}>
                  <svg viewBox="0 0 100 100" style={{ width: 70, height: 70, transform: "rotate(-90deg)" }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--accent2)" strokeWidth="12" strokeLinecap="round" strokeDasharray="264" style={{ animation: "nx-donut 1.4s ease-out .7s both" }} />
                  </svg>
                  <div>
                    <div style={{ fontSize: 11.5, color: "rgba(198,188,224,.6)", fontWeight: 600 }}>Mix categoria</div>
                    <div style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 20, marginTop: 3 }}>70%</div>
                    <div style={{ fontSize: 11, color: "rgba(198,188,224,.55)" }}>recorrência</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ position: "absolute", top: "44%", right: "-6%", width: 262, animation: "nx-rise .7s cubic-bezier(.2,.7,.3,1) .55s both" }}>
              <div style={{ animation: "nx-floatC 9s ease-in-out infinite", animationPlayState: "var(--anim)", animationDelay: "1.15s" }}>
                <div style={{ borderRadius: 14, padding: "13px 15px", background: "linear-gradient(120deg, color-mix(in oklch,var(--accent) 26%, rgba(23,15,40,.85)), rgba(23,15,40,.82))", border: "1px solid color-mix(in oklch,var(--accent) 40%,transparent)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", boxShadow: "0 24px 50px -18px rgba(0,0,0,.7)", display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <div style={{ flex: "none", width: 26, height: 26, borderRadius: 8, display: "grid", placeItems: "center", background: "linear-gradient(135deg,var(--accent),var(--accent2))", fontSize: 14 }}>✦</div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", color: "color-mix(in oklch,var(--accent) 35%,#fff)", fontWeight: 700 }}>INSIGHT DA IA</div>
                    <div style={{ fontSize: 12.5, lineHeight: 1.42, color: "rgba(236,231,248,.92)", marginTop: 3 }}>Sudeste lidera o faturamento; Nordeste acelerou <b>18%</b> no trimestre.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 15, width: 394, maxWidth: "92%", borderRadius: 22, padding: "34px 32px", background: "linear-gradient(180deg, rgba(30,20,52,.88), rgba(18,11,34,.92))", border: "1px solid rgba(255,255,255,.11)", backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)", boxShadow: "0 40px 90px -30px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.03) inset, 0 30px 80px -40px color-mix(in oklch,var(--accent) 55%,transparent)", animation: "nx-cardin .8s cubic-bezier(.2,.7,.3,1) .25s both" }}>
            <h2 style={{ fontFamily: "'Sora'", fontWeight: 700, fontSize: 23, letterSpacing: "-.01em", margin: "0 0 5px" }}>Acesse seu painel</h2>
            <p style={{ fontSize: 13.5, color: "rgba(198,188,224,.62)", margin: 0 }}>Entre para continuar decidindo com dados.</p>

            <form onSubmit={onSubmit}>
              <label htmlFor="nx-email" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "rgba(214,205,236,.78)", margin: "16px 0 7px" }}>E-mail</label>
              <input
                id="nx-email"
                className="nx-input"
                type="email"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="voce@empresa.com"
                autoComplete="email"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,.12)", background: "rgba(10,6,20,.6)", color: "#fff", fontFamily: "'Manrope'", fontSize: 14, outline: "none" }}
              />

              <label htmlFor="nx-password" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "rgba(214,205,236,.78)", margin: "16px 0 7px" }}>Senha</label>
              <div style={{ position: "relative" }}>
                <input
                  id="nx-password"
                  className="nx-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ width: "100%", padding: "12px 44px 12px 14px", borderRadius: 11, border: "1px solid rgba(255,255,255,.12)", background: "rgba(10,6,20,.6)", color: "#fff", fontFamily: "'Manrope'", fontSize: 14, outline: "none" }}
                />
                <button
                  type="button"
                  onClick={onShowPasswordToggle}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", width: 34, height: 34, border: "none", background: "transparent", color: "rgba(198,188,224,.62)", cursor: "pointer", fontSize: 15, display: "grid", placeItems: "center" }}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "16px 0 22px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(214,205,236,.72)", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => onRememberChange(e.target.checked)}
                    style={{ width: 15, height: 15, accentColor: "var(--accent)", cursor: "pointer" }}
                  />
                  Manter conectado
                </label>
                <Link
                  to="/auth/forgot-password"
                  className="nx-link"
                  style={{ fontSize: 13, color: "color-mix(in oklch,var(--accent) 32%,#fff)", textDecoration: "none", fontWeight: 600 }}
                >
                  Esqueci a senha
                </Link>
              </div>

              {errorMessage ? (
                <p style={{ fontSize: 13, color: "#fca5a5", margin: "0 0 14px", lineHeight: 1.45 }}>{errorMessage}</p>
              ) : null}

              <button
                type="submit"
                className="nx-submit"
                disabled={isLoading}
                style={{ width: "100%", padding: 14, border: "none", borderRadius: 12, background: "linear-gradient(100deg, var(--accent), var(--accent2))", color: "#fff", fontFamily: "'Sora'", fontWeight: 700, fontSize: 15, cursor: "pointer", boxShadow: "0 14px 34px -10px color-mix(in oklch,var(--accent) 70%,transparent)", position: "relative", overflow: "hidden" }}
              >
                {isLoading ? "Entrando..." : "Entrar no painel"}
              </button>
            </form>

            <p style={{ textAlign: "center", fontSize: 13, color: "rgba(198,188,224,.58)", margin: "20px 0 0" }}>
              Novo por aqui?{" "}
              <Link to="/auth/register" className="nx-link" style={{ color: "#fff", fontWeight: 600, textDecoration: "none" }}>
                Criar conta gratuita
              </Link>
            </p>
            <p style={{ textAlign: "center", fontSize: 12, color: "rgba(198,188,224,.45)", margin: "12px 0 0" }}>
              <Link to="/sobre" className="nx-link" style={{ color: "inherit", textDecoration: "none" }}>
                O que é o NeXora?
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

type LoginApiResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    name: string;
    email: string;
    status: string;
    role?: "admin" | "manager" | "viewer";
    authenticated: boolean;
    token?: string;
  };
};

function isHttpsOrLocalApi(baseUrl: string): boolean {
  try {
    const parsedUrl = baseUrl.startsWith("/")
      ? new URL(baseUrl, window.location.origin)
      : new URL(baseUrl);
    const isLocalHost = ["localhost", "127.0.0.1", "::1"].includes(parsedUrl.hostname);
    return parsedUrl.protocol === "https:" || isLocalHost;
  } catch {
    return true;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const savedLogin = getSavedLogin();
  const [email, setEmail] = useState(savedLogin?.email ?? "");
  const [password, setPassword] = useState(savedLogin?.password ?? "");
  const [rememberLogin, setRememberLogin] = useState(
    () => getRememberLoginPreference() || savedLogin !== null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (!rememberLogin) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return;
    }

    setSavedLogin({ email: normalizedEmail, password });
  }, [email, password, rememberLogin]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      setErrorMessage("Informe e-mail e senha para continuar.");
      return;
    }

    if (!isHttpsOrLocalApi(API_BASE_URL)) {
      setErrorMessage("Por segurança, o login em produção exige API com HTTPS.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth_login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        referrerPolicy: "no-referrer",
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        if (response.status === 404) {
          setErrorMessage(
            "API não encontrada (404). Confirme que a pasta api/ está publicada no servidor."
          );
        } else {
          setErrorMessage(
            `Servidor retornou resposta inválida (HTTP ${response.status}). Verifique a pasta api/ e o arquivo api/.env.`
          );
        }
        return;
      }

      const result = (await response.json()) as LoginApiResponse;

      if (!response.ok || !result.success || !result.data?.authenticated || !result.data.token) {
        setErrorMessage(result.message ?? "Credenciais inválidas.");
        return;
      }

      setAuthToken(result.data.token);
      const { token: _token, ...userWithoutToken } = result.data;
      localStorage.setItem("nexora_user", JSON.stringify(userWithoutToken));

      if (rememberLogin) {
        setRememberLoginPreference(true);
        setSavedLogin({ email: normalizedEmail, password });
      } else {
        setRememberLoginPreference(false);
        clearSavedLogin();
      }

      if (!rememberLogin) {
        setPassword("");
      }

      navigate("/dashboards");
    } catch (_error) {
      setErrorMessage("Não foi possível conectar ao servidor de autenticação.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleRememberLoginChange(checked: boolean) {
    setRememberLogin(checked);
    setRememberLoginPreference(checked);

    if (!checked) {
      clearSavedLogin();
      setPassword("");
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail && password) {
      setSavedLogin({ email: normalizedEmail, password });
    }
  }

  return (
    <LoginNeXora
      email={email}
      password={password}
      remember={rememberLogin}
      showPassword={showPassword}
      errorMessage={errorMessage}
      isLoading={isLoading}
      reduceMotion={reduceMotion}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onRememberChange={handleRememberLoginChange}
      onShowPasswordToggle={() => setShowPassword((value) => !value)}
      onSubmit={handleSubmit}
    />
  );
}
