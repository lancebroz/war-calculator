import { useState, useMemo } from "react";

// ========================================
// 2024 MLB LEAGUE CONSTANTS
// ========================================
const LG = {
  ERA: 4.08, RA9: 4.43, K_RATE: 0.227, BB_RATE: 0.082,
  HBP_RATE: 0.01, IFFB_RATE: 0.022, HR_PER_9: 1.19, BF_PER_IP: 4.3,
  EARNED_RUN_PCT: 0.92, // earned runs are ~92% of total runs
};

// Teams with both FIP park factor and basic (run-scoring) park factor
const TEAMS = [
  { name: "Angels", park: "Angel Stadium", fipPF: 98, basicPF: 97 },
  { name: "Astros", park: "Minute Maid Park", fipPF: 101, basicPF: 101 },
  { name: "Athletics", park: "Sutter Health Park", fipPF: 98, basicPF: 97 },
  { name: "Blue Jays", park: "Rogers Centre", fipPF: 101, basicPF: 101 },
  { name: "Braves", park: "Truist Park", fipPF: 100, basicPF: 100 },
  { name: "Brewers", park: "American Family Field", fipPF: 102, basicPF: 102 },
  { name: "Cardinals", park: "Busch Stadium", fipPF: 99, basicPF: 98 },
  { name: "Cubs", park: "Wrigley Field", fipPF: 101, basicPF: 102 },
  { name: "D-backs", park: "Chase Field", fipPF: 100, basicPF: 101 },
  { name: "Dodgers", park: "Dodger Stadium", fipPF: 97, basicPF: 96 },
  { name: "Giants", park: "Oracle Park", fipPF: 97, basicPF: 96 },
  { name: "Guardians", park: "Progressive Field", fipPF: 99, basicPF: 98 },
  { name: "Mariners", park: "T-Mobile Park", fipPF: 97, basicPF: 96 },
  { name: "Marlins", park: "loanDepot Park", fipPF: 100, basicPF: 99 },
  { name: "Mets", park: "Citi Field", fipPF: 98, basicPF: 96 },
  { name: "Nationals", park: "Nationals Park", fipPF: 100, basicPF: 100 },
  { name: "Orioles", park: "Camden Yards", fipPF: 100, basicPF: 100 },
  { name: "Padres", park: "Petco Park", fipPF: 97, basicPF: 96 },
  { name: "Phillies", park: "Citizens Bank Park", fipPF: 101, basicPF: 101 },
  { name: "Pirates", park: "PNC Park", fipPF: 99, basicPF: 98 },
  { name: "Rangers", park: "Globe Life Field", fipPF: 100, basicPF: 100 },
  { name: "Rays", park: "Tropicana Field", fipPF: 98, basicPF: 97 },
  { name: "Red Sox", park: "Fenway Park", fipPF: 100, basicPF: 104 },
  { name: "Reds", park: "Great American Ball Park", fipPF: 103, basicPF: 105 },
  { name: "Rockies", park: "Coors Field", fipPF: 105, basicPF: 114 },
  { name: "Royals", park: "Kauffman Stadium", fipPF: 99, basicPF: 100 },
  { name: "Tigers", park: "Comerica Park", fipPF: 100, basicPF: 99 },
  { name: "Twins", park: "Target Field", fipPF: 99, basicPF: 100 },
  { name: "White Sox", park: "Guaranteed Rate Field", fipPF: 103, basicPF: 103 },
  { name: "Yankees", park: "Yankee Stadium", fipPF: 104, basicPF: 103 },
  { name: "— Neutral —", park: "Neutral Park", fipPF: 100, basicPF: 100 },
];

// ========================================
// THEMES
// ========================================
const themes = {
  light: {
    bg: "#f4f5f7", card: "#ffffff", cardBorder: "#e2e5ea",
    text: "#111214", textSecondary: "#2e3138", textMuted: "#3d4250", textFaint: "#6b7080",
    sliderTrack: "#dde0e6", sliderFill: "#2563eb", accent: "#2563eb", highlight: "#2563eb",
    statBg: "#f7f8fa", stepBorder: "#eef0f3", selectBg: "#f7f8fa",
    editBg: "#f0f1f4", editBorder: "#2563eb", hoverBorder: "#d0d3da",
    footerText: "#a0a5b0", thumbShadow: "#2563eb44",
    toggleActive: "#2563eb", toggleInactive: "#e2e5ea", toggleText: "#ffffff", toggleTextInactive: "#3d4250",
  },
  dark: {
    bg: "#13151a", card: "#1a1d24", cardBorder: "#2a2d35",
    text: "#e8eaed", textSecondary: "#9ca3af", textMuted: "#6b7280", textFaint: "#4a5568",
    sliderTrack: "#2a2d35", sliderFill: "#3b82f6", accent: "#3b82f6", highlight: "#60a5fa",
    statBg: "#22252d", stepBorder: "#1e2028", selectBg: "#22252d",
    editBg: "#22252d", editBorder: "#3b82f6", hoverBorder: "#2a2d35",
    footerText: "#2a2d35", thumbShadow: "#3b82f644",
    toggleActive: "#3b82f6", toggleInactive: "#2a2d35", toggleText: "#ffffff", toggleTextInactive: "#6b7280",
  },
};

