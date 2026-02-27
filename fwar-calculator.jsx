import { useState, useMemo } from "react";

// ========================================
// 2024 MLB LEAGUE CONSTANTS (approximate)
// ========================================
const LG = {
  ERA: 4.08,
  RA9: 4.43,
  K_RATE: 0.227,
  BB_RATE: 0.082,
  HBP_RATE: 0.01,
  IFFB_RATE: 0.022,
  HR_PER_9: 1.19,
  BF_PER_IP: 4.3,
};

const TEAMS = [
  { name: "Angels", park: "Angel Stadium", fipPF: 98 },
  { name: "Astros", park: "Minute Maid Park", fipPF: 101 },
  { name: "Athletics", park: "Sutter Health Park", fipPF: 98 },
  { name: "Blue Jays", park: "Rogers Centre", fipPF: 101 },
  { name: "Braves", park: "Truist Park", fipPF: 100 },
  { name: "Brewers", park: "American Family Field", fipPF: 102 },
  { name: "Cardinals", park: "Busch Stadium", fipPF: 99 },
  { name: "Cubs", park: "Wrigley Field", fipPF: 101 },
  { name: "D-backs", park: "Chase Field", fipPF: 100 },
  { name: "Dodgers", park: "Dodger Stadium", fipPF: 97 },
  { name: "Giants", park: "Oracle Park", fipPF: 97 },
  { name: "Guardians", park: "Progressive Field", fipPF: 99 },
  { name: "Mariners", park: "T-Mobile Park", fipPF: 97 },
  { name: "Marlins", park: "loanDepot Park", fipPF: 100 },
  { name: "Mets", park: "Citi Field", fipPF: 98 },
  { name: "Nationals", park: "Nationals Park", fipPF: 100 },
  { name: "Orioles", park: "Camden Yards", fipPF: 100 },
  { name: "Padres", park: "Petco Park", fipPF: 97 },
  { name: "Phillies", park: "Citizens Bank Park", fipPF: 101 },
  { name: "Pirates", park: "PNC Park", fipPF: 99 },
  { name: "Rangers", park: "Globe Life Field", fipPF: 100 },
  { name: "Rays", park: "Tropicana Field", fipPF: 98 },
  { name: "Red Sox", park: "Fenway Park", fipPF: 100 },
  { name: "Reds", park: "Great American Ball Park", fipPF: 103 },
  { name: "Rockies", park: "Coors Field", fipPF: 105 },
  { name: "Royals", park: "Kauffman Stadium", fipPF: 99 },
  { name: "Tigers", park: "Comerica Park", fipPF: 100 },
  { name: "Twins", park: "Target Field", fipPF: 99 },
  { name: "White Sox", park: "Guaranteed Rate Field", fipPF: 103 },
  { name: "Yankees", park: "Yankee Stadium", fipPF: 104 },
  { name: "— Neutral —", park: "Neutral Park", fipPF: 100 },
];

// ========================================
// THEMES
// ========================================
const themes = {
  light: {
    bg: "#f4f5f7",
    card: "#ffffff",
    cardBorder: "#e2e5ea",
    text: "#111214",
    textSecondary: "#2e3138",
    textMuted: "#3d4250",
    textFaint: "#6b7080",
    sliderTrack: "#dde0e6",
    sliderFill: "#2563eb",
    accent: "#2563eb",
    highlight: "#2563eb",
    statBg: "#f7f8fa",
    stepBorder: "#eef0f3",
    selectBg: "#f7f8fa",
    editBg: "#f0f1f4",
    editBorder: "#2563eb",
    hoverBorder: "#d0d3da",
    footerText: "#a0a5b0",
    thumbShadow: "#2563eb44",
  },
  dark: {
    bg: "#13151a",
    card: "#1a1d24",
    cardBorder: "#2a2d35",
    text: "#e8eaed",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",
    textFaint: "#4a5568",
    sliderTrack: "#2a2d35",
    sliderFill: "#3b82f6",
    accent: "#3b82f6",
    highlight: "#60a5fa",
    statBg: "#22252d",
    stepBorder: "#1e2028",
    selectBg: "#22252d",
    editBg: "#22252d",
    editBorder: "#3b82f6",
    hoverBorder: "#2a2d35",
    footerText: "#2a2d35",
    thumbShadow: "#3b82f644",
  },
};

