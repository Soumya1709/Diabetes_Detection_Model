import { useState } from "react";

const API_URL = "https://diabetes-detection-model.onrender.com"; // 🔁 Replace with your Render URL

const FIELDS = [
  { key: "Pregnancies",              label: "Pregnancies",                unit: "times",   min: 0,   max: 17,  step: 1,    default: 1,    desc: "Number of times pregnant" },
  { key: "Glucose",                  label: "Glucose Level",              unit: "mg/dL",   min: 0,   max: 200, step: 1,    default: 110,  desc: "Plasma glucose concentration (2hr oral glucose test)" },
  { key: "BloodPressure",            label: "Blood Pressure",             unit: "mm Hg",   min: 0,   max: 130, step: 1,    default: 72,   desc: "Diastolic blood pressure" },
  { key: "SkinThickness",            label: "Skin Thickness",             unit: "mm",      min: 0,   max: 100, step: 1,    default: 23,   desc: "Triceps skinfold thickness" },
  { key: "Insulin",                  label: "Insulin",                    unit: "µU/mL",   min: 0,   max: 850, step: 1,    default: 80,   desc: "2-Hour serum insulin" },
  { key: "BMI",                      label: "Body Mass Index",            unit: "kg/m²",   min: 0,   max: 70,  step: 0.1,  default: 26.0, desc: "Weight in kg / (height in m)²" },
  { key: "DiabetesPedigreeFunction", label: "Diabetes Pedigree Function", unit: "score",   min: 0,   max: 2.5, step: 0.01, default: 0.47, desc: "Genetic diabetes risk based on family history" },
  { key: "Age",                      label: "Age",                        unit: "years",   min: 18,  max: 90,  step: 1,    default: 33,   desc: "Age in years" },
];

const RISK_CONFIG = {
  low:      { label: "Low Risk",      color: "#4ade80", bg: "rgba(74,222,128,0.08)",  border: "rgba(74,222,128,0.25)",  icon: "✦", msg: "Your indicators appear within healthy ranges. Maintain your lifestyle." },
  moderate: { label: "Moderate Risk", color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.25)",  icon: "◈", msg: "Some risk factors detected. Consider consulting a healthcare professional." },
  high:     { label: "High Risk",     color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.25)", icon: "⬡", msg: "Multiple risk indicators present. Please consult a doctor promptly." },
};

function getRisk(prob) {
  if (prob < 0.35) return "low";
  if (prob < 0.60) return "moderate";
  return "high";
}

