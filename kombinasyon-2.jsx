import { useState, useMemo } from "react";

// ---- MATH ----
function gcd(a, b) {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}
function lcm(a, b) { return (a / gcd(a, b)) * b; }
function lcmArray(arr) {
  const f = arr.filter(x => x > 0);
  if (!f.length) return 0;
  return f.reduce((acc, v) => lcm(acc, v), f[0]);
}
function toIntOdd(floatOdd) {
  const str = floatOdd.toFixed(4);
  const dec = (str.split('.')[1] || '').replace(/0+$/, '').length;
  return Math.round(floatOdd * Math.pow(10, dec));
}
function cartesian(arrays) {
  return arrays.reduce((acc, arr) => {
    const r = [];
    acc.forEach(a => arr.forEach(b => r.push([...a, b])));
    return r;
  }, [[]]);
}
function parseOdds(text) {
  return text
    .split(/[\s,;]+/)
    .map(s => parseFloat(s.replace(',', '.')))
    .filter(n => !isNaN(n) && n > 1.0);
}

// ---- STYLES ----
const S = {
  wrap: { minHeight: "100vh", background: "#faf9f6", fontFamily: "'Georgia', 'Times New Roman', serif", padding: "28px 16px", color: "#111" },
  inner: { maxWidth: "980px", margin: "0 auto" },
  header: { borderBottom: "2px solid #111", paddingBottom: "14px", marginBottom: "28px" },
  h1: { fontSize: "24px", fontWeight: "bold", letterSpacing: "-0.5px", margin: 0 },
  sub: { color: "#999", fontSize: "12px", marginTop: "5px" },
  grid: { display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "24px", alignItems: "start" },
  card: { background: "#fff", border: "1px solid #e8e8e4", borderRadius: "10px", padding: "16px", marginBottom: "12px" },
  input: { border: "1px solid #e0e0dc", borderRadius: "6px", padding: "6px 9px", fontFamily: "Georgia, serif", fontSize: "13px", color: "#111", outline: "none", background: "#fff" },
  btnGhost: { background: "none", border: "1px dashed #ccc", borderRadius: "6px", color: "#aaa", fontSize: "12px", padding: "5px 12px", width: "100%", cursor: "pointer", fontFamily: "Georgia, serif", marginTop: "6px" },
  btnPrimary: { background: "#111", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", cursor: "pointer", width: "100%", fontFamily: "Georgia, serif", letterSpacing: "0.4px" },
  btnX: { background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: "15px", lineHeight: 1, padding: "0 3px", fontFamily: "Georgia, serif" },
  label: { fontSize: "10px", color: "#aaa", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" },
};

const INIT = [
  { id: 1, name: "Olay 1", outcomes: [{ label: "1", odd: "" }, { label: "X", odd: "" }, { label: "2", odd: "" }] },
  { id: 2, name: "Olay 2", outcomes: [{ label: "1", odd: "" }, { label: "X", odd: "" }, { label: "2", odd: "" }] },
];

export default function App() {
  const [events, setEvents] = useState(INIT);
  const [nextId, setNextId] = useState(3);
  const [budget, setBudget] = useState("");
  const [pasteModes, setPasteModes] = useState({});
  const [pasteTexts, setPasteTexts] = useState({});

  const addEvent = () => {
    setEvents(p => [...p, { id: nextId, name: `Olay ${nextId}`, outcomes: [{ label: "1", odd: "" }, { label: "X", odd: "" }, { label: "2", odd: "" }] }]);
    setNextId(n => n + 1);
  };
  const removeEvent = id => setEvents(p => p.filter(e => e.id !== id));
  const updateName = (id, v) => setEvents(p => p.map(e => e.id === id ? { ...e, name: v } : e));
  const addOutcome = id => setEvents(p => p.map(e => e.id === id ? { ...e, outcomes: [...e.outcomes, { label: `${e.outcomes.length + 1}`, odd: "" }] } : e));
  const removeOutcome = (id, i) => setEvents(p => p.map(e => e.id === id ? { ...e, outcomes: e.outcomes.filter((_, j) => j !== i) } : e));
  const updateOutcome = (id, i, f, v) => setEvents(p => p.map(e => e.id === id ? { ...e, outcomes: e.outcomes.map((o, j) => j === i ? { ...o, [f]: v } : o) } : e));

  const applyPaste = (id) => {
    const text = pasteTexts[id] || "";
    const odds = parseOdds(text);
    if (odds.length < 2) return;
    const newOutcomes = odds.map((odd, i) => ({ label: `${i + 1}`, odd: String(odd) }));
    setEvents(p => p.map(e => e.id === id ? { ...e, outcomes: newOutcomes } : e));
    setPasteModes(p => ({ ...p, [id]: false }));
    setPasteTexts(p => ({ ...p, [id]: "" }));
  };

  const result = useMemo(() => {
    const allFilled = events.every(e =>
      e.outcomes.length >= 2 && e.outcomes.every(o => o.odd !== "" && parseFloat(o.odd) > 1.0)
    );
    if (!allFilled) return null;
    const eventOutcomes = events.map(e => e.outcomes.map(o => ({ ev: e.name, label: o.label, odd: parseFloat(o.odd) })));
    const combos = cartesian(eventOutcomes);
    if (combos.length > 50000) return { tooMany: true, count: combos.length };
    const comboOdds = combos.map(combo => ({
      label: combo.map(o => `${o.ev}:${o.label}`).join(" | "),
      product: combo.reduce((a, o) => a * o.odd, 1),
    }));
    const intOdds = comboOdds.map(c => toIntOdd(c.product));
    const okek = lcmArray(intOdds);
    const stakes = comboOdds.map((c, i) => {
      const stake = okek / intOdds[i];
      return { ...c, stake, payout: stake * c.product };
    });
    const total = stakes.reduce((s, x) => s + x.stake, 0);
    const minPayout = Math.min(...stakes.map(x => x.payout));
    const profit = minPayout - total;
    const profitPct = (profit / total) * 100;
    const mn = Math.min(...stakes.map(x => x.stake));
    const norm = stakes.map(x => ({ ...x, stakeN: x.stake / mn, payoutN: x.payout / mn }));
    return { combos: norm, okek, totalN: total / mn, profitPct, hasArb: profit > 0.0001, count: combos.length, tooMany: false };
  }, [events]);

  const budgetNum = parseFloat(budget) || 0;
  const arb = result && !result.tooMany;
  const color = arb ? (result.hasArb ? "#1a9a5c" : "#d63b2f") : "#999";

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        <div style={S.header}>
          <h1 style={S.h1}>Kombinasyon Hesaplayıcı</h1>
          <p style={S.sub}>Olay ekle → manuel gir veya yapıştır → kombinasyonlar + OKEK + arbitraj</p>
        </div>

        <div style={S.grid}>
          {/* SOL */}
          <div>
            {events.map(ev => {
              const isPaste = !!pasteModes[ev.id];
              const parsedCount = parseOdds(pasteTexts[ev.id] || "").length;
              return (
                <div key={ev.id} style={S.card}>
                  {/* Başlık */}
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                    <input
                      value={ev.name}
                      onChange={e => updateName(ev.id, e.target.value)}
                      style={{ flex: 1, border: "none", borderBottom: "1px solid #ddd", fontSize: "14px", fontWeight: "bold", background: "transparent", outline: "none", padding: "2px 0", fontFamily: "Georgia, serif" }}
                    />
                    {/* Toggle */}
                    <div style={{ display: "flex", background: "#f0f0ec", borderRadius: "6px", padding: "2px" }}>
                      {["Manuel", "Yapıştır"].map((label, li) => {
                        const active = li === 0 ? !isPaste : isPaste;
                        return (
                          <button key={label} onClick={() => setPasteModes(p => ({ ...p, [ev.id]: li === 1 }))}
                            style={{ padding: "4px 10px", fontSize: "11px", cursor: "pointer", border: "none", fontFamily: "Georgia, serif", borderRadius: "5px", background: active ? "#111" : "transparent", color: active ? "#fff" : "#aaa", transition: "all .15s" }}>
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {events.length > 1 && <button style={S.btnX} onClick={() => removeEvent(ev.id)}>✕</button>}
                  </div>

                  {isPaste ? (
                    <div>
                      <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "6px" }}>
                        Oranları boşluk veya virgülle yapıştır — istediğin kadar
                      </div>
                      <textarea
                        value={pasteTexts[ev.id] || ""}
                        onChange={e => setPasteTexts(p => ({ ...p, [ev.id]: e.target.value }))}
                        placeholder={"2.71 3.21 1.91 1.46 1.13 1.20\nveya: 2.71, 3.21, 1.91"}
                        rows={4}
                        style={{ width: "100%", border: "1px solid #e0e0dc", borderRadius: "6px", padding: "8px 10px", fontFamily: "Georgia, serif", fontSize: "13px", color: "#111", outline: "none", resize: "vertical", boxSizing: "border-box", background: "#fafaf8" }}
                      />
                      {parsedCount > 0 && (
                        <div style={{ fontSize: "11px", color: "#888", marginTop: "5px" }}>
                          {parsedCount} oran algılandı: {parseOdds(pasteTexts[ev.id] || "").join(" · ")}
                        </div>
                      )}
                      <button
                        onClick={() => applyPaste(ev.id)}
                        disabled={parsedCount < 2}
                        style={{ ...S.btnPrimary, marginTop: "8px", opacity: parsedCount < 2 ? 0.4 : 1 }}
                      >
                        Uygula →
                      </button>
                    </div>
                  ) : (
                    <div>
                      {ev.outcomes.map((o, oi) => (
                        <div key={oi} style={{ display: "flex", gap: "7px", marginBottom: "7px", alignItems: "center" }}>
                          <input value={o.label} onChange={e => updateOutcome(ev.id, oi, "label", e.target.value)} placeholder="sonuç"
                            style={{ ...S.input, width: "56px", flexShrink: 0 }} />
                          <input type="number" step="0.01" min="1.01" value={o.odd}
                            onChange={e => updateOutcome(ev.id, oi, "odd", e.target.value)} placeholder="oran"
                            style={{ ...S.input, flex: 1, fontSize: "15px", fontWeight: "bold" }} />
                          {ev.outcomes.length > 2 && <button style={S.btnX} onClick={() => removeOutcome(ev.id, oi)}>✕</button>}
                        </div>
                      ))}
                      <button style={S.btnGhost} onClick={() => addOutcome(ev.id)}>+ sonuç ekle</button>
                      <div style={{ fontSize: "11px", color: "#bbb", marginTop: "6px", textAlign: "right" }}>
                        {ev.outcomes.filter(o => o.odd !== "" && parseFloat(o.odd) > 1).length} / {ev.outcomes.length} oran girildi
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button style={S.btnPrimary} onClick={addEvent}>+ Olay Ekle</button>
            {arb && (
              <div style={{ textAlign: "center", fontSize: "11px", color: "#bbb", marginTop: "8px" }}>
                {events.map(e => e.outcomes.length).join(" × ")} = {result.count} kombinasyon
              </div>
            )}
          </div>

          {/* SAĞ */}
          <div style={{ position: "sticky", top: "20px" }}>
            <div style={S.card}>
              <div style={S.label}>Test Bütçesi (₺)</div>
              <input type="number" placeholder="örn: 1000" value={budget} onChange={e => setBudget(e.target.value)}
                style={{ ...S.input, width: "100%", fontSize: "20px", fontWeight: "bold", padding: "8px 10px" }} />
            </div>

            {!result ? (
              <div style={{ ...S.card, padding: "36px 20px", textAlign: "center", color: "#bbb", fontSize: "13px" }}>
                Tüm oranları gir (her oran &gt; 1.00)
              </div>
            ) : result.tooMany ? (
              <div style={{ ...S.card, color: "#d63b2f", fontSize: "13px" }}>
                ⚠️ {result.count.toLocaleString()} kombinasyon — çok fazla.
              </div>
            ) : (
              <>
                <div style={{ background: result.hasArb ? "#f2fbf6" : "#fff7f6", border: `2px solid ${color}`, borderRadius: "10px", padding: "14px 18px", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "14px", color }}>{result.hasArb ? "✓ ARBİTRAJ VAR" : "✗ ARBİTRAJ YOK"}</div>
                    <div style={{ fontSize: "11px", color: "#aaa", marginTop: "3px" }}>
                      {result.count} kombinasyon · OKEK: {result.okek > 1e12 ? result.okek.toExponential(2) : result.okek.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: "bold", color, fontFamily: "Georgia, serif" }}>
                    {result.hasArb ? "+" : ""}{result.profitPct.toFixed(3)}%
                  </div>
                </div>

                <div style={{ background: "#fff", border: "1px solid #e8e8e4", borderRadius: "10px", overflow: "hidden", marginBottom: "12px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 76px 76px", gap: "6px", padding: "8px 12px", borderBottom: "1px solid #eee" }}>
                    {["Kombinasyon", "Yatır", "Gelir"].map((h, i) => (
                      <div key={h} style={{ ...S.label, marginBottom: 0, textAlign: i > 0 ? "right" : "left" }}>{h}</div>
                    ))}
                  </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {result.combos.map((c, i) => {
                      const sv = budgetNum > 0 ? (c.stakeN / result.totalN) * budgetNum : c.stakeN;
                      const pv = budgetNum > 0 ? (c.payoutN / result.totalN) * budgetNum : c.payoutN;
                      return (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 76px 76px", gap: "6px", padding: "7px 12px", borderBottom: "1px solid #f5f5f3", alignItems: "center", background: i % 2 ? "#faf9f6" : "#fff" }}>
                          <div style={{ fontSize: "11px", color: "#555", lineHeight: "1.45", wordBreak: "break-word" }}>{c.label}</div>
                          <div style={{ fontSize: "12px", fontWeight: "bold", textAlign: "right", fontFamily: "Georgia, serif" }}>
                            {budgetNum > 0 ? `${sv.toFixed(2)}₺` : sv.toFixed(2)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#1a9a5c", textAlign: "right", fontFamily: "Georgia, serif" }}>
                            {budgetNum > 0 ? `${pv.toFixed(2)}₺` : pv.toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 76px 76px", gap: "6px", padding: "9px 12px", borderTop: "2px solid #eee" }}>
                    <div style={{ fontSize: "12px", fontWeight: "bold" }}>TOPLAM</div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", textAlign: "right" }}>
                      {budgetNum > 0 ? `${budgetNum.toFixed(2)}₺` : result.totalN.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", color, textAlign: "right" }}>
                      {budgetNum > 0
                        ? `${result.hasArb ? "+" : ""}${(budgetNum * result.profitPct / 100).toFixed(2)}₺`
                        : `${result.hasArb ? "+" : ""}${result.profitPct.toFixed(3)}%`}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "11px", color: "#bbb", lineHeight: "1.7" }}>
                  <strong style={{ color: "#aaa" }}>OKEK yöntemi:</strong> Her kombinasyonun oranı tam sayıya çevrilir, OKEK alınır. Her kombinasyona OKEK ÷ kendi tam sayı oranı kadar birim yatırılır. Toplam yatırım &lt; minimum gelir → arbitraj.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