// ========================================
// WAR CALCULATION ENGINE
// ========================================
function calculateWAR({ hrPer9, ip, kRate, bbRate, teamIndex }) {
  const team = TEAMS[teamIndex];
  const parkFactor = team.fipPF;
  const bf = ip * LG.BF_PER_IP;
  const k = bf * (kRate / 100);
  const bb = bf * (bbRate / 100);
  const hbp = bf * LG.HBP_RATE;
  const iffb = bf * LG.IFFB_RATE;
  const hr = (hrPer9 / 9) * ip;

  const lgIP = 43400;
  const lgBF = lgIP * LG.BF_PER_IP;
  const lgK = lgBF * LG.K_RATE;
  const lgBB = lgBF * LG.BB_RATE;
  const lgHBP = lgBF * LG.HBP_RATE;
  const lgIFFB = lgBF * LG.IFFB_RATE;
  const lgHR = (LG.HR_PER_9 / 9) * lgIP;

  const ifFIPConstant =
    LG.ERA - (13 * lgHR + 3 * (lgBB + lgHBP) - 2 * (lgK + lgIFFB)) / lgIP;
  const ifFIP =
    (13 * hr + 3 * (bb + hbp) - 2 * (k + iffb)) / ip + ifFIPConstant;
  const ra9Adjustment = LG.RA9 - LG.ERA;
  const fipr9 = ifFIP + ra9Adjustment;
  const pfipr9 = fipr9 / (parkFactor / 100);
  const lgFIPR9 = LG.RA9;
  const raap9 = lgFIPR9 - pfipr9;
  const ipPerGame = 6.0;
  const dynamicEnv =
    ((18 - ipPerGame) * lgFIPR9 + ipPerGame * pfipr9) / 18;
  const dRPW = (dynamicEnv + 2) * 1.5;
  const wpgaa = raap9 / dRPW;
  const replacementLevel = 0.12;
  const wpgar = wpgaa + replacementLevel;
  const rawWAR = wpgar * (ip / 9);
  const warip = -0.001;
  const correction = warip * ip;
  const war = rawWAR + correction;

  return {
    bf: Math.round(bf), k: Math.round(k), bb: Math.round(bb),
    hbp: Math.round(hbp), iffb: Math.round(iffb), hr: hr.toFixed(1),
    ifFIPConstant: ifFIPConstant.toFixed(3), ifFIP: ifFIP.toFixed(2),
    ra9Adjustment: ra9Adjustment.toFixed(2), fipr9: fipr9.toFixed(2),
    parkFactor, pfipr9: pfipr9.toFixed(2), lgFIPR9: lgFIPR9.toFixed(2),
    raap9: raap9.toFixed(2), dRPW: dRPW.toFixed(2),
    wpgaa: wpgaa.toFixed(4), replacementLevel,
    wpgar: wpgar.toFixed(4), rawWAR: rawWAR.toFixed(1),
    correction: correction.toFixed(2), war: war.toFixed(1),
  };
}