// ========================================
// fWAR CALCULATION (FIP-based, FanGraphs)
// ========================================
function calculateFWAR({ hrPer9, ip, kRate, bbRate, teamIndex }) {
  const pf = TEAMS[teamIndex].fipPF;
  const bf = ip * LG.BF_PER_IP;
  const k = bf * (kRate / 100), bb = bf * (bbRate / 100);
  const hbp = bf * LG.HBP_RATE, iffb = bf * LG.IFFB_RATE;
  const hr = (hrPer9 / 9) * ip;

  const lgIP = 43400, lgBF = lgIP * LG.BF_PER_IP;
  const lgK = lgBF * LG.K_RATE, lgBB = lgBF * LG.BB_RATE;
  const lgHBP = lgBF * LG.HBP_RATE, lgIFFB = lgBF * LG.IFFB_RATE;
  const lgHR = (LG.HR_PER_9 / 9) * lgIP;

  const ifFIPConst = LG.ERA - (13 * lgHR + 3 * (lgBB + lgHBP) - 2 * (lgK + lgIFFB)) / lgIP;
  const ifFIP = (13 * hr + 3 * (bb + hbp) - 2 * (k + iffb)) / ip + ifFIPConst;
  const fipr9 = ifFIP + (LG.RA9 - LG.ERA);
  const pfipr9 = fipr9 / (pf / 100);
  const raap9 = LG.RA9 - pfipr9;
  const ipg = 6.0;
  const dRPW = (((18 - ipg) * LG.RA9 + ipg * pfipr9) / 18 + 2) * 1.5;
  const wpgaa = raap9 / dRPW;
  const repl = 0.12;
  const rawWAR = (wpgaa + repl) * (ip / 9);
  const war = rawWAR + (-0.001 * ip);

  return {
    bf: Math.round(bf), k: Math.round(k), bb: Math.round(bb),
    hbp: Math.round(hbp), iffb: Math.round(iffb), hr: hr.toFixed(1),
    steps: [
      { n: "1", l: "ifFIP Constant", v: ifFIPConst.toFixed(3) },
      { n: "2", l: "Pitcher ifFIP", v: ifFIP.toFixed(2), hi: true },
      { n: "3", l: "RA9 Adjustment", v: "+" + (LG.RA9 - LG.ERA).toFixed(2), f: "lgRA9 − lgERA" },
      { n: "4", l: "FIPR9 (FIP on RA9 scale)", v: fipr9.toFixed(2) },
      { n: "5", l: "pFIPR9 (park adjusted)", v: pfipr9.toFixed(2), f: `÷ ${pf / 100}` },
      { n: "6", l: "Lg Avg FIPR9", v: LG.RA9.toFixed(2) },
      { n: "7", l: "Runs Above Avg / 9", v: raap9.toFixed(2), hi: true },
      { n: "8", l: "Dynamic RPW", v: dRPW.toFixed(2), f: "pitcher-specific" },
      { n: "9", l: "Wins/Game Above Avg", v: wpgaa.toFixed(4), f: "RAAP9 ÷ dRPW" },
      { n: "10", l: "+ Replacement Level", v: "+0.12", f: "starter" },
      { n: "11", l: "Wins/Game Above Repl", v: (wpgaa + repl).toFixed(4) },
      { n: "12", l: `Raw WAR (× ${ip} IP ÷ 9)`, v: rawWAR.toFixed(1), hi: true },
      { n: "13", l: "League Correction", v: (-0.001 * ip).toFixed(2), f: "≈ −0.001 × IP" },
    ],
    war: war.toFixed(1),
  };
}

