p · JSX
import { useState, useEffect, useRef, useCallback } from "react";
import { Flag, Users, ChevronRight, Radio, Settings, Plus, X, Clipboard, Lock } from "lucide-react";
import Papa from "papaparse";
 
// ---- Default course data (Denham GC, Spring Meeting) — fully editable in-app now ----
const DEFAULT_COURSE = {
  name: "Old Radleian Golfing Society",
  eventName: "Spring Meeting",
  holes: [
    { par: 4, si: 17 }, { par: 4, si: 11 }, { par: 4, si: 3 }, { par: 4, si: 9 },
    { par: 3, si: 13 }, { par: 4, si: 5 }, { par: 4, si: 1 }, { par: 3, si: 15 },
    { par: 4, si: 7 }, { par: 4, si: 12 }, { par: 4, si: 4 }, { par: 3, si: 16 },
    { par: 5, si: 8 }, { par: 5, si: 14 }, { par: 4, si: 2 }, { par: 3, si: 18 },
    { par: 4, si: 6 }, { par: 4, si: 10 },
  ],
  tees: [
    { id: "W", label: "White", cr: 72.0, slope: 129 },
    { id: "Y", label: "Yellow", cr: 70.7, slope: 127 },
  ],
};
 
const DEFAULT_ORG_NAME = "Old Radleian Golfing Society";
const STORAGE_KEY = "golf-live-scoreboard-v2";
const LIBRARY_KEY = "golf-course-library-v1";
const OUT = [1,2,3,4,5,6,7,8,9], IN = [10,11,12,13,14,15,16,17,18];
 
function coursePar(course) {
  return course.holes.reduce((sum, h) => sum + Number(h.par || 0), 0);
}
 
function getTee(course, teeId) {
  return course.tees.find((t) => t.id === teeId) || course.tees[0];
}
 
function playingHandicap(course, index, teeId) {
  const t = getTee(course, teeId);
  if (!t) return 0;
  return Math.round(index * (t.slope / 113) + (t.cr - coursePar(course)));
}
 
function strokesOnHole(course, ph, holeIdx) {
  const si = course.holes[holeIdx].si;
  let s = ph >= si ? 1 : 0;
  if (ph > 18) s += (ph - 18) >= si ? 1 : 0;
  return s;
}
 
function holePoints(course, gross, holeIdx, ph) {
  if (gross == null || gross === "") return null;
  const net = Number(gross) - strokesOnHole(course, ph, holeIdx);
  return Math.max(0, 2 - (net - course.holes[holeIdx].par));
}
 
function totals(course, player) {
  const ph = playingHandicap(course, Number(player.index) || 0, player.tee);
  let pts = 0, thru = 0;
  player.scores.forEach((g, i) => {
    const p = holePoints(course, g, i, ph);
    if (p !== null) { pts += p; thru += 1; }
  });
  return { ph, pts, thru };
}
 
function emptyPlayer(course) {
  return { id: crypto.randomUUID(), name: "", index: "", tee: course.tees[0]?.id || "W", scores: Array(18).fill("") };
}
 
// ---- Spreadsheet import via paste (no native file picker in this sandbox) ----
// Accepts rows copied straight out of Excel / Numbers / Google Sheets, with
// or without a header row, tab- or comma-separated: Name, Handicap Index, Tee.
function parsePastedPlayers(text, course) {
  // Real spreadsheet copy/paste always separates columns with tabs, never
  // commas — forcing tab-only parsing means a comma inside a name (e.g.
  // "Bailey, William") stays intact as one field instead of being split.
  const parsed = Papa.parse(text.trim(), { delimiter: "\t", skipEmptyLines: true });
  let rows = parsed.data;
  if (rows.length === 0) return [];
 
  // If the second column of the first row isn't a plausible handicap number,
  // treat that row as a header and drop it.
  const first = rows[0];
  const secondCell = (first[1] || "").replace(",", ".").trim();
  if (first.length > 1 && secondCell !== "" && isNaN(Number(secondCell))) {
    rows = rows.slice(1);
  }
 
  return rows
    .map((cols) => {
      const name = (cols[0] || "").trim();
      const index = (cols[1] || "").trim();
      const teeRaw = (cols[2] || "").trim().toLowerCase();
      let teeId = course.tees[0]?.id || "";
      if (teeRaw) {
        const match = course.tees.find(
          (t) => t.label.toLowerCase() === teeRaw || t.id.toLowerCase() === teeRaw
        );
        if (match) teeId = match.id;
      }
      return { id: crypto.randomUUID(), name, index, tee: teeId, scores: Array(18).fill("") };
    })
    .filter((p) => p.name);
}
 