// ========================================
// SLIDER COMPONENT
// ========================================
function Slider({ label, value, onChange, min, max, step, unit, note, t }) {
  const [inputText, setInputText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  const displayValue = typeof value === "number" ? value.toFixed(decimals) : value;
  const pct = ((value - min) / (max - min)) * 100;

  const handleInputCommit = () => {
    const parsed = parseFloat(inputText);
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
    setIsEditing(false);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <label style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted }}>
          {label}
          {note && <span style={{ fontSize: 9, color: t.textFaint, marginLeft: 6 }}>{note}</span>}
        </label>
        {isEditing ? (
          <input type="text" autoFocus value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onBlur={handleInputCommit}
            onKeyDown={(e) => { if (e.key === "Enter") handleInputCommit(); if (e.key === "Escape") setIsEditing(false); }}
            style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 600, color: t.text, background: t.editBg, border: `1px solid ${t.editBorder}`, borderRadius: 4, padding: "2px 8px", width: 90, textAlign: "right", outline: "none" }}
          />
        ) : (
          <span
            onClick={() => { setInputText(displayValue); setIsEditing(true); }}
            title="Click to type a value"
            style={{ fontFamily: "var(--mono)", fontSize: 20, fontWeight: 600, color: t.text, cursor: "text", padding: "2px 8px", borderRadius: 4, border: "1px solid transparent", transition: "border-color 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = t.hoverBorder)}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
          >
            {displayValue}
            {unit && <span style={{ fontSize: 12, color: t.textMuted, marginLeft: 2 }}>{unit}</span>}
          </span>
        )}
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="war-slider"
        style={{ width: "100%", height: 4, appearance: "none", WebkitAppearance: "none", background: `linear-gradient(to right, ${t.sliderFill} 0%, ${t.sliderFill} ${pct}%, ${t.sliderTrack} ${pct}%, ${t.sliderTrack} 100%)`, borderRadius: 2, outline: "none", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontFamily: "var(--mono)", fontSize: 9, color: t.textFaint }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ========================================
// STEP ROW
// ========================================
function StepRow({ num, label, value, formula, highlight, t }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${t.stepBorder}`, gap: 10 }}>
      <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: t.textFaint, width: 18, flexShrink: 0 }}>{num}</span>
      <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: t.textSecondary, flex: 1, minWidth: 0 }}>{label}</span>
      {formula && <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: t.textFaint, flexShrink: 0 }}>{formula}</span>}
      <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? t.highlight : t.text, flexShrink: 0, minWidth: 50, textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ========================================
// COLLAPSIBLE SECTION
// ========================================
function Collapsible({ title, defaultOpen, children, t }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div style={{ background: t.card, borderRadius: 12, marginBottom: 20, border: `1px solid ${t.cardBorder}`, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "none", border: "none", cursor: "pointer" }}
      >
        <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: t.textFaint }}>{title}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 14, color: t.textFaint, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
      </button>
      <div style={{ maxHeight: open ? 2000 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <div style={{ padding: "0 20px 16px" }}>{children}</div>
      </div>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================
export default function FWARCalculator() {
  const [hrPer9, setHrPer9] = useState(1.1);
  const [ip, setIp] = useState(180);
  const [kRate, setKRate] = useState(24.0);
  const [bbRate, setBbRate] = useState(7.5);
  const [era, setEra] = useState(3.5);
  const [teamIndex, setTeamIndex] = useState(TEAMS.length - 1);
  const [isDark, setIsDark] = useState(false);

  const t = isDark ? themes.dark : themes.light;

  const result = useMemo(
    () => calculateWAR({ hrPer9, ip, kRate, bbRate, teamIndex }),
    [hrPer9, ip, kRate, bbRate, teamIndex]
  );

  const warNum = parseFloat(result.war);
  const warColor = warNum >= 6 ? "#d97706" : warNum >= 4 ? "#059669" : warNum >= 2 ? t.accent : warNum >= 0 ? t.textMuted : "#ef4444";
  const warLabel = warNum >= 6 ? "MVP Caliber" : warNum >= 4 ? "All-Star" : warNum >= 2 ? "Solid Starter" : warNum >= 1 ? "Replacement+" : warNum >= 0 ? "Below Avg" : "Replacement";

  return (
    <div style={{ "--mono": "'IBM Plex Mono', monospace", "--sans": "'IBM Plex Sans', sans-serif", minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "var(--sans)", padding: "24px 16px", transition: "background 0.3s, color 0.3s" }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <style>{`
        .war-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%;
          background: ${t.sliderFill}; border: 2px solid ${t.bg}; cursor: pointer;
          box-shadow: 0 0 6px ${t.thumbShadow};
        }
        .war-slider::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: ${t.sliderFill}; border: 2px solid ${t.bg}; cursor: pointer;
          box-shadow: 0 0 6px ${t.thumbShadow};
        }
        select { cursor: pointer; }
      `}</style>

      <div style={{ maxWidth: 720, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: t.text, margin: 0, letterSpacing: "-0.02em" }}>
              fWAR PITCHER PROJECTION
            </h1>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, color: t.textSecondary, flexShrink: 0, transition: "all 0.2s" }}
          >
            {isDark ? "☀ Light" : "● Dark"}
          </button>
        </div>

        {/* WAR Result */}
        <div style={{ background: t.card, borderRadius: 12, padding: "24px 28px", marginBottom: 24, border: `1px solid ${t.cardBorder}`, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: t.textMuted, marginBottom: 8 }}>
            Projected Pitcher fWAR
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 64, fontWeight: 700, color: warColor, lineHeight: 1, letterSpacing: "-0.04em" }}>
            {result.war}
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: warColor, marginTop: 6, opacity: 0.8 }}>
            {warLabel}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ background: t.card, borderRadius: 12, padding: "20px 24px 8px", marginBottom: 20, border: `1px solid ${t.cardBorder}` }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: t.textFaint, marginBottom: 16 }}>
            Pitcher Inputs
          </div>
          <Slider label="HR / 9" value={hrPer9} onChange={setHrPer9} min={0.3} max={2.5} step={0.05} t={t} />
          <Slider label="Innings Pitched" value={ip} onChange={setIp} min={40} max={250} step={1} unit=" IP" t={t} />
          <Slider label="Strikeout Rate" value={kRate} onChange={setKRate} min={10} max={40} step={0.5} unit="%" t={t} />
          <Slider label="Walk Rate" value={bbRate} onChange={setBbRate} min={2} max={15} step={0.5} unit="%" t={t} />
          <Slider label="ERA" value={era} onChange={setEra} min={1.5} max={7.0} step={0.05} note="(display only — not used in fWAR)" t={t} />

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, display: "block", marginBottom: 8 }}>
              Home Park
            </label>
            <select value={teamIndex} onChange={(e) => setTeamIndex(parseInt(e.target.value))}
              style={{ width: "100%", background: t.selectBg, color: t.text, border: `1px solid ${t.cardBorder}`, borderRadius: 6, padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 13, outline: "none" }}
            >
              {TEAMS.map((tm, i) => (
                <option key={tm.name} value={i}>{tm.name} — {tm.park} (FIP PF: {tm.fipPF})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Derived Stats */}
        <div style={{ background: t.card, borderRadius: 12, padding: "16px 20px", marginBottom: 20, border: `1px solid ${t.cardBorder}` }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: t.textFaint, marginBottom: 10 }}>
            Derived Counting Stats (est.)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "BF", val: result.bf }, { label: "K", val: result.k }, { label: "BB", val: result.bb },
              { label: "HR", val: result.hr }, { label: "HBP", val: result.hbp }, { label: "IFFB", val: result.iffb },
            ].map((s) => (
              <div key={s.label} style={{ background: t.statBg, borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: t.textMuted, marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 16, fontWeight: 600, color: t.text }}>{s.val}</div>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: t.textFaint, margin: "10px 0 0", lineHeight: 1.4 }}>
            BF estimated at {LG.BF_PER_IP} BF/IP · HBP at {(LG.HBP_RATE * 100).toFixed(1)}% lg avg · IFFB at {(LG.IFFB_RATE * 100).toFixed(1)}% lg avg
          </p>
        </div>

        {/* Calculation Breakdown — Collapsible */}
        <Collapsible title="fWAR Calculation Steps" defaultOpen={false} t={t}>
          <StepRow num="1" label="ifFIP Constant" value={result.ifFIPConstant} t={t} />
          <StepRow num="2" label="Pitcher ifFIP" value={result.ifFIP} highlight t={t} />
          <StepRow num="3" label="RA9 Adjustment" value={"+" + result.ra9Adjustment} formula="lgRA9 − lgERA" t={t} />
          <StepRow num="4" label="FIPR9 (FIP on RA9 scale)" value={result.fipr9} t={t} />
          <StepRow num="5" label="pFIPR9 (park adjusted)" value={result.pfipr9} formula={`÷ ${result.parkFactor / 100}`} t={t} />
          <StepRow num="6" label="Lg Avg FIPR9" value={result.lgFIPR9} t={t} />
          <StepRow num="7" label="Runs Above Avg / 9" value={result.raap9} highlight t={t} />
          <StepRow num="8" label="Dynamic RPW" value={result.dRPW} formula="pitcher-specific" t={t} />
          <StepRow num="9" label="Wins/Game Above Avg" value={result.wpgaa} formula="RAAP9 ÷ dRPW" t={t} />
          <StepRow num="10" label="+ Replacement Level" value={"+" + result.replacementLevel} formula="starter = 0.12" t={t} />
          <StepRow num="11" label="Wins/Game Above Repl" value={result.wpgar} t={t} />
          <StepRow num="12" label={`Raw WAR (× ${ip} IP ÷ 9)`} value={result.rawWAR} highlight t={t} />
          <StepRow num="13" label="League Correction" value={result.correction} formula="≈ −0.001 × IP" t={t} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 4px", borderTop: `2px solid ${t.accent}`, marginTop: 4 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: t.text }}>PROJECTED fWAR</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: warColor }}>{result.war}</span>
          </div>
        </Collapsible>

        {/* Notes — Collapsible */}
        <Collapsible title="Notes & Assumptions" defaultOpen={false} t={t}>
          <ul style={{ fontFamily: "var(--mono)", fontSize: 10, color: t.textSecondary, margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
            <li>Based on FanGraphs pitcher WAR methodology (FIP with IFFB as K, RA9 scale, park adjusted)</li>
            <li>Always assumes starting pitcher (replacement level = 0.12, no leverage multiplier)</li>
            <li>Assumes 6.0 IP/GS for dynamic RPW calculation</li>
            <li>ERA input is for your reference only — fWAR is entirely FIP-based, not ERA-based</li>
            <li>HBP and IFFB rates default to league average ({(LG.HBP_RATE * 100).toFixed(1)}% and {(LG.IFFB_RATE * 100).toFixed(1)}%)</li>
            <li>FIP park factors are approximate (5-yr regressed) — actual values from FanGraphs Guts may differ slightly</li>
            <li>League correction (WARIP) estimated at −0.001/IP — actual varies year-to-year</li>
            <li>Uses 2024 MLB league constants</li>
          </ul>
        </Collapsible>

        <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: t.footerText, textAlign: "center", marginTop: 8 }}>
          data sources: fangraphs.com/library · 2024 constants
        </p>
      </div>
    </div>
  );
}
