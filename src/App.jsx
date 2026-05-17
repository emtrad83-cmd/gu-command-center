import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Flame,
  Heart,
  Plus,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Upload,
} from "lucide-react";

const todayISO = () => new Date().toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, "0");

const addDays = (iso, days) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const prettyDate = (iso) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const GOALS = [
  { key: "prosperity", label: "Prosperity", icon: "🌱", question: "Where did I plant a seed today before seeing the harvest?", anchor: "Give first. Plant seeds daily without waiting for the harvest." },
  { key: "wellness", label: "Wellness/Fitness", icon: "💪", question: "Did I treat my body like the asset that carries my mission?", anchor: "5am discipline, Vitruvian training, protein, recovery." },
  { key: "happiness", label: "Happiness", icon: "😊", question: "What thought did I choose today that served my future self?", anchor: "Choose thoughts that serve and build happiness through alignment." },
  { key: "freedom", label: "Freedom", icon: "🕊️", question: "What system, asset, or income action did I build today?", anchor: "Build systems and income streams beyond direct time." },
  { key: "wealth", label: "Wealth", icon: "💰", question: "What did I do today that the first multimillionaire in my family would do?", anchor: "Think and build like the first multimillionaire in the family." },
  { key: "travel", label: "Travel", icon: "✈️", question: "What disciplined action made future travel more possible?", anchor: "Plan it, earn it, book it." },
  { key: "discipline", label: "Discipline", icon: "⏰", question: "What choice did I make when no one else could see it?", anchor: "Discipline is my identity, not a goal." },
  { key: "magic", label: "Performing Magician", icon: "🎩", question: "What rep did I complete before I felt ready?", anchor: "Confidence comes from reps, not readiness." },
  { key: "mentor", label: "Ambassador Mentor", icon: "🏆", question: "How did I rise by lifting another GIVER today?", anchor: "Rise by lifting. Develop other GIVERs." },
  { key: "network", label: "Grow Network", icon: "🤝", question: "Who did I intentionally invest in or move closer today?", anchor: "Invest in like-minded GIVER relationships." },
];

const CHECKS = [
  { key: "wake5", label: "5am discipline", goal: "discipline", points: 1 },
  { key: "train", label: "Vitruvian / yoga / movement", goal: "wellness", points: 1 },
  { key: "protein", label: "Protein target", goal: "wellness", points: 1 },
  { key: "giveFirst", label: "Give-first action", goal: "prosperity", points: 1 },
  { key: "reachouts", label: "5 reach-outs", goal: "mentor", points: 1 },
  { key: "samples", label: "Sample / invite / 6-W advanced", goal: "mentor", points: 1 },
  { key: "magicReps", label: "Magic reps", goal: "magic", points: 1 },
  { key: "teamEvan", label: "Team EVAN / mission action", goal: "freedom", points: 1 },
  { key: "network", label: "Invested in one GIVER relationship", goal: "network", points: 1 },
  { key: "learn", label: "Lifelong learning / reflection", goal: "happiness", points: 1 },
];

const STAGES = ["New", "Curious", "Sample", "6-W", "Patron", "Mentor", "Nurture", "Passed"];