export default function DiabetesApp() {
  const [values, setValues]   = useState(() => Object.fromEntries(FIELDS.map(f => [f.key, f.default])));
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [activeField, setActiveField] = useState(null);

  const handleChange = (key, val) => {
  setValues(v => ({
    ...v,
    [key]: val === "" ? "" : Number(val)
  }));
};

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res  = await fetch(`${API_URL}/predict`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(values),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const risk   = result ? getRisk(result.probability) : null;
  const riskCfg = risk ? RISK_CONFIG[risk] : null;
  const maxShap = result ? Math.max(...result.shap.map(s => Math.abs(s.shap))) : 1;

  return (
    <div style={styles.root}>
      {/* Grain overlay */}
      <div style={styles.grain} />

      {/* Floating orbs */}
      <div style={{...styles.orb, top: "-120px", right: "10%",  width: 400, height: 400, background: "radial-gradient(circle, rgba(99,179,237,0.12) 0%, transparent 70%)" }} />
      <div style={{...styles.orb, bottom: "5%",  left:  "-80px", width: 350, height: 350, background: "radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)" }} />

      <div style={styles.container}>

        {/* Header */}
        <header style={styles.header}>
          <div style={styles.logoMark}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" stroke="#63b3ed" strokeWidth="1.5" fill="none"/>
              <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" stroke="#a78bfa" strokeWidth="1" fill="none"/>
              <circle cx="14" cy="14" r="2.5" fill="#63b3ed"/>
            </svg>
          </div>
          <div>
            <h1 style={styles.title}>GLYCO<span style={styles.titleAccent}>SCAN</span></h1>
            <p style={styles.subtitle}>Diabetes risk assessment powered by machine learning</p>
          </div>
          <div style={styles.headerBadge}>ML Model · XGBoost · SHAP</div>
        </header>

        <div style={styles.layout}>

          {/* Left — Input form */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardLabel}>PATIENT PARAMETERS</span>
              <span style={styles.cardCount}>{FIELDS.length} indicators</span>
            </div>

            <div style={styles.fieldGrid}>
              {FIELDS.map(f => (
                <div
                  key={f.key}
                  style={{
                    ...styles.fieldRow,
                    ...(activeField === f.key ? styles.fieldRowActive : {}),
                  }}
                  onMouseEnter={() => setActiveField(f.key)}
                  onMouseLeave={() => setActiveField(null)}
                >
                  <div style={styles.fieldTop}>
                    <label style={styles.fieldLabel}>{f.label}</label>
                    <span style={styles.fieldUnit}>{f.unit}</span>
                  </div>
                  <p style={styles.fieldDesc}>{f.desc}</p>
                  <input
                    type="number"
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    value={values[f.key] ?? ""}
                    onChange={e => handleChange(f.key, e.target.value)}
                    style={styles.input}
                  />
                  {/* Mini range indicator */}
                  <div style={styles.rangeBar}>
                    <div style={{
                      ...styles.rangeFill,
                      width: `${
  Number.isFinite(values[f.key])
    ? Math.min(
        100,
        ((values[f.key] - f.min) / (f.max - f.min)) * 100
      )
    : 0
}%`,
                    }} />
                  </div>
                  <div style={styles.rangeLabels}>
                    <span>{f.min}</span><span>{f.max}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{...styles.btn, ...(loading ? styles.btnLoading : {})}}
            >
              {loading ? (
                <span style={styles.btnInner}>
                  <span style={styles.spinner} />
                  Analysing...
                </span>
              ) : (
                <span style={styles.btnInner}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  Run Risk Assessment
                </span>
              )}
            </button>

            {error && (
              <div style={styles.errorBox}>
                ⚠ {error}
              </div>
            )}

            <p style={styles.disclaimer}>
              ⚕ For educational purposes only. Not a substitute for professional medical advice.
            </p>
          </div>

          {/* Right — Results */}
          <div style={styles.resultsCol}>
            {!result && !loading && (
              <div style={styles.emptyState}>
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{marginBottom: 16}}>
                  <polygon points="28,4 52,16 52,40 28,52 4,40 4,16" stroke="rgba(99,179,237,0.3)" strokeWidth="1.5" fill="none"/>
                  <polygon points="28,14 42,21 42,35 28,42 14,35 14,21" stroke="rgba(167,139,250,0.2)" strokeWidth="1" fill="none"/>
                  <circle cx="28" cy="28" r="5" fill="rgba(99,179,237,0.2)"/>
                </svg>
                <p style={styles.emptyTitle}>No assessment yet</p>
                <p style={styles.emptyDesc}>Fill in the patient parameters and run the assessment to see the diabetes risk score and SHAP explanation.</p>
              </div>
            )}

            {result && riskCfg && (
              <>
                {/* Risk verdict */}
                <div style={{...styles.riskCard, background: riskCfg.bg, borderColor: riskCfg.border}}>
                  <div style={styles.riskTop}>
                    <span style={{...styles.riskIcon, color: riskCfg.color}}>{riskCfg.icon}</span>
                    <div>
                      <p style={styles.riskLabel}>RISK ASSESSMENT</p>
                      <p style={{...styles.riskLevel, color: riskCfg.color}}>{riskCfg.label}</p>
                    </div>
                    <div style={styles.probCircle}>
                      <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.07)" strokeWidth="6" fill="none"/>
                        <circle cx="40" cy="40" r="34"
                          stroke={riskCfg.color}
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 34}`}
                          strokeDashoffset={`${2 * Math.PI * 34 * (1 - result.probability)}`}
                          strokeLinecap="round"
                          transform="rotate(-90 40 40)"
                          style={{transition:"stroke-dashoffset 1s ease"}}
                        />
                        <text x="40" y="37" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="monospace">
                          {(result.probability * 100).toFixed(1)}%
                        </text>
                        <text x="40" y="51" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="8" fontFamily="monospace">
                          RISK
                        </text>
                      </svg>
                    </div>
                  </div>
                  <p style={{...styles.riskMsg, color: riskCfg.color}}>{riskCfg.msg}</p>
                </div>

                {/* SHAP waterfall */}
                <div style={styles.shapCard}>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardLabel}>SHAP EXPLANATION</span>
                    <span style={styles.cardCount}>why this prediction?</span>
                  </div>

                  <div style={styles.shapBase}>
                    <span style={styles.shapBaseLabel}>Base value</span>
                    <span style={styles.shapBaseVal}>{result.base_value.toFixed(4)}</span>
                  </div>

                  {result.shap.map((item, i) => {
                    const pct  = (Math.abs(item.shap) / maxShap) * 100;
                    const pos  = item.shap > 0;
                    return (
                      <div key={i} style={styles.shapRow}>
                        <div style={styles.shapFeature}>
                          <span style={styles.shapName}>{item.feature}</span>
                          <span style={styles.shapVal}>{item.value % 1 === 0 ? item.value : item.value.toFixed(2)}</span>
                        </div>
                        <div style={styles.shapBarWrap}>
                          <div style={{
                            ...styles.shapBar,
                            width: `${pct}%`,
                            background: pos
                              ? "linear-gradient(90deg,#f87171,#fca5a5)"
                              : "linear-gradient(90deg,#60a5fa,#93c5fd)",
                            marginLeft: pos ? "50%" : `calc(50% - ${pct}%)`,
                            borderRadius: pos ? "0 4px 4px 0" : "4px 0 0 4px",
                          }} />
                          <div style={styles.shapCenter} />
                        </div>
                        <span style={{
                          ...styles.shapShap,
                          color: pos ? "#f87171" : "#60a5fa",
                        }}>
                          {item.shap > 0 ? "+" : ""}{item.shap.toFixed(4)}
                        </span>
                      </div>
                    );
                  })}

                  <div style={styles.shapLegend}>
                    <span style={{color:"#f87171"}}>■ Toward diabetes</span>
                    <span style={{color:"#60a5fa"}}>■ Toward healthy</span>
                  </div>

                  <div style={styles.shapOutput}>
                    <span style={styles.shapOutputLabel}>Model output</span>
                    <span style={{...styles.shapOutputVal, color: riskCfg.color}}>
                      {result.probability.toFixed(4)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080c14; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}

/* ── Styles ── */
const styles = {
  root: {
    minHeight: "100vh",
    background: "#080c14",
    fontFamily: "'DM Sans', sans-serif",
    color: "#e2e8f0",
    position: "relative",
    overflow: "hidden",
  },
  grain: {
    position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
  },
  orb: { position: "fixed", borderRadius: "50%", pointerEvents: "none", zIndex: 0 },
  container: { maxWidth: 1200, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 },

  header: {
    display: "flex", alignItems: "center", gap: 16, marginBottom: 36,
    paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  logoMark: {
    width: 48, height: 48, borderRadius: 12,
    background: "rgba(99,179,237,0.08)", border: "1px solid rgba(99,179,237,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  title: {
    fontFamily: "'Space Mono', monospace", fontSize: 22, fontWeight: 700,
    letterSpacing: "0.15em", color: "#e2e8f0",
  },
  titleAccent: { color: "#63b3ed" },
  subtitle: { fontSize: 13, color: "rgba(226,232,240,0.4)", marginTop: 2 },
  headerBadge: {
    marginLeft: "auto", fontSize: 11, fontFamily: "'Space Mono', monospace",
    color: "rgba(99,179,237,0.6)", border: "1px solid rgba(99,179,237,0.2)",
    borderRadius: 6, padding: "4px 10px", letterSpacing: "0.05em",
  },

  layout: { display: "grid", gridTemplateColumns: "420px 1fr", gap: 20, alignItems: "start" },

  card: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: 24, backdropFilter: "blur(12px)",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20,
  },
  cardLabel: {
    fontFamily: "'Space Mono', monospace", fontSize: 10,
    letterSpacing: "0.15em", color: "rgba(226,232,240,0.35)",
  },
  cardCount: { fontSize: 11, color: "rgba(99,179,237,0.6)" },

  fieldGrid: { display: "flex", flexDirection: "column", gap: 14 },
  fieldRow: {
    padding: "12px 14px", borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(255,255,255,0.02)", transition: "all 0.2s",
    cursor: "default",
  },
  fieldRowActive: {
    background: "rgba(99,179,237,0.05)",
    border: "1px solid rgba(99,179,237,0.2)",
  },
  fieldTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  fieldLabel: { fontSize: 13, fontWeight: 500, color: "#e2e8f0" },
  fieldUnit: {
    fontSize: 10, fontFamily: "'Space Mono', monospace",
    color: "rgba(226,232,240,0.3)", letterSpacing: "0.05em",
  },
  fieldDesc: { fontSize: 11, color: "rgba(226,232,240,0.35)", marginBottom: 8, lineHeight: 1.4 },
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7,
    padding: "7px 10px", fontSize: 15, fontWeight: 500,
    color: "#e2e8f0", fontFamily: "'Space Mono', monospace",
    outline: "none", marginBottom: 8,
  },
  rangeBar: {
    height: 3, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden",
  },
  rangeFill: {
    height: "100%", borderRadius: 2,
    background: "linear-gradient(90deg, #63b3ed, #a78bfa)",
    transition: "width 0.3s ease",
  },
  rangeLabels: {
    display: "flex", justifyContent: "space-between",
    fontSize: 10, color: "rgba(226,232,240,0.25)",
    fontFamily: "'Space Mono', monospace", marginTop: 3,
  },

  btn: {
    width: "100%", marginTop: 20, padding: "14px",
    background: "linear-gradient(135deg, #2b6cb0, #553c9a)",
    border: "none", borderRadius: 10, color: "white",
    fontSize: 14, fontWeight: 500, cursor: "pointer",
    transition: "opacity 0.2s, transform 0.1s",
    letterSpacing: "0.02em",
  },
  btnLoading: { opacity: 0.6, cursor: "not-allowed" },
  btnInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },
  spinner: {
    width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white", borderRadius: "50%",
    display: "inline-block", animation: "spin 0.7s linear infinite",
  },
  errorBox: {
    marginTop: 12, padding: "10px 14px", borderRadius: 8,
    background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)",
    fontSize: 13, color: "#f87171",
  },
  disclaimer: {
    marginTop: 16, fontSize: 11, color: "rgba(226,232,240,0.25)",
    textAlign: "center", lineHeight: 1.5,
  },

  resultsCol: { display: "flex", flexDirection: "column", gap: 16 },

  emptyState: {
    flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "60px 32px", textAlign: "center",
    background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 500, color: "rgba(226,232,240,0.4)", marginBottom: 8 },
  emptyDesc:  { fontSize: 13, color: "rgba(226,232,240,0.25)", lineHeight: 1.6, maxWidth: 280 },

  riskCard: {
    borderRadius: 14, border: "1px solid", padding: "20px 24px",
    animation: "fadeUp 0.4s ease both",
  },
  riskTop: { display: "flex", alignItems: "center", gap: 16, marginBottom: 12 },
  riskIcon: { fontSize: 32, lineHeight: 1 },
  riskLabel: { fontSize: 10, fontFamily: "'Space Mono', monospace", letterSpacing: "0.12em", color: "rgba(226,232,240,0.4)", marginBottom: 4 },
  riskLevel: { fontSize: 22, fontWeight: 700, fontFamily: "'Space Mono', monospace" },
  probCircle: { marginLeft: "auto" },
  riskMsg: { fontSize: 13, lineHeight: 1.6, opacity: 0.85 },

  shapCard: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 16, padding: 24, animation: "fadeUp 0.5s ease 0.1s both",
  },
  shapBase: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0", marginBottom: 12,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  shapBaseLabel: { fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(226,232,240,0.35)", letterSpacing: "0.08em" },
  shapBaseVal:   { fontSize: 12, fontFamily: "'Space Mono', monospace", color: "rgba(226,232,240,0.4)" },

  shapRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  shapFeature: { width: 190, flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center" },
  shapName: { fontSize: 12, color: "rgba(226,232,240,0.7)", fontWeight: 400 },
  shapVal:  { fontSize: 11, fontFamily: "'Space Mono', monospace", color: "rgba(226,232,240,0.35)" },
  shapBarWrap: { flex: 1, height: 14, position: "relative", background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden" },
  shapBar:     { height: "100%", position: "absolute", top: 0, transition: "width 0.6s ease" },
  shapCenter:  { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.15)" },
  shapShap:    { width: 64, textAlign: "right", fontSize: 11, fontFamily: "'Space Mono', monospace", flexShrink: 0 },

  shapLegend: {
    display: "flex", gap: 20, justifyContent: "center",
    fontSize: 11, color: "rgba(226,232,240,0.4)",
    margin: "12px 0 8px", fontFamily: "'Space Mono', monospace",
  },
  shapOutput: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 0 0", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8,
  },
  shapOutputLabel: { fontSize: 11, fontFamily: "'Space Mono', monospace", letterSpacing: "0.08em", color: "rgba(226,232,240,0.35)" },
  shapOutputVal:   { fontSize: 16, fontWeight: 700, fontFamily: "'Space Mono', monospace" },
};