function isValidCourse(c) {
  return !!c && Array.isArray(c.holes) && c.holes.length > 0 && Array.isArray(c.tees) && c.tees.length > 0;
}
 
const DEFAULT_PIN = "1234";
 
const DEFAULT_STATE = {
  orgName: DEFAULT_ORG_NAME,
  accentColor: "#D6006D",
  headerColor: "#6E1E42",
  pin: DEFAULT_PIN,
  course: DEFAULT_COURSE,
  players: [],
};
 
function sanitizeState(parsed) {
  return {
    orgName: typeof parsed.orgName === "string" && parsed.orgName ? parsed.orgName : DEFAULT_ORG_NAME,
    accentColor: typeof parsed.accentColor === "string" && parsed.accentColor ? parsed.accentColor : DEFAULT_STATE.accentColor,
    headerColor: typeof parsed.headerColor === "string" && parsed.headerColor ? parsed.headerColor : DEFAULT_STATE.headerColor,
    pin: typeof parsed.pin === "string" && parsed.pin ? parsed.pin : DEFAULT_PIN,
    // A prior bug could have saved bad data (course overwritten with the
    // players array). Validate shape before trusting it, so a corrupted
    // save can't keep crashing every future load — it just resets to
    // the default course instead, and self-heals on the next real save.
    course: isValidCourse(parsed.course) ? parsed.course : DEFAULT_COURSE,
    players: Array.isArray(parsed.players) ? parsed.players : [],
  };
}
 