const PRIORITY_BANK = [
  {
    id: "movement-red",
    label: "10 min movement + protein goal",
    energy: ["red"],
    goal: "wellness",
    reason: "Red Day protects identity. Minimum movement keeps the vow alive.",
  },
  {
    id: "movement-yellow",
    label: "Vitruvian / yoga for 20 min + protein goal",
    energy: ["yellow"],
    goal: "wellness",
    reason: "Yellow Day maintains momentum and protects your energy.",
  },
  {
    id: "movement-green",
    label: "Vitruvian / yoga for 45 min + protein goal",
    energy: ["green"],
    goal: "wellness",
    reason: "Green Day compounds strength, energy, confidence, and discipline.",
  },
  {
    id: "one-reach",
    label: "Send one meaningful GU reach-out or follow-up",
    energy: ["red", "yellow", "green"],
    goal: "mentor",
    reason: "One planted seed prevents business drift.",
  },
  {
    id: "five-reach",
    label: "Complete the 5 reach-out cadence",
    energy: ["green", "yellow"],
    goal: "mentor",
    reason: "Consistent outreach makes Master Mentor predictable.",
  },
  {
    id: "sample-sixw",
    label: "Move one person toward a sample, 6-W, or patron step",
    energy: ["green", "yellow"],
    goal: "mentor",
    reason: "This is a multiplication action, not maintenance.",
  },
  {
    id: "magic-floor",
    label: "Practice one core magic trick 5 times",
    energy: ["red", "yellow"],
    goal: "magic",
    reason: "Confidence comes from reps, not readiness.",
  },
  {
    id: "magic-full",
    label: "Practice all three core tricks until clean",
    energy: ["green"],
    goal: "magic",
    reason: "Automatic skill creates performance confidence.",
  },
  {
    id: "give-first",
    label: "Do one give-first action for someone with no expectation",
    energy: ["red", "yellow", "green"],
    goal: "prosperity",
    reason: "Prosperity follows the GIVER who plants seeds.",
  },
  {
    id: "relationship",
    label: "Invest in one GIVER relationship",
    energy: ["yellow", "green"],
    goal: "network",
    reason: "Your BDD is built through people, not isolation.",
  },
  {
    id: "system",
    label: "Build or improve one small system for GU or Team EVAN",
    energy: ["green"],
    goal: "freedom",
    reason: "Freedom comes from systems that create value beyond your presence.",
  },
  {
    id: "wisdom",
    label: "Capture one lesson in reflection",
    energy: ["red", "yellow", "green"],
    goal: "happiness",
    reason: "Lifelong learning turns experience into character.",
  },
];

const SUPABASE_ROW_ID = "evan-main-hub";

const blankLog = (date) => ({
  date,
  energy: "yellow",
  todayWin: [],
  checks: {},
  reachOuts: [],
  samples: 0,
  sixW: 0,
  mentors: 0,
  directMentorEnrolled: false,
  mentorHelpedEnroll: false,
  coreTricksPracticed: 0,
  audienceRep: false,
  incomeSystemAction: false,
  reflections: {
    give: "",
    wisdom: "",
    vow: "",
    shift: "",
  },
});

function scoreLog(log) {
  const checkScore = CHECKS.reduce(
    (sum, c) => sum + (log.checks?.[c.key] ? c.points : 0),
    0
  );

  const cadenceScore =
    Math.min((log.reachOuts?.length || 0) / 5, 1) * 2 +
    Math.min((log.samples || 0) / 3, 1) +
    Math.min(log.sixW || 0, 1);

  const goalScore =
    (log.directMentorEnrolled ? 1 : 0) +
    (log.mentorHelpedEnroll ? 1 : 0) +
    (log.incomeSystemAction ? 1 : 0) +
    (log.audienceRep ? 1 : 0);

  return Math.round(checkScore + cadenceScore + goalScore);
}

function isShipped(log) {
  const core = log.checks?.giveFirst && log.checks?.learn;
  const wellness = log.checks?.train || log.checks?.protein;
  const business =
    (log.reachOuts?.length || 0) >= 1 ||
    log.samples > 0 ||
    log.sixW > 0 ||
    log.directMentorEnrolled ||
    log.mentorHelpedEnroll;

  return Boolean(core && wellness && business);
}

function streak(logs, predicate) {
  let count = 0;
  let d = todayISO();

  while (true) {
    const log = logs[d];
    if (!log || !predicate(log)) break;
    count += 1;
    d = addDays(d, -1);
  }

  return count;
}

function recentNeglect(logs, goal, days = 4) {
  for (let i = 0; i < days; i++) {
    const d = addDays(todayISO(), -i);
    const l = logs[d];
    if (!l) continue;

    const hit = CHECKS.some((c) => c.goal === goal && l.checks?.[c.key]);
    if (hit) return false;
  }

  return true;
}