// ========================================
// bWAR CALCULATION (RA9-based, Baseball-Reference style)
// ========================================
function calculateBWAR({ era, ip, teamIndex }) {
  const pf = TEAMS[teamIndex].basicPF;

  // Step 1: Convert ERA → RA9 (include unearned runs)
  const ra9 = era / LG.EARNED_RUN_PCT;

  // Step 2: Park adjust using basic (run-scoring) park factor
  const pRA9 = ra9 / (pf / 100);

  // Step 3: Runs above average per 9
  const raap9 = LG.RA9 - pRA9;

  // Step 4: Total runs above average
  const totalRAA = raap9 * (ip / 9);

  // Step 5: Dynamic RPW (PythagenPat-style, same concept as fWAR)
  const ipg = 6.0;
  const dynamicEnv = ((18 - ipg) * LG.RA9 + ipg * pRA9) / 18;
  const dRPW = (dynamicEnv + 2) * 1.5;

  // Step 6: Wins above average
  const wpgaa = raap9 / dRPW;

  // Step 7: Replacement level
  // B-Ref uses 41% of WAR to pitchers (vs 43% for fWAR)
  // Starter replacement level ≈ 0.11
  const repl = 0.11;

  // Step 8: Scale to innings
  const rawWAR = (wpgaa + repl) * (ip / 9);

  // Step 9: League correction
  const war = rawWAR + (-0.001 * ip);

  return {
    steps: [
      { n: "1", l: "ERA → RA9 (÷ 0.92)", v: ra9.toFixed(2), hi: true, f: "incl. unearned runs" },
      { n: "2", l: "Park Factor (basic)", v: pf.toString(), f: "run-scoring PF" },
      { n: "3", l: "pRA9 (park adjusted)", v: pRA9.toFixed(2), f: `÷ ${pf / 100}` },
      { n: "4", l: "Lg Avg RA9", v: LG.RA9.toFixed(2) },
      { n: "5", l: "Runs Above Avg / 9", v: raap9.toFixed(2), hi: true },
      { n: "6", l: "Total Runs Above Avg", v: totalRAA.toFixed(1), f: `× ${ip} IP ÷ 9` },
      { n: "7", l: "Dynamic RPW", v: dRPW.toFixed(2), f: "PythagenPat-style" },
      { n: "8", l: "Wins/Game Above Avg", v: wpgaa.toFixed(4) },
      { n: "9", l: "+ Replacement Level", v: "+0.11", f: "starter (41% split)" },
      { n: "10", l: "Wins/Game Above Repl", v: (wpgaa + repl).toFixed(4) },
      { n: "11", l: `Raw WAR (× ${ip} IP ÷ 9)`, v: rawWAR.toFixed(1), hi: true },
      { n: "12", l: "League Correction", v: (-0.001 * ip).toFixed(2), f: "≈ −0.001 × IP" },
    ],
    war: war.toFixed(1),
  };
}