export default function App() {
  const [mode, setMode] = useState("board"); // board | scorer
  // All persisted event state lives in one object now, saved with a single
  // functional update (setState(prev => ({...prev, ...patch}))) — this
  // avoids the class of bug where a stale positional argument silently
  // clobbers a different field than intended.
  const [state, setState] = useState(DEFAULT_STATE);
  const { orgName, accentColor, headerColor, pin, course, players } = state;
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [showCourseSetup, setShowCourseSetup] = useState(false);
  const [library, setLibrary] = useState([]);
  // Unlocking Scorer entry is per-browser-tab, not persisted — anyone who
  // knows the PIN can enter it fresh each time they open the link, which
  // is the point (keeps casual players from fumbling into edit mode).
  const [scorerUnlocked, setScorerUnlocked] = useState(false);
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const pollRef = useRef(null);
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
 
  const load = useCallback(async () => {
    try {
      const res = await window.storage.get(STORAGE_KEY, true);
      if (modeRef.current !== "board") return;
      setState(res ? sanitizeState(JSON.parse(res.value)) : DEFAULT_STATE);
      setLive(true);
    } catch (err) {
      if (modeRef.current !== "board") return;
      if (String(err).toLowerCase().includes("not found") || String(err).toLowerCase().includes("404")) {
        setState(DEFAULT_STATE);
      }
      setLive(true);
    } finally {
      setLoading(false);
    }
  }, []);
 
  // patch is a partial update — e.g. save({ players: next }) or
  // save({ course: nextCourse }) — merged onto the latest state via the
  // functional setState form, so it's always correct even if several
  // saves fire close together.
  const save = useCallback((patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      window.storage.set(STORAGE_KEY, JSON.stringify(next), true).catch(() => {
        // ignore transient failures; local state still reflects the change
      });
      return next;
    });
  }, []);
 
  // A named library of course setups, stored separately from the live
  // event data — this is what lets you come back next year, load last
  // year's course, and start a clean sheet of players.
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(LIBRARY_KEY, true);
        setLibrary(res ? JSON.parse(res.value) : []);
      } catch {
        setLibrary([]);
      }
    })();
  }, []);
 
  const saveCourseToLibrary = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const existing = library.find((e) => e.name.toLowerCase() === trimmed.toLowerCase());
    const entry = { id: existing ? existing.id : crypto.randomUUID(), name: trimmed, course };
    const next = existing ? library.map((e) => (e.id === existing.id ? entry : e)) : [...library, entry];
    setLibrary(next);
    try {
      await window.storage.set(LIBRARY_KEY, JSON.stringify(next), true);
    } catch {
      // local list still reflects the save even if the write failed
    }
  };
 
  const loadCourseFromLibrary = (entry) => {
    // Loading a different course means a different meeting — start with
    // a clean player list rather than mixing last year's scores in.
    save({ course: entry.course, players: [] });
  };
 
  const deleteCourseFromLibrary = async (id) => {
    const next = library.filter((e) => e.id !== id);
    setLibrary(next);
    try {
      await window.storage.set(LIBRARY_KEY, JSON.stringify(next), true);
    } catch {
      // ignore
    }
  };
 
  useEffect(() => {
    load();
  }, [load]);
 
  useEffect(() => {
    if (mode !== "board") return;
    pollRef.current = setInterval(load, 5000);
    return () => clearInterval(pollRef.current);
  }, [mode, load]);
 
  const addPlayer = () => {
    const next = [...players, emptyPlayer(course)];
    save({ players: next });
    setActiveId(next[next.length - 1].id);
  };
 
  const importPlayers = (newPlayers) => {
    save({ players: [...players, ...newPlayers] });
  };
 
  const loadExample = () => save({ players: exampleSeed(course) });
 
  const updatePlayer = (id, patch) => {
    save({ players: players.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  };
 
  const updateScore = (id, holeIdx, val) => {
    const clean = val === "" ? "" : Math.max(0, Math.min(15, Number(val)));
    save({
      players: players.map((p) =>
        p.id === id
          ? { ...p, scores: p.scores.map((s, i) => (i === holeIdx ? clean : s)) }
          : p
      ),
    });
  };
 
  const removePlayer = (id) => save({ players: players.filter((p) => p.id !== id) });
 
  const clearAllPlayers = () => save({ players: [] });
 
  const updateCourse = (patch) => save({ course: { ...course, ...patch } });
 
  const updateOrgName = (name) => save({ orgName: name });
 
  const updateAccentColor = (color) => save({ accentColor: color });
 
  const updateHeaderColor = (color) => save({ headerColor: color });
 
  const updatePin = (newPin) => save({ pin: newPin });
 
  const handleScorerTap = () => {
    if (scorerUnlocked) {
      setMode("scorer");
    } else {
      setShowPinPrompt(true);
    }
  };
 
  const ranked = [...players]
    .map((p) => ({ ...p, ...totals(course, p) }))
    .sort((a, b) => b.pts - a.pts || b.thru - a.thru);
 
  const active = players.find((p) => p.id === activeId);
 
  return (
    <div style={{ background: "#F1EFE3", minHeight: "100vh", fontFamily: "'Iowan Old Style','Georgia',serif", color: "#1B1B1B" }}>
      <style>{`
        .mono { font-family: 'Courier New', ui-monospace, monospace; }
        .scoreInput::-webkit-outer-spin-button, .scoreInput::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .scoreInput { -moz-appearance: textfield; }
      `}</style>
 
      {/* Header */}
      <div style={{ background: headerColor, color: "#F1EFE3", padding: "18px 16px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Flag size={20} color={accentColor} />
            <span style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.75 }}>
              {orgName}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, opacity: 0.85 }}>
            <Radio size={13} color={live ? "#7FB88F" : accentColor} />
            {live ? "Live" : "Connecting…"}
          </div>
        </div>
        <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, letterSpacing: "-0.01em" }}>
          {course.eventName}
        </div>
        <div style={{ fontSize: 13, opacity: 0.85, marginTop: 1 }}>
          {course.name}
        </div>
        <div style={{ fontSize: 12.5, opacity: 0.7, marginTop: 2 }}>
          Stableford · Par {coursePar(course)} · {players.length} {players.length === 1 ? "player" : "players"}
        </div>
 
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          <button
            onClick={() => { setMode("board"); setShowCourseSetup(false); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "board" ? "#F1EFE3" : "transparent",
              color: mode === "board" ? headerColor : "#F1EFE3",
              fontSize: 12.5, fontWeight: 600, letterSpacing: "0.03em",
            }}
          >
            Leaderboard
          </button>
          <button
            onClick={handleScorerTap}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 7, border: "1px solid rgba(241,239,227,0.25)",
              background: mode === "scorer" ? "#F1EFE3" : "transparent",
              color: mode === "scorer" ? headerColor : "#F1EFE3",
              fontSize: 12.5, fontWeight: 600, letterSpacing: "0.03em",
            }}
          >
            Scorer entry
          </button>
        </div>
      </div>
 
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6B6B5F" }}>Loading…</div>
      ) : mode === "board" ? (
        <Board course={course} ranked={ranked} headerColor={headerColor} accentColor={accentColor} />
      ) : !scorerUnlocked ? (
        // Guard: mode can only reach "scorer" via handleScorerTap, which
        // requires scorerUnlocked — but if that state is ever false here
        // (e.g. a stale render), fall back to the board rather than
        // exposing the scorer screens.
        <Board course={course} ranked={ranked} headerColor={headerColor} accentColor={accentColor} />
      ) : showCourseSetup ? (
        <CourseSetup
          orgName={orgName}
          onUpdateOrgName={updateOrgName}
          accentColor={accentColor}
          onUpdateAccentColor={updateAccentColor}
          headerColor={headerColor}
          onUpdateHeaderColor={updateHeaderColor}
          pin={pin}
          onUpdatePin={updatePin}
          course={course}
          onUpdate={updateCourse}
          onBack={() => setShowCourseSetup(false)}
          library={library}
          onSaveToLibrary={saveCourseToLibrary}
          onLoadFromLibrary={loadCourseFromLibrary}
          onDeleteFromLibrary={deleteCourseFromLibrary}
        />
      ) : active ? (
        <ScoreEntry
          course={course}
          player={active}
          onBack={() => setActiveId(null)}
          onUpdate={(patch) => updatePlayer(active.id, patch)}
          onScore={(hole, val) => updateScore(active.id, hole, val)}
          headerColor={headerColor}
        />
      ) : (
        <ScorerList
          course={course}
          ranked={ranked}
          onSelect={setActiveId}
          onAdd={addPlayer}
          onRemove={removePlayer}
          onLoadExample={loadExample}
          onOpenCourseSetup={() => setShowCourseSetup(true)}
          onImport={importPlayers}
          onClearAll={clearAllPlayers}
          headerColor={headerColor}
          accentColor={accentColor}
          onLock={() => { setScorerUnlocked(false); setMode("board"); setActiveId(null); setShowCourseSetup(false); }}
        />
      )}
 
      {showPinPrompt && (
        <PinPrompt
          pin={pin}
          accentColor={accentColor}
          headerColor={headerColor}
          onSuccess={() => {
            setScorerUnlocked(true);
            setShowPinPrompt(false);
            setMode("scorer");
          }}
          onCancel={() => setShowPinPrompt(false)}
        />
      )}
    </div>
  );
}
 