function suggestPriorities(log, logs) {
  const energy = log.energy || "yellow";

  const scored = PRIORITY_BANK
    .filter((p) => p.energy.includes(energy))
    .map((p) => {
      let score = 1;

      if (["mentor", "wellness", "discipline"].includes(p.goal)) score += 2;
      if (recentNeglect(logs, p.goal)) score += 2;

      if (
        energy === "red" &&
        ["movement-red", "one-reach", "magic-floor", "wisdom", "give-first"].includes(p.id)
      ) {
        score += 3;
      }

      if (
        energy === "yellow" &&
        ["movement-yellow", "five-reach", "sample-sixw", "magic-floor", "relationship"].includes(p.id)
      ) {
        score += 2;
      }

      if (
        energy === "green" &&
        ["movement-green", "five-reach", "sample-sixw", "system", "magic-full"].includes(p.id)
      ) {
        score += 2;
      }

      if (log.todayWin?.includes(p.id)) score += 4;

      return { ...p, score };
    });

  return scored.sort((a, b) => b.score - a.score).slice(0, 3);
}

export default function App() {
  const [state, setState] = useState({ logs: {}, prospects: [] });
  const [supabaseLoaded, setSupabaseLoaded] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState("dashboard");
  const [newProspect, setNewProspect] = useState({
    name: "",
    stage: "New",
    next: "",
    tension: "",
  });

  const log = state.logs[date] || blankLog(date);
  const priorities = suggestPriorities(log, state.logs);

  const setLog = (updater) => {
    setState((s) => {
      const current = s.logs[date] || blankLog(date);
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...s, logs: { ...s.logs, [date]: next } };
    });
  };

  useEffect(() => {
    async function loadFromSupabase() {
      const { data, error } = await supabase
        .from("giver_hub_state")
        .select("data")
        .eq("id", SUPABASE_ROW_ID)
        .single();

      if (error && error.code !== "PGRST116") {
        alert("Supabase load error: " + error.message);
        console.error("Supabase load error:", error);
        setSupabaseLoaded(true);
        return;
      }

      if (data?.data) {
        setState(data.data);
      }

      setSupabaseLoaded(true);
    }

    loadFromSupabase();
  }, []);

  useEffect(() => {
    if (!supabaseLoaded) return;

    async function saveToSupabase() {
      const { error } = await supabase.from("giver_hub_state").upsert({
        id: SUPABASE_ROW_ID,
        data: state,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        alert("Supabase save error: " + error.message);
        console.error("Supabase save error:", error);
      } else {
        console.log("Saved to Supabase", state);
      }
    }

    saveToSupabase();
  }, [state, supabaseLoaded]);

  const stats = useMemo(() => {
    const logs = state.logs;
    const all = Object.values(logs);

    return {
      shippedStreak: streak(logs, isShipped),
      disciplineStreak: streak(logs, (l) => l.checks?.wake5 || l.checks?.train),
      votes: all.reduce((sum, l) => sum + scoreLog(l), 0),
      reachOuts: all.reduce((sum, l) => sum + (l.reachOuts?.length || 0), 0),
      samples: all.reduce((sum, l) => sum + (l.samples || 0), 0),
      sixW: all.reduce((sum, l) => sum + (l.sixW || 0), 0),
      mentors: all.reduce((sum, l) => sum + (l.mentors || 0), 0),
      master:
        Number(all.some((l) => l.directMentorEnrolled)) +
        Number(all.some((l) => l.mentorHelpedEnroll)),
    };
  }, [state]);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evans-giver-hub-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed.logs && parsed.prospects) setState(parsed);
      } catch {
        alert("Could not import this file.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div>
            <div className="brand-kicker">
              <Sparkles size={14} /> Evan's GIVER Daily Lifestyle Hub
            </div>
            <h1>Lifestyle + Mission Command Center</h1>
            <div className="subtitle">Give first. Keep vows. Build predictive results.</div>
          </div>

          <div className="tabs">
            {["dashboard", "daily", "goals", "pipeline", "review"].map((t) => (
              <button
                key={t}
                className={`tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="main">
        {tab === "dashboard" && (
          <>
            <div className="grid stats-grid">
              <Stat icon={<Flame />} label="Shipped Streak" value={stats.shippedStreak} />
              <Stat icon={<Target />} label="Discipline Streak" value={stats.disciplineStreak} />
              <Stat icon={<Heart />} label="Identity Votes" value={stats.votes} />
              <Stat icon={<Trophy />} label="Master Mentor" value={`${stats.master}/2`} />
            </div>

            <section className="card priority-card">
              <p className="eyebrow">Today’s Win</p>
              <h2 className="section-title">Your 1–3 most important actions</h2>
              <p className="section-sub">
                Chosen from your energy, BDD, P.E.R. goals, and neglected momentum areas.
              </p>

              <div className="energy-row">
                {[
                  ["green", "Green Day"],
                  ["yellow", "Yellow Day"],
                  ["red", "Red Day"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className={`energy-btn ${log.energy === key ? "active" : ""}`}
                    onClick={() => setLog((l) => ({ ...l, energy: key }))}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="priority-list">
                {priorities.map((p, i) => (
                  <div className="priority" key={p.id}>
                    <div className="priority-left">
                      <div className="priority-num">{i + 1}</div>
                      <div>
                        <div className="priority-title">{p.label}</div>
                        <div className="priority-reason">{p.reason}</div>
                      </div>
                    </div>

                    <button
                      className={`btn ${log.todayWin?.includes(p.id) ? "active" : ""}`}
                      onClick={() =>
                        setLog((l) => ({
                          ...l,
                          todayWin: l.todayWin?.includes(p.id)
                            ? l.todayWin.filter((x) => x !== p.id)
                            : [...(l.todayWin || []), p.id],
                        }))
                      }
                    >
                      {log.todayWin?.includes(p.id) ? "Locked" : "Lock In"}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2 className="section-title">Daily GIVER Alignment</h2>
              <p className="section-sub">Vote for the identity you want to become.</p>

              <div className="alignment-grid">
                {CHECKS.map((c) => (
                  <CheckTile
                    key={c.key}
                    checked={Boolean(log.checks?.[c.key])}
                    label={c.label}
                    sub={GOALS.find((g) => g.key === c.goal)?.label}
                    onClick={() =>
                      setLog((l) => ({
                        ...l,
                        checks: { ...l.checks, [c.key]: !l.checks?.[c.key] },
                      }))
                    }
                  />
                ))}
              </div>
            </section>
          </>
        )}

        {tab === "daily" && (
          <div className="grid">
            <section className="card">
              <p className="eyebrow">Daily Log</p>
              <h2 className="section-title">{prettyDate(date)}</h2>

              <div className="energy-row">
                <button className="btn" onClick={() => setDate(addDays(date, -1))}>
                  <ChevronLeft size={16} /> Prev
                </button>

                <input
                  className="input"
                  style={{ maxWidth: 220 }}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />

                <button
                  className="btn"
                  disabled={date >= todayISO()}
                  onClick={() => setDate(addDays(date, 1))}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </section>

            <div className="grid two-col">
              <section className="card">
                <h2 className="section-title">Daily GIVER Alignment</h2>

                <div className="alignment-grid">
                  {CHECKS.map((c) => (
                    <CheckTile
                      key={c.key}
                      checked={Boolean(log.checks?.[c.key])}
                      label={c.label}
                      sub={GOALS.find((g) => g.key === c.goal)?.label}
                      onClick={() =>
                        setLog((l) => ({
                          ...l,
                          checks: { ...l.checks, [c.key]: !l.checks?.[c.key] },
                        }))
                      }
                    />
                  ))}
                </div>
              </section>

              <section className="card">
                <h2 className="section-title">Business Cadence</h2>

                <div className="form-grid">
                  <Counter
                    label="Samples offered"
                    value={log.samples || 0}
                    onChange={(v) => setLog((l) => ({ ...l, samples: Math.max(0, v) }))}
                  />

                  <Counter
                    label="6-W conversations"
                    value={log.sixW || 0}
                    onChange={(v) => setLog((l) => ({ ...l, sixW: Math.max(0, v) }))}
                  />

                  <Counter
                    label="New mentors"
                    value={log.mentors || 0}
                    onChange={(v) => setLog((l) => ({ ...l, mentors: Math.max(0, v) }))}
                  />

                  <Counter
                    label="Core tricks practiced"
                    value={log.coreTricksPracticed || 0}
                    onChange={(v) =>
                      setLog((l) => ({ ...l, coreTricksPracticed: Math.max(0, v) }))
                    }
                  />
                </div>
              </section>
            </div>

            <section className="card">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <h2 className="section-title">Reach-Outs</h2>

                <button
                  className="btn primary"
                  onClick={() => setLog((l) => ({ ...l, reachOuts: [...(l.reachOuts || []), ""] }))}
                >
                  <Plus size={16} /> Add
                </button>
              </div>

              <div className="alignment-grid">
                {(log.reachOuts || []).map((name, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 8 }}>
                    <input
                      className="input"
                      value={name}
                      placeholder={`Reach-out ${idx + 1}`}
                      onChange={(e) =>
                        setLog((l) => ({
                          ...l,
                          reachOuts: l.reachOuts.map((x, i) =>
                            i === idx ? e.target.value : x
                          ),
                        }))
                      }
                    />

                    <button
                      className="btn"
                      onClick={() =>
                        setLog((l) => ({
                          ...l,
                          reachOuts: l.reachOuts.filter((_, i) => i !== idx),
                        }))
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2 className="section-title">GIVERS Reflection Questions</h2>

              <div className="grid reflection-grid">
                <TextArea
                  label="1. How did I GIVE first today?"
                  value={log.reflections.give}
                  onChange={(v) =>
                    setLog((l) => ({
                      ...l,
                      reflections: { ...l.reflections, give: v },
                    }))
                  }
                />

                <TextArea
                  label="2. What Wisdom did I gain or apply?"
                  value={log.reflections.wisdom}
                  onChange={(v) =>
                    setLog((l) => ({
                      ...l,
                      reflections: { ...l.reflections, wisdom: v },
                    }))
                  }
                />

                <TextArea
                  label="3. What vow did I keep when it was inconvenient?"
                  value={log.reflections.vow}
                  onChange={(v) =>
                    setLog((l) => ({
                      ...l,
                      reflections: { ...l.reflections, vow: v },
                    }))
                  }
                />

                <TextArea
                  label="4. What will I shift tomorrow?"
                  value={log.reflections.shift}
                  onChange={(v) =>
                    setLog((l) => ({
                      ...l,
                      reflections: { ...l.reflections, shift: v },
                    }))
                  }
                />
              </div>
            </section>
          </div>
        )}

        {tab === "goals" && (
          <div className="grid goal-grid">
            {GOALS.map((g) => {
              const count = Object.values(state.logs).reduce(
                (sum, l) =>
                  sum + CHECKS.filter((c) => c.goal === g.key && l.checks?.[c.key]).length,
                0
              );

              return (
                <section className="card" key={g.key}>
                  <div className="goal-icon">{g.icon}</div>
                  <div className="goal-title">{g.label}</div>
                  <p className="section-sub">{g.anchor}</p>
                  <div className="goal-question">{g.question}</div>
                  <p className="section-sub" style={{ marginTop: 12 }}>
                    <strong>{count}</strong> tracked alignment votes
                  </p>
                </section>
              );
            })}
          </div>
        )}

        {tab === "pipeline" && (
          <div className="grid">
            <section className="card">
              <h2 className="section-title">Add Prospect / Relationship</h2>

              <div className="grid alignment-grid">
                <input
                  className="input"
                  placeholder="Name"
                  value={newProspect.name}
                  onChange={(e) => setNewProspect({ ...newProspect, name: e.target.value })}
                />

                <select
                  className="input"
                  value={newProspect.stage}
                  onChange={(e) => setNewProspect({ ...newProspect, stage: e.target.value })}
                >
                  {STAGES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>

                <input
                  className="input"
                  placeholder="Tension point"
                  value={newProspect.tension}
                  onChange={(e) => setNewProspect({ ...newProspect, tension: e.target.value })}
                />

                <input
                  className="input"
                  placeholder="Next step"
                  value={newProspect.next}
                  onChange={(e) => setNewProspect({ ...newProspect, next: e.target.value })}
                />
              </div>

              <button
                className="btn primary"
                style={{ marginTop: 14 }}
                onClick={() => {
                  if (!newProspect.name.trim()) return;

                  setState((s) => ({
                    ...s,
                    prospects: [
                      {
                        ...newProspect,
                        id: crypto.randomUUID(),
                        updated: todayISO(),
                      },
                      ...s.prospects,
                    ],
                  }));

                  setNewProspect({ name: "", stage: "New", next: "", tension: "" });
                }}
              >
                Add Prospect
              </button>
            </section>

            {state.prospects.map((p) => (
              <section className="prospect" key={p.id}>
                <div className="prospect-name">
                  {p.name}
                  <span className="badge">{p.stage}</span>
                </div>

                <p className="section-sub">
                  <strong>Tension:</strong> {p.tension || "—"}
                </p>

                <p className="section-sub">
                  <strong>Next:</strong> {p.next || "—"}
                </p>
              </section>
            ))}
          </div>
        )}

        {tab === "review" && (
          <section className="card">
            <h2 className="section-title">Weekly Review</h2>

            <div className="grid stats-grid" style={{ marginTop: 16 }}>
              <Stat label="Reach-Outs" value={stats.reachOuts} />
              <Stat label="Samples" value={stats.samples} />
              <Stat label="6-W" value={stats.sixW} />
              <Stat label="Mentors" value={stats.mentors} />
            </div>

            <div className="review-box">
              <p className="eyebrow">GIVERS Review Prompt</p>
              <h3>Where did I plant seeds, keep vows, and create predictive momentum?</h3>
              <p className="section-sub">
                Use this page each Sunday to compare your actions against your stated P.E.R. goals.
              </p>
            </div>

            <div className="energy-row">
              <button className="btn primary" onClick={exportData}>
                <Download size={16} /> Export Data
              </button>

              <label className="btn">
                <Upload size={16} /> Import Data
                <input
                  style={{ display: "none" }}
                  type="file"
                  accept="application/json"
                  onChange={(e) => importData(e.target.files?.[0])}
                />
              </label>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <section className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="stat-number">{value}</div>
          <div className="stat-label">{label}</div>
        </div>

        <div style={{ color: "var(--blue)" }}>{icon}</div>
      </div>
    </section>
  );
}

function CheckTile({ checked, label, sub, onClick }) {
  return (
    <button className={`check-tile ${checked ? "done" : ""}`} onClick={onClick}>
      <span className="checkbox">{checked ? <Check size={18} /> : ""}</span>

      <span>
        <span className="check-title">{label}</span>
        {sub && <span className="check-sub">{sub}</span>}
      </span>
    </button>
  );
}

function Counter({ label, value, onChange }) {
  return (
    <div className="counter">
      <span className="counter-label">{label}</span>

      <span className="counter-controls">
        <button className="btn" onClick={() => onChange(value - 1)}>
          -
        </button>

        <span className="counter-value">{value}</span>

        <button className="btn" onClick={() => onChange(value + 1)}>
          +
        </button>
      </span>
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label>
      <span className="label">{label}</span>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}