// ========================================
// SLIDER COMPONENT
// ========================================
function Slider({ label, value, onChange, min, max, step, unit, note, dimmed, t }) {
  const [inputText, setInputText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const decimals = step < 0.1 ? 2 : step < 1 ? 1 : 0;
  const displayValue = typeof value === "number" ? value.toFixed(decimals) : value;
  const pct = ((value - min) / (max - min)) * 100;
  const opacity = dimmed ? 0.4 : 1;

  const handleInputCommit = () => {
    const parsed = parseFloat(inputText);
    if (!isNaN(parsed)) onChange(Math.min(max, Math.max(min, parsed)));
    setIsEditing(false);
  };

  return (
    <div style={{ marginBottom: 20, opacity, transition: "opacity 0.3s" }}>
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
          <span onClick={() => { setInputText(displayValue); setIsEditing(true); }} title="Click to type a value"
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
        onChange={(e) => onChange(parseFloat(e.target.value))} className="war-slider"
        style={{ width: "100%", height: 4, appearance: "none", WebkitAppearance: "none", background: `linear-gradient(to right, ${t.sliderFill} 0%, ${t.sliderFill} ${pct}%, ${t.sliderTrack} ${pct}%, ${t.sliderTrack} 100%)`, borderRadius: 2, outline: "none", cursor: "pointer" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontFamily: "var(--mono)", fontSize: 9, color: t.textFaint }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
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
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: "none", border: "none", cursor: "pointer" }}>
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
export default function WARCalculator() {
  const [mode, setMode] = useState("fWAR"); // "fWAR" or "bWAR"
  const [hrPer9, setHrPer9] = useState(1.1);
  const [ip, setIp] = useState(180);
  const [kRate, setKRate] = useState(24.0);
  const [bbRate, setBbRate] = useState(7.5);
  const [era, setEra] = useState(3.5);
  const [teamIndex, setTeamIndex] = useState(TEAMS.length - 1);
  const [isDark, setIsDark] = useState(false);

  const t = isDark ? themes.dark : themes.light;
  const isFWAR = mode === "fWAR";

  const fResult = useMemo(() => calculateFWAR({ hrPer9, ip, kRate, bbRate, teamIndex }), [hrPer9, ip, kRate, bbRate, teamIndex]);
  const bResult = useMemo(() => calculateBWAR({ era, ip, teamIndex }), [era, ip, teamIndex]);
  const result = isFWAR ? fResult : bResult;

  const warNum = parseFloat(result.war);
  const warColor = warNum >= 6 ? "#d97706" : warNum >= 4 ? "#059669" : warNum >= 2 ? t.accent : warNum >= 0 ? t.textMuted : "#ef4444";
  const warLabel = warNum >= 6 ? "MVP Caliber" : warNum >= 4 ? "All-Star" : warNum >= 2 ? "Solid Starter" : warNum >= 1 ? "Replacement+" : warNum >= 0 ? "Below Avg" : "Replacement";

  const team = TEAMS[teamIndex];
  const activePF = isFWAR ? team.fipPF : team.basicPF;

  return (
    <div style={{ "--mono": "'IBM Plex Mono', monospace", minHeight: "100vh", background: t.bg, color: t.text, fontFamily: "'IBM Plex Sans', sans-serif", padding: "24px 16px", transition: "background 0.3s, color 0.3s" }}>
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <h1 style={{ fontFamily: "var(--mono)", fontSize: 15, fontWeight: 700, color: t.text, margin: 0, letterSpacing: "-0.02em" }}>
            PITCHER WAR PROJECTION
          </h1>
          <button onClick={() => setIsDark(!isDark)}
            style={{ background: t.card, border: `1px solid ${t.cardBorder}`, borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontFamily: "var(--mono)", fontSize: 11, color: t.textSecondary, flexShrink: 0, transition: "all 0.2s" }}>
            {isDark ? "☀ Light" : "● Dark"}
          </button>
        </div>

        {/* fWAR / bWAR Toggle */}
        <div style={{ display: "flex", background: t.toggleInactive, borderRadius: 10, padding: 3, marginBottom: 24, border: `1px solid ${t.cardBorder}` }}>
          {["fWAR", "bWAR"].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
                fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, letterSpacing: "0.02em",
                background: mode === m ? t.toggleActive : "transparent",
                color: mode === m ? t.toggleText : t.toggleTextInactive,
                transition: "all 0.2s",
              }}>
              {m}
              <span style={{ display: "block", fontSize: 9, fontWeight: 400, marginTop: 2, opacity: 0.8 }}>
                {m === "fWAR" ? "FanGraphs · FIP-based" : "Baseball Ref · RA9-based"}
              </span>
            </button>
          ))}
        </div>

        {/* WAR Result */}
        <div style={{ background: t.card, borderRadius: 12, padding: "24px 28px", marginBottom: 24, border: `1px solid ${t.cardBorder}`, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: t.textMuted, marginBottom: 8 }}>
            Projected {mode}
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
          <Slider label="HR / 9" value={hrPer9} onChange={setHrPer9} min={0.3} max={2.5} step={0.05} t={t}
            dimmed={!isFWAR} note={!isFWAR ? "(fWAR only)" : undefined} />
          <Slider label="Innings Pitched" value={ip} onChange={setIp} min={40} max={250} step={1} unit=" IP" t={t} />
          <Slider label="Strikeout Rate" value={kRate} onChange={setKRate} min={10} max={40} step={0.5} unit="%" t={t}
            dimmed={!isFWAR} note={!isFWAR ? "(fWAR only)" : undefined} />
          <Slider label="Walk Rate" value={bbRate} onChange={setBbRate} min={2} max={15} step={0.5} unit="%" t={t}
            dimmed={!isFWAR} note={!isFWAR ? "(fWAR only)" : undefined} />
          <Slider label="ERA" value={era} onChange={setEra} min={1.5} max={7.0} step={0.05} t={t}
            dimmed={isFWAR} note={isFWAR ? "(bWAR only — not used in fWAR)" : "(drives bWAR calculation)"} />

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontFamily: "var(--mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: t.textMuted, display: "block", marginBottom: 8 }}>
              Home Park
              <span style={{ fontSize: 9, color: t.textFaint, marginLeft: 8 }}>
                ({isFWAR ? "FIP" : "Basic"} PF: {activePF})
              </span>
            </label>
            <select value={teamIndex} onChange={(e) => setTeamIndex(parseInt(e.target.value))}
              style={{ width: "100%", background: t.selectBg, color: t.text, border: `1px solid ${t.cardBorder}`, borderRadius: 6, padding: "10px 12px", fontFamily: "var(--mono)", fontSize: 13, outline: "none" }}>
              {TEAMS.map((tm, i) => (
                <option key={tm.name} value={i}>
                  {tm.name} — {tm.park} ({isFWAR ? "FIP" : "Basic"} PF: {isFWAR ? tm.fipPF : tm.basicPF})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Derived Stats (fWAR only) */}
        {isFWAR && (
          <div style={{ background: t.card, borderRadius: 12, padding: "16px 20px", marginBottom: 20, border: `1px solid ${t.cardBorder}` }}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: t.textFaint, marginBottom: 10 }}>
              Derived Counting Stats (est.)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "BF", val: fResult.bf }, { label: "K", val: fResult.k }, { label: "BB", val: fResult.bb },
                { label: "HR", val: fResult.hr }, { label: "HBP", val: fResult.hbp }, { label: "IFFB", val: fResult.iffb },
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
        )}

        {/* Calculation Breakdown */}
        <Collapsible title={`${mode} Calculation Steps`} defaultOpen={false} t={t}>
          {result.steps.map((s) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${t.stepBorder}`, gap: 10 }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: t.textFaint, width: 18, flexShrink: 0 }}>{s.n}</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: t.textSecondary, flex: 1, minWidth: 0 }}>{s.l}</span>
              {s.f && <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: t.textFaint, flexShrink: 0 }}>{s.f}</span>}
              <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: s.hi ? 700 : 500, color: s.hi ? t.highlight : t.text, flexShrink: 0, minWidth: 50, textAlign: "right" }}>{s.v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 4px", borderTop: `2px solid ${t.accent}`, marginTop: 4 }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: 13, fontWeight: 700, color: t.text }}>PROJECTED {mode}</span>
            <span style={{ fontFamily: "var(--mono)", fontSize: 24, fontWeight: 700, color: warColor }}>{result.war}</span>
          </div>
        </Collapsible>

        {/* Notes */}
        <Collapsible title="Notes & Assumptions" defaultOpen={false} t={t}>
          <ul style={{ fontFamily: "var(--mono)", fontSize: 10, color: t.textSecondary, margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
            {isFWAR ? (<>
              <li>fWAR uses FanGraphs methodology: FIP with IFFB as K, scaled to RA9, park adjusted with FIP-specific park factors</li>
              <li>ERA is not used — fWAR is entirely FIP-based</li>
              <li>HBP and IFFB rates default to league average ({(LG.HBP_RATE*100).toFixed(1)}% and {(LG.IFFB_RATE*100).toFixed(1)}%)</li>
              <li>FIP park factors are approximate (5-yr regressed)</li>
              <li>Replacement level = 0.12 for starters (43% pitcher WAR share)</li>
            </>) : (<>
              <li>bWAR approximates Baseball-Reference methodology: uses RA9 (runs allowed per 9) as base metric</li>
              <li>ERA is converted to RA9 by dividing by 0.92 (earned runs ≈ 92% of total runs)</li>
              <li>HR/9, K%, BB% are not used — bWAR is based on actual runs allowed, not FIP components</li>
              <li>Uses basic (run-scoring) park factors, not FIP-specific park factors</li>
              <li>Does not include B-Ref's defense adjustment or opposition quality adjustment (would require team-level data)</li>
              <li>Replacement level = 0.11 for starters (41% pitcher WAR share)</li>
            </>)}
            <li>Always assumes starting pitcher (no leverage multiplier)</li>
            <li>Assumes 6.0 IP/GS for dynamic RPW calculation</li>
            <li>Park factors are approximate — actual values may differ slightly</li>
            <li>Uses 2024 MLB league constants</li>
          </ul>
        </Collapsible>

        <p style={{ fontFamily: "var(--mono)", fontSize: 9, color: t.footerText, textAlign: "center", marginTop: 8 }}>
          data sources: fangraphs.com/library · baseball-reference.com · 2024 constants
        </p>
      </div>
    </div>
  );
}