function PinPrompt({ pin, accentColor, headerColor, onSuccess, onCancel }) {
  const [entry, setEntry] = useState("");
  const [error, setError] = useState(false);
 
  const submit = () => {
    if (entry === pin) {
      onSuccess();
    } else {
      setError(true);
      setEntry("");
    }
  };
 
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(27,27,27,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{ background: "#FFFFFF", borderRadius: 12, padding: 22, width: "100%", maxWidth: 300, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: headerColor, marginBottom: 4 }}>Scorer PIN</div>
        <div style={{ fontSize: 12, color: "#8A8774", marginBottom: 14 }}>Enter the PIN to enter scores or edit the course.</div>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          value={entry}
          onChange={(e) => { setEntry(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="mono"
          style={{
            width: "100%", fontSize: 20, textAlign: "center", letterSpacing: "0.3em", padding: "10px 0",
            borderRadius: 8, border: error ? "1px solid #B5442E" : "1px solid #D8D4C0", marginBottom: 6,
          }}
        />
        {error && <div style={{ fontSize: 11.5, color: "#B5442E", marginBottom: 8 }}>Incorrect PIN — try again.</div>}
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "transparent", color: "#6B6B5F", fontWeight: 600, fontSize: 13 }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", background: accentColor, color: "#FFFFFF", fontWeight: 600, fontSize: 13 }}
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
 
function Board({ course, ranked, headerColor, accentColor }) {
  const [openId, setOpenId] = useState(null);
 
  if (ranked.length === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center", color: "#6B6B5F" }}>
        <Flag size={28} color={accentColor} style={{ marginBottom: 10 }} />
        <div style={{ fontSize: 15 }}>No scores posted yet.</div>
        <div style={{ fontSize: 12.5, marginTop: 4 }}>The board updates as the scorer enters holes.</div>
      </div>
    );
  }
  return (
    <div style={{ padding: "14px 12px 40px" }}>
      {ranked.map((p, i) => {
        const isOpen = openId === p.id;
        return (
          <div
            key={p.id}
            style={{
              background: "#FFFFFF", borderRadius: 10, marginBottom: 8,
              border: i === 0 && p.thru > 0 ? `1px solid ${accentColor}` : "1px solid #E4E0D0",
              boxShadow: i === 0 && p.thru > 0 ? `0 1px 6px ${accentColor}2e` : "none",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpenId(isOpen ? null : p.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", background: "none", border: "none", textAlign: "left",
              }}
            >
              <div className="mono" style={{ width: 22, textAlign: "center", fontSize: 15, fontWeight: 700, color: i < 3 && p.thru > 0 ? headerColor : "#9B9885" }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name || "Unnamed"}
                </div>
                <div className="mono" style={{ fontSize: 11, color: "#8A8774", marginTop: 1 }}>
                  HCP {p.ph} · thru {p.thru === 18 ? "F" : p.thru}
                </div>
              </div>
              <div className="mono" style={{ fontSize: 19, fontWeight: 700, color: headerColor, minWidth: 30, textAlign: "right" }}>
                {p.thru > 0 ? p.pts : "–"}
              </div>
              <ChevronRight
                size={16}
                color="#9B9885"
                style={{ transform: isOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s", flexShrink: 0 }}
              />
            </button>
            {isOpen && <HoleByHole course={course} player={p} headerColor={headerColor} />}
          </div>
        );
      })}
    </div>
  );
}
 
function HoleByHole({ course, player, headerColor }) {
  const row = (holes, label) => (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 4 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4 }}>
        {holes.map((h) => {
          const idx = h - 1;
          const gross = player.scores[idx];
          const pts = holePoints(course, gross, idx, player.ph);
          return (
            <div key={h} style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 8.5, color: "#C2BEA9" }}>{h}</div>
              <div
                className="mono"
                style={{
                  fontSize: 13, fontWeight: 700, padding: "5px 0", borderRadius: 5, marginTop: 2,
                  background: gross !== "" ? "#F7E1EC" : "#F5F3E9",
                  color: gross !== "" ? headerColor : "#C2BEA9",
                }}
              >
                {gross !== "" ? gross : "–"}
              </div>
              <div className="mono" style={{ fontSize: 8.5, color: "#8A8774", marginTop: 2 }}>
                {pts !== null ? `${pts}pt` : ""}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <div style={{ padding: "0 14px 14px", borderTop: "1px solid #EFEDE0" }}>
      <div style={{ height: 10 }} />
      {row(OUT, "Out")}
      {row(IN, "In")}
    </div>
  );
}
 
function ScorerList({ course, ranked, onSelect, onAdd, onRemove, onLoadExample, onOpenCourseSetup, onImport, onClearAll, headerColor, accentColor, onLock }) {
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [importMsg, setImportMsg] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
 
  const doImport = () => {
    const newPlayers = parsePastedPlayers(pasteText, course);
    if (newPlayers.length === 0) {
      setImportMsg("No player rows found — check there's a name in the first column.");
      return;
    }
    onImport(newPlayers);
    setImportMsg(`Imported ${newPlayers.length} player${newPlayers.length === 1 ? "" : "s"}.`);
    setPasteText("");
    setPasteOpen(false);
  };
 
  return (
    <div style={{ padding: "14px 12px 40px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button
          onClick={onOpenCourseSetup}
          style={{
            flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
            borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF",
            color: headerColor, fontSize: 12.5, fontWeight: 600,
          }}
        >
          <Settings size={14} />
          <span style={{ flex: 1, textAlign: "left" }}>{course.name} · {course.eventName}</span>
          <ChevronRight size={15} color="#9B9885" />
        </button>
        <button
          onClick={onLock}
          title="Lock scorer mode"
          style={{
            width: 42, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 10, border: "1px solid #E4E0D0", background: "#FFFFFF",
          }}
        >
          <Lock size={15} color="#8A8774" />
        </button>
      </div>
 
      {ranked.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
          {confirmClear ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#8A8774" }}>Remove all {ranked.length} players?</span>
              <button
                onClick={() => { onClearAll(); setConfirmClear(false); }}
                style={{ fontSize: 11.5, fontWeight: 700, color: "#B5442E", background: "none", border: "none", padding: "4px 6px" }}
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ fontSize: 11.5, color: "#9B9885", background: "none", border: "none", padding: "4px 6px" }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{ fontSize: 11.5, color: "#B5442E", background: "none", border: "none", padding: "4px 2px" }}
            >
              Clear all players
            </button>
          )}
        </div>
      )}
      {ranked.length === 0 && (
        <button
          onClick={onLoadExample}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 10, border: `1px solid ${accentColor}`,
            background: `${accentColor}14`, color: accentColor, fontWeight: 600, fontSize: 12.5, marginBottom: 10,
          }}
        >
          Load example players (demo)
        </button>
      )}
      {ranked.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#FFFFFF", borderRadius: 10, padding: "10px 12px", marginBottom: 8,
            border: "1px solid #E4E0D0",
          }}
        >
          <button onClick={() => onSelect(p.id)} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, textAlign: "left", background: "none", border: "none", padding: 0 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name || "New player"}</div>
              <div className="mono" style={{ fontSize: 11, color: "#8A8774" }}>
                {getTee(course, p.tee)?.label} tee · thru {p.thru}/18 · {p.thru > 0 ? `${p.pts} pts` : "not started"}
              </div>
            </div>
            <ChevronRight size={16} color="#9B9885" />
          </button>
          <button onClick={() => onRemove(p.id)} style={{ background: "none", border: "none", color: "#B5442E", fontSize: 11, padding: "4px 6px" }}>
            Remove
          </button>
        </div>
      ))}
      {pasteOpen ? (
        <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 12, border: `1px solid ${headerColor}`, marginBottom: 10 }}>
          <div style={{ fontSize: 11.5, color: "#6B6B5F", marginBottom: 6 }}>
            Paste rows copied from your spreadsheet — Name, Handicap Index, Tee (Tee optional, header row optional).
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder={"A. Whitmore\t8.4\tWhite\nR. Okonkwo\t14.1\tYellow"}
            rows={6}
            className="mono"
            style={{ width: "100%", fontSize: 12, padding: 8, borderRadius: 7, border: "1px solid #D8D4C0", resize: "vertical", fontFamily: "inherit" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={doImport}
              style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "none", background: headerColor, color: "#FFFFFF", fontWeight: 600, fontSize: 12.5 }}
            >
              Import
            </button>
            <button
              onClick={() => { setPasteOpen(false); setImportMsg(""); }}
              style={{ flex: 1, padding: "9px 0", borderRadius: 7, border: "1px solid #D8D4C0", background: "transparent", color: "#6B6B5F", fontWeight: 600, fontSize: 12.5 }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => { setPasteOpen(true); setImportMsg(""); }}
          style={{
            width: "100%", padding: "12px 0", borderRadius: 10, border: `1px solid ${headerColor}`,
            background: "transparent", color: headerColor, fontWeight: 600, fontSize: 13.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4, marginBottom: 4,
          }}
        >
          <Clipboard size={15} /> Import players (paste from spreadsheet)
        </button>
      )}
      {importMsg && !pasteOpen && (
        <div style={{ fontSize: 11.5, color: headerColor, textAlign: "center", marginBottom: 8 }}>{importMsg}</div>
      )}
      <button
        onClick={onAdd}
        style={{
          width: "100%", padding: "12px 0", borderRadius: 10, border: `1px dashed ${headerColor}`,
          background: "transparent", color: headerColor, fontWeight: 600, fontSize: 13.5,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4,
        }}
      >
        <Users size={15} /> Add player
      </button>
    </div>
  );
}
 
function ScoreEntry({ course, player, onBack, onUpdate, onScore, headerColor }) {
  const { ph, pts } = totals(course, player);
  const inputRefs = useRef({});
  const timers = useRef({});
 
  // Auto-advance to the next hole once a score looks "finished" — instantly
  // for single-digit scores that can't extend to two digits (2-9), after a
  // brief pause for scores starting "1" (which might become 10-15), and
  // immediately on Enter/Return regardless.
  useEffect(() => {
    return () => Object.values(timers.current).forEach(clearTimeout);
  }, []);
 
  const focusNext = (idx) => {
    const next = inputRefs.current[idx + 1];
    if (next) {
      next.focus();
      next.select?.();
    }
  };
 
  const handleChange = (idx, rawVal) => {
    onScore(idx, rawVal);
    if (timers.current[idx]) clearTimeout(timers.current[idx]);
    if (rawVal === "") return;
    const isAmbiguousOne = rawVal.length === 1 && Number(rawVal) === 1;
    const delay = isAmbiguousOne ? 700 : 150;
    timers.current[idx] = setTimeout(() => focusNext(idx), delay);
  };
 
  const handleKeyDown = (idx, e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (timers.current[idx]) clearTimeout(timers.current[idx]);
      focusNext(idx);
    }
  };
 
  const nine = (holes) => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4, marginBottom: 10 }}>
      {holes.map((h) => {
        const idx = h - 1;
        const val = player.scores[idx];
        const p = holePoints(course, val, idx, ph);
        return (
          <div key={h} style={{ textAlign: "center" }}>
            <div className="mono" style={{ fontSize: 9.5, color: "#9B9885" }}>{h}</div>
            <div className="mono" style={{ fontSize: 8.5, color: "#C2BEA9" }}>Par {course.holes[idx].par}</div>
            <input
              ref={(el) => (inputRefs.current[idx] = el)}
              className="mono scoreInput"
              type="number"
              inputMode="numeric"
              value={val}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: "100%", textAlign: "center", padding: "6px 0", marginTop: 2,
                borderRadius: 6, border: "1px solid #D8D4C0", fontSize: 14, fontWeight: 700,
                background: val !== "" ? `${headerColor}14` : "#FFF",
              }}
            />
            <div className="mono" style={{ fontSize: 9, color: headerColor, marginTop: 2, minHeight: 12 }}>
              {p !== null ? `${p}pt` : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
 
  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← All players
      </button>
 
      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <input
          placeholder="Player name"
          value={player.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          style={{ width: "100%", fontSize: 16, fontWeight: 700, border: "none", outline: "none", fontFamily: "inherit", marginBottom: 8 }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Handicap index"
            type="number"
            inputMode="decimal"
            value={player.index}
            onChange={(e) => onUpdate({ index: e.target.value })}
            className="mono"
            style={{ flex: 1, fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0" }}
          />
          <select
            value={player.tee}
            onChange={(e) => onUpdate({ tee: e.target.value })}
            style={{ fontSize: 13, padding: "8px 10px", borderRadius: 7, border: "1px solid #D8D4C0", background: "#FFF" }}
          >
            {course.tees.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="mono" style={{ fontSize: 12, color: "#6B6B5F", marginTop: 8 }}>
          Playing HCP {ph} · {pts} pts so far
        </div>
      </div>
 
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>Out</div>
      {nine(OUT)}
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>In</div>
      {nine(IN)}
    </div>
  );
}
 
function CourseSetup({ orgName, onUpdateOrgName, accentColor, onUpdateAccentColor, headerColor, onUpdateHeaderColor, pin, onUpdatePin, course, onUpdate, onBack, library, onSaveToLibrary, onLoadFromLibrary, onDeleteFromLibrary }) {
  const [saveName, setSaveName] = useState(course.name);
  const [confirmLoadId, setConfirmLoadId] = useState(null);
  const setHole = (idx, field, val) => {
    const clean = val === "" ? "" : Math.max(1, Math.min(field === "par" ? 7 : 18, Number(val)));
    const holes = course.holes.map((h, i) => (i === idx ? { ...h, [field]: clean } : h));
    onUpdate({ holes });
  };
 
  const setTee = (id, field, val) => {
    const tees = course.tees.map((t) => (t.id === id ? { ...t, [field]: val } : t));
    onUpdate({ tees });
  };
 
  const addTee = () => {
    const id = crypto.randomUUID().slice(0, 4);
    onUpdate({ tees: [...course.tees, { id, label: "New tee", cr: 72.0, slope: 125 }] });
  };
 
  const removeTee = (id) => {
    if (course.tees.length <= 1) return;
    onUpdate({ tees: course.tees.filter((t) => t.id !== id) });
  };
 
  const holeGrid = (holes, label) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 4 }}>
        {holes.map((h) => {
          const idx = h - 1;
          return (
            <div key={h} style={{ textAlign: "center" }}>
              <div className="mono" style={{ fontSize: 9, color: "#9B9885", marginBottom: 2 }}>{h}</div>
              <input
                className="mono scoreInput" type="number" inputMode="numeric"
                value={course.holes[idx].par}
                onChange={(e) => setHole(idx, "par", e.target.value)}
                placeholder="Par"
                style={{ width: "100%", textAlign: "center", padding: "4px 0", borderRadius: 5, border: "1px solid #D8D4C0", fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}
              />
              <input
                className="mono scoreInput" type="number" inputMode="numeric"
                value={course.holes[idx].si}
                onChange={(e) => setHole(idx, "si", e.target.value)}
                placeholder="SI"
                style={{ width: "100%", textAlign: "center", padding: "4px 0", borderRadius: 5, border: "1px solid #D8D4C0", fontSize: 11, color: "#6B6B5F" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
 
  return (
    <div style={{ padding: "12px 14px 40px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: headerColor, fontSize: 13, marginBottom: 10, padding: 0, fontWeight: 600 }}>
        ← Back
      </button>
 
      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
          Society name <span style={{ textTransform: "none", letterSpacing: 0 }}>(stays fixed however you change the course below)</span>
        </div>
        <input
          value={orgName}
          onChange={(e) => onUpdateOrgName(e.target.value)}
          style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", marginBottom: 14, fontFamily: "inherit" }}
        />
        <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#8A8774" }}>Header colour</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={headerColor}
                onChange={(e) => onUpdateHeaderColor(e.target.value)}
                style={{ width: 34, height: 30, padding: 0, border: "1px solid #D8D4C0", borderRadius: 6, background: "none" }}
              />
              <span className="mono" style={{ fontSize: 11.5, color: "#6B6B5F" }}>{headerColor}</span>
            </span>
          </label>
          <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#8A8774" }}>Accent colour</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => onUpdateAccentColor(e.target.value)}
                style={{ width: 34, height: 30, padding: 0, border: "1px solid #D8D4C0", borderRadius: 6, background: "none" }}
              />
              <span className="mono" style={{ fontSize: 11.5, color: "#6B6B5F" }}>{accentColor}</span>
            </span>
          </label>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>
            Scorer PIN <span style={{ textTransform: "none", letterSpacing: 0 }}>(required to enter Scorer entry)</span>
          </div>
          <input
            value={pin}
            onChange={(e) => onUpdatePin(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
            inputMode="numeric"
            className="mono"
            style={{ width: 120, fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", letterSpacing: "0.15em" }}
          />
        </div>
      </div>
 
      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>Course / venue name</div>
        <input
          value={course.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          style={{ width: "100%", fontSize: 15, fontWeight: 700, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", marginBottom: 10, fontFamily: "inherit" }}
        />
        <div style={{ fontSize: 11, color: "#8A8774", marginBottom: 3 }}>Event name</div>
        <input
          value={course.eventName}
          onChange={(e) => onUpdate({ eventName: e.target.value })}
          style={{ width: "100%", fontSize: 14, border: "1px solid #D8D4C0", borderRadius: 7, padding: "7px 9px", fontFamily: "inherit" }}
        />
      </div>
 
      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
          Tees
        </div>
        {course.tees.map((t) => (
          <div key={t.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <input
              value={t.label}
              onChange={(e) => setTee(t.id, "label", e.target.value)}
              placeholder="Label"
              style={{ flex: 1.3, fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <input
              className="mono" type="number" inputMode="decimal"
              value={t.cr}
              onChange={(e) => setTee(t.id, "cr", Number(e.target.value))}
              placeholder="CR"
              style={{ flex: 1, fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <input
              className="mono" type="number" inputMode="numeric"
              value={t.slope}
              onChange={(e) => setTee(t.id, "slope", Number(e.target.value))}
              placeholder="Slope"
              style={{ flex: 1, fontSize: 12.5, padding: "6px 8px", borderRadius: 6, border: "1px solid #D8D4C0" }}
            />
            <button
              onClick={() => removeTee(t.id)}
              disabled={course.tees.length <= 1}
              style={{ background: "none", border: "none", color: course.tees.length <= 1 ? "#D8D4C0" : "#B5442E", padding: 4 }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
        <div className="mono" style={{ fontSize: 9.5, color: "#8A8774", marginBottom: 8, display: "flex", gap: 12 }}>
          <span style={{ flex: 1.3 }}>Label</span><span style={{ flex: 1 }}>Course rating</span><span style={{ flex: 1 }}>Slope</span><span style={{ width: 15 }} />
        </div>
        <button
          onClick={addTee}
          style={{
            width: "100%", padding: "8px 0", borderRadius: 7, border: `1px dashed ${headerColor}`,
            background: "transparent", color: headerColor, fontWeight: 600, fontSize: 12.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
          }}
        >
          <Plus size={13} /> Add tee
        </button>
      </div>
 
      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774" }}>
            Holes — par / stroke index
          </div>
          <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: headerColor }}>
            Total par {coursePar(course)}
          </div>
        </div>
        {holeGrid(OUT, "Out")}
        {holeGrid(IN, "In")}
      </div>
 
      <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 14, border: "1px solid #E4E0D0", marginTop: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#8A8774", marginBottom: 8 }}>
          Saved courses
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <input
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            placeholder="Name this course setup"
            style={{ flex: 1, fontSize: 12.5, padding: "7px 9px", borderRadius: 6, border: "1px solid #D8D4C0" }}
          />
          <button
            onClick={() => onSaveToLibrary(saveName)}
            style={{ padding: "7px 12px", borderRadius: 6, border: "none", background: headerColor, color: "#FFFFFF", fontSize: 12, fontWeight: 600 }}
          >
            Save
          </button>
        </div>
        {library.length === 0 ? (
          <div style={{ fontSize: 12, color: "#9B9885" }}>No courses saved yet — save this one to reuse it next year.</div>
        ) : (
          library.map((entry) => (
            <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid #EFEDE0" }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</div>
              {confirmLoadId === entry.id ? (
                <>
                  <span style={{ fontSize: 10, color: "#8A8774", marginRight: 2 }}>Clears players?</span>
                  <button
                    onClick={() => { onLoadFromLibrary(entry); setConfirmLoadId(null); }}
                    style={{ fontSize: 11.5, fontWeight: 700, color: headerColor, background: "none", border: "none", padding: "4px 6px" }}
                  >
                    Yes, load
                  </button>
                  <button
                    onClick={() => setConfirmLoadId(null)}
                    style={{ fontSize: 11.5, color: "#9B9885", background: "none", border: "none", padding: "4px 6px" }}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmLoadId(entry.id)}
                    style={{ fontSize: 11.5, fontWeight: 600, color: headerColor, background: "none", border: `1px solid ${headerColor}`, borderRadius: 6, padding: "4px 9px" }}
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDeleteFromLibrary(entry.id)}
                    style={{ background: "none", border: "none", color: "#B5442E", padding: 4 }}
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
 
