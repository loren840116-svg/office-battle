import { useState, useEffect, useRef, useCallback } from "react";

// ── TRIVIA QUESTIONS ──
const TRIVIA = [
  { q: "What does CPU stand for?", a: "Central Processing Unit", opts: ["Central Processing Unit","Core Power Unit","Computer Primary Utility","Control Process Unit"] },
  { q: "Which planet is closest to the Sun?", a: "Mercury", opts: ["Venus","Mars","Mercury","Earth"] },
  { q: "How many sides does a hexagon have?", a: "6", opts: ["5","6","7","8"] },
  { q: "What is the capital of Japan?", a: "Tokyo", opts: ["Osaka","Kyoto","Tokyo","Hiroshima"] },
  { q: "Which element has the symbol 'O'?", a: "Oxygen", opts: ["Gold","Osmium","Oxygen","Ozone"] },
  { q: "How many bytes are in a kilobyte?", a: "1024", opts: ["1000","512","1024","2048"] },
  { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci", opts: ["Michelangelo","Raphael","Leonardo da Vinci","Donatello"] },
  { q: "What is 7 × 8?", a: "56", opts: ["48","54","56","64"] },
  { q: "Which gas do plants absorb?", a: "CO₂", opts: ["O₂","N₂","CO₂","H₂"] },
  { q: "What year did World War II end?", a: "1945", opts: ["1943","1944","1945","1946"] },
  { q: "What is the speed of light (approx)?", a: "300,000 km/s", opts: ["150,000 km/s","300,000 km/s","500,000 km/s","1,000,000 km/s"] },
  { q: "How many continents are on Earth?", a: "7", opts: ["5","6","7","8"] },
];

const TYPING_SENTENCES = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "The five boxing wizards jump quickly",
  "Sphinx of black quartz judge my vow",
];

const MOVES = ["rock","paper","scissors"];
const MOVE_ICONS = { rock:"🪨", paper:"✋", scissors:"✌️" };
const BEATS = { rock:"scissors", paper:"rock", scissors:"paper" };
const BET_OPTS = [
  { v:"coffee", l:"☕ Loser buys coffee" },
  { v:"lunch",  l:"🍱 Loser buys lunch" },
  { v:"boba",   l:"🧋 Loser buys boba tea" },
  { v:"custom", l:"✏️ Custom bet" },
  { v:"none",   l:"🚫 No bet (friendly)" },
];
const GAME_TYPES = [
  { v:"rps",    l:"🪨 Rock Paper Scissors", d:"Classic best-of-5" },
  { v:"trivia", l:"🧠 Trivia Battle",        d:"5 questions, fastest wins" },
  { v:"typing", l:"⌨️ Typing Speed",         d:"Type the sentence fastest" },
];

function genCode() {
  return Array.from({length:4}, () => "ABCDEFGHJKLMNPQRSTUVWXYZ"[Math.floor(Math.random()*23)]).join("");
}
function shuffle(arr) { return [...arr].sort(() => Math.random()-0.5); }

// ── LEADERBOARD STORAGE (localStorage fallback) ──
function loadLB() {
  try { return JSON.parse(localStorage.getItem("oba_lb") || "[]"); } catch { return []; }
}
function saveLB(data) {
  try { localStorage.setItem("oba_lb", JSON.stringify(data.slice(0,20))); } catch {}
}
function addLBEntry(name, result, game, bet) {
  const lb = loadLB();
  lb.unshift({ name, result, game, bet: bet||"", date: new Date().toLocaleDateString() });
  saveLB(lb);
}

// ── STYLES ──
const S = {
  app: { background:"#0a0a0f", minHeight:"100vh", fontFamily:"'Rajdhani',sans-serif", color:"#e8e8f0", padding:"0" },
  header: { textAlign:"center", padding:"2rem 1rem 1rem" },
  title: { fontFamily:"'Press Start 2P',monospace", fontSize:"clamp(10px,2.5vw,17px)", color:"#f5e642", letterSpacing:2, textShadow:"0 0 20px rgba(245,230,66,0.5)", marginBottom:4 },
  sub: { fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"#6b6b8a", letterSpacing:1 },
  card: { background:"#1a1a26", border:"1px solid #2a2a3e", borderRadius:4, padding:"1.25rem", width:"100%", maxWidth:520, marginBottom:"1rem" },
  cardTitle: { fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"#42f5e6", marginBottom:12, letterSpacing:1 },
  field: { marginBottom:"0.9rem" },
  label: { fontFamily:"'Press Start 2P',monospace", fontSize:6, color:"#6b6b8a", display:"block", marginBottom:6, letterSpacing:1 },
  input: { width:"100%", background:"#12121a", border:"1px solid #2a2a3e", borderRadius:2, color:"#e8e8f0", fontFamily:"'Rajdhani',sans-serif", fontSize:15, fontWeight:600, padding:"0.6rem 0.85rem", outline:"none" },
  select: { width:"100%", background:"#12121a", border:"1px solid #2a2a3e", borderRadius:2, color:"#e8e8f0", fontFamily:"'Rajdhani',sans-serif", fontSize:14, fontWeight:600, padding:"0.6rem 0.85rem", outline:"none" },
  btnY: { fontFamily:"'Press Start 2P',monospace", fontSize:8, padding:"0.85rem 1.2rem", background:"#f5e642", color:"#0a0a0f", border:"none", borderRadius:2, cursor:"pointer", letterSpacing:1 },
  btnC: { fontFamily:"'Press Start 2P',monospace", fontSize:8, padding:"0.85rem 1.2rem", background:"#42f5e6", color:"#0a0a0f", border:"none", borderRadius:2, cursor:"pointer", letterSpacing:1 },
  btnP: { fontFamily:"'Press Start 2P',monospace", fontSize:8, padding:"0.85rem 1.2rem", background:"#f542a4", color:"#fff", border:"none", borderRadius:2, cursor:"pointer", letterSpacing:1 },
  btnG: { fontFamily:"'Press Start 2P',monospace", fontSize:8, padding:"0.85rem 1.2rem", background:"transparent", color:"#6b6b8a", border:"1px solid #2a2a3e", borderRadius:2, cursor:"pointer", letterSpacing:1 },
  betStrip: { background:"rgba(245,66,164,0.08)", border:"1px solid rgba(245,66,164,0.25)", borderRadius:2, padding:"0.5rem 1rem", fontFamily:"'Press Start 2P',monospace", fontSize:7, color:"#f542a4", textAlign:"center", marginBottom:"1rem", letterSpacing:1 },
  pixel: { fontFamily:"'Press Start 2P',monospace" },
  muted: { color:"#6b6b8a" },
  center: { textAlign:"center" },
};

// ══════════════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState("home");
  const [p1, setP1] = useState(""); const [p2, setP2] = useState("");
  const [betType, setBetType] = useState("coffee"); const [customBet, setCustomBet] = useState("");
  const [gameType, setGameType] = useState("rps");
  const [code, setCode] = useState(""); const [codeInput, setCodeInput] = useState("");
  const [channel, setChannel] = useState("slack");
  const [copied, setCopied] = useState(false);
  const [isLeisure, setIsLeisure] = useState(false);
  const [betLabel, setBetLabel] = useState("");
  const [lb, setLb] = useState(loadLB());

  // game state
  const [rpsState, setRpsState] = useState(null);
  const [triviaState, setTriviaState] = useState(null);
  const [typingState, setTypingState] = useState(null);
  const [gameResult, setGameResult] = useState(null);

  const go = (s) => { setScreen(s); window.scrollTo(0,0); };

  const getBetLabel = () => {
    if (betType==="coffee") return "☕ Loser buys coffee";
    if (betType==="lunch")  return "🍱 Loser buys lunch";
    if (betType==="boba")   return "🧋 Loser buys boba tea";
    if (betType==="custom") return customBet || "custom bet";
    return "";
  };

  const genInvite = () => {
    const c = genCode(); setCode(c);
    const p1n = p1||"Someone"; const p2n = p2||"You";
    const bl = getBetLabel(); setBetLabel(bl);
    return { c, p1n, p2n, bl };
  };

  const handleGenerateInvite = () => {
    if (!p1.trim()) { alert("Enter your name!"); return; }
    if (!p2.trim()) { alert("Enter opponent's name!"); return; }
    genInvite();
    go("waiting");
  };

  const buildInviteText = () => {
    const bl = getBetLabel();
    const gt = GAME_TYPES.find(g=>g.v===gameType)?.l || "Rock Paper Scissors";
    if (channel==="line") {
      return `⚔️ 辦公室對決挑戰 ⚔️\n\n@${p2||"對手"}，我要挑戰你！😤\n\n🎮 遊戲：${gt}\n${bl?`💰 賭注：${bl}\n`:""}\n🔐 對戰代碼：${code||"?????"}\n\n開啟競技場，輸入代碼，接受挑戰！`;
    }
    return `⚔️ *OFFICE BATTLE CHALLENGE* ⚔️\n\n@${p2||"opponent"} — ${p1||"someone"} is calling you out! 😤\n\n🎮 Game: ${gt}\n${bl?`💰 Bet: ${bl}\n`:""}\n🔐 Battle Code: \`${code||"?????"}\`\n\nOpen the arena, enter the code, and accept your fate.`;
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(buildInviteText()).catch(()=>{});
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  };

  const acceptChallenge = () => {
    if (codeInput.toUpperCase() !== code) { alert("❌ Wrong code! Check the invite."); return; }
    startGame(false);
  };

  const startGame = (leisure) => {
    setIsLeisure(leisure);
    const bl = leisure ? "" : getBetLabel();
    setBetLabel(bl);
    if (gameType==="rps" || leisure) {
      setRpsState({ p1s:0, p2s:0, round:0, history:[], phase:"choose", lastResult:null, p2move:null });
      go("game-rps");
    } else if (gameType==="trivia") {
      const qs = shuffle(TRIVIA).slice(0,5).map(q=>({...q,opts:shuffle(q.opts)}));
      setTriviaState({ qs, qi:0, p1s:0, p2s:0, chosen:null, phase:"question", history:[] });
      go("game-trivia");
    } else {
      const sent = TYPING_SENTENCES[Math.floor(Math.random()*TYPING_SENTENCES.length)];
      setTypingState({ sentence:sent, typed:"", startTime:null, done:false, wpm:0, cpuWpm:Math.floor(Math.random()*30)+40 });
      go("game-typing");
    }
  };

  const finishGame = (winner, score, recap) => {
    const winName = winner==="p1" ? (p1||"You") : winner==="cpu" ? "CPU" : (p2||"Opponent");
    const res = { winner, winName, score, recap, bet:betLabel, p1:p1||"Player 1", p2:isLeisure?"CPU":(p2||"Opponent"), gameType };
    setGameResult(res);
    if (!isLeisure) addLBEntry(winName, "win", gameType, betLabel);
    setLb(loadLB());
    go("result");
  };

  return (
    <div style={S.app}>
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;600&display=swap" rel="stylesheet" />
      {screen==="home"    && <HomeScreen go={go} startLeisure={()=>{setIsLeisure(true);setGameType("rps");startGame(true);}} lb={lb} />}
      {screen==="setup"   && <SetupScreen go={go} p1={p1} setP1={setP1} p2={p2} setP2={setP2} betType={betType} setBetType={setBetType} customBet={customBet} setCustomBet={setCustomBet} gameType={gameType} setGameType={setGameType} channel={channel} setChannel={setChannel} code={code} codeInput={codeInput} setCodeInput={setCodeInput} inviteText={buildInviteText()} copied={copied} copyInvite={copyInvite} handleGenerateInvite={handleGenerateInvite} acceptChallenge={acceptChallenge} />}
      {screen==="waiting" && <WaitingScreen go={go} p1={p1||"You"} p2={p2||"???"} code={code} betLabel={getBetLabel()} gameType={gameType} onSimulate={()=>startGame(false)} />}
      {screen==="game-rps"    && rpsState    && <RPSScreen    state={rpsState} setState={setRpsState} p1={p1||"You"} p2={isLeisure?"CPU":(p2||"Opponent")} isLeisure={isLeisure} betLabel={betLabel} onFinish={finishGame} />}
      {screen==="game-trivia" && triviaState && <TriviaScreen state={triviaState} setState={setTriviaState} p1={p1||"You"} p2={isLeisure?"CPU":(p2||"Opponent")} isLeisure={isLeisure} betLabel={betLabel} onFinish={finishGame} />}
      {screen==="game-typing" && typingState && <TypingScreen state={typingState} setState={setTypingState} p1={p1||"You"} p2={isLeisure?"CPU":(p2||"Opponent")} isLeisure={isLeisure} betLabel={betLabel} onFinish={finishGame} />}
      {screen==="result"  && gameResult && <ResultScreen result={gameResult} go={go} onRematch={()=>startGame(isLeisure)} />}
      {screen==="leaderboard" && <LeaderboardScreen lb={lb} go={go} setLb={setLb} />}
      {screen==="howto"   && <HowToScreen go={go} />}
    </div>
  );
}

// ══ HOME ══
function HomeScreen({ go, startLeisure, lb }) {
  const top3 = lb.slice(0,3);
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.header}>
        <div style={S.title}>⚔ OFFICE BATTLE ARENA ⚔</div>
        <div style={{...S.sub, marginTop:6}}>v2.0 — challenge your colleagues</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",width:"100%",maxWidth:520,marginBottom:"1rem"}}>
        {[
          {icon:"🗡️",label:"DUEL MODE",desc:"Challenge + bet",color:"#f542a4",action:()=>go("setup"),border:"rgba(245,66,164,0.4)"},
          {icon:"🎮",label:"LEISURE",desc:"Solo vs CPU",color:"#42f5e6",action:startLeisure,border:"rgba(66,245,230,0.4)"},
        ].map(m=>(
          <div key={m.label} onClick={m.action} style={{background:"#1a1a26",border:`2px solid ${m.border}`,borderRadius:4,padding:"1.25rem 0.75rem",cursor:"pointer",textAlign:"center",transition:"transform 0.1s"}}>
            <div style={{fontSize:"2.2rem",marginBottom:8}}>{m.icon}</div>
            <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:m.color,marginBottom:6}}>{m.label}</div>
            <div style={{fontSize:12,color:"#6b6b8a"}}>{m.desc}</div>
          </div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.75rem",width:"100%",maxWidth:520,marginBottom:"1rem"}}>
        <div onClick={()=>go("leaderboard")} style={{background:"#1a1a26",border:"1px solid #2a2a3e",borderRadius:4,padding:"1rem",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:"1.5rem",marginBottom:4}}>🏆</div>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:"#f5e642"}}>LEADERBOARD</div>
        </div>
        <div onClick={()=>go("howto")} style={{background:"#1a1a26",border:"1px solid #2a2a3e",borderRadius:4,padding:"1rem",cursor:"pointer",textAlign:"center"}}>
          <div style={{fontSize:"1.5rem",marginBottom:4}}>📖</div>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:"#42f5e6"}}>HOW TO PLAY</div>
        </div>
      </div>

      {top3.length>0 && (
        <div style={{...S.card}}>
          <div style={S.cardTitle}>🏆 RECENT CHAMPIONS</div>
          {top3.map((e,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1a1a26",fontSize:13}}>
              <span style={{color:"#f5e642",fontFamily:"'Press Start 2P',monospace",fontSize:8}}>{"🥇🥈🥉"[i]} {e.name}</span>
              <span style={{color:"#6b6b8a",fontSize:11}}>{e.game} · {e.date}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,color:"#2a2a3e",marginTop:"1rem"}}>made for office warriors</div>
    </div>
  );
}

// ══ SETUP ══
function SetupScreen({ go, p1, setP1, p2, setP2, betType, setBetType, customBet, setCustomBet, gameType, setGameType, channel, setChannel, code, codeInput, setCodeInput, inviteText, copied, copyInvite, handleGenerateInvite, acceptChallenge }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.title}>⚔ DUEL SETUP</div>
      <div style={{...S.sub,marginBottom:"2rem",marginTop:6}}>set your terms</div>

      <div style={S.card}>
        <div style={S.cardTitle}>👤 PLAYERS</div>
        <div style={S.field}><label style={S.label}>Your name</label><input style={S.input} value={p1} onChange={e=>setP1(e.target.value)} placeholder="e.g. Kevin" maxLength={20}/></div>
        <div style={S.field}><label style={S.label}>Opponent's name</label><input style={S.input} value={p2} onChange={e=>setP2(e.target.value)} placeholder="e.g. Sandra" maxLength={20}/></div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>🎮 GAME TYPE</div>
        {GAME_TYPES.map(g=>(
          <div key={g.v} onClick={()=>setGameType(g.v)} style={{display:"flex",alignItems:"center",gap:12,padding:"0.6rem 0.75rem",border:`1px solid ${gameType===g.v?"#f5e642":"#2a2a3e"}`,borderRadius:2,marginBottom:6,cursor:"pointer",background:gameType===g.v?"rgba(245,230,66,0.06)":"transparent"}}>
            <span style={{fontSize:"1.2rem"}}>{g.l.split(" ")[0]}</span>
            <div>
              <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:gameType===g.v?"#f5e642":"#e8e8f0"}}>{g.l.slice(2)}</div>
              <div style={{fontSize:11,color:"#6b6b8a",marginTop:2}}>{g.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>💰 THE BET</div>
        <select style={S.select} value={betType} onChange={e=>setBetType(e.target.value)}>
          {BET_OPTS.map(b=><option key={b.v} value={b.v}>{b.l}</option>)}
        </select>
        {betType==="custom" && <div style={{marginTop:8}}><input style={S.input} value={customBet} onChange={e=>setCustomBet(e.target.value)} placeholder="e.g. Loser does 10 pushups"/></div>}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>📨 INVITE CHANNEL</div>
        <div style={{display:"flex",gap:8,marginBottom:"0.75rem"}}>
          {[{v:"slack",l:"🟣 Slack"},{v:"line",l:"🟢 Line"}].map(ch=>(
            <div key={ch.v} onClick={()=>setChannel(ch.v)} style={{padding:"5px 12px",border:`1px solid ${channel===ch.v?(ch.v==="slack"?"#4A154B":"#06C755"):"#2a2a3e"}`,borderRadius:20,cursor:"pointer",fontFamily:"'Press Start 2P',monospace",fontSize:7,color:channel===ch.v?(ch.v==="slack"?"#E8C4E8":"#06C755"):"#6b6b8a",background:channel===ch.v?(ch.v==="slack"?"rgba(74,21,75,0.3)":"rgba(6,199,85,0.1)"):"transparent"}}>{ch.l}</div>
          ))}
        </div>
        {code && (
          <div style={{background:"#12121a",border:"1px dashed #2a2a3e",borderRadius:2,padding:"0.85rem",fontSize:12,color:"#e8e8f0",lineHeight:1.7,whiteSpace:"pre-wrap",marginBottom:8,position:"relative"}}>
            {inviteText}
            <button onClick={copyInvite} style={{position:"absolute",top:6,right:6,fontFamily:"'Press Start 2P',monospace",fontSize:6,background:copied?"#42f5e6":"#2a2a3e",color:copied?"#000":"#6b6b8a",border:"none",borderRadius:2,padding:"4px 8px",cursor:"pointer"}}>{copied?"✓ COPIED":"COPY"}</button>
          </div>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>🔐 BATTLE CODE</div>
        <div style={{textAlign:"center",fontFamily:"'Press Start 2P',monospace",fontSize:28,color:"#f5e642",letterSpacing:12,padding:"0.75rem",background:"#12121a",borderRadius:2,border:"1px dashed #2a2a3e",marginBottom:12}}>{code||"????"}</div>
        <div style={S.field}><label style={S.label}>Accept a challenge — enter code</label>
          <input style={{...S.input,textTransform:"uppercase",letterSpacing:8,fontSize:20,textAlign:"center"}} value={codeInput} onChange={e=>setCodeInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,""))} placeholder="CODE" maxLength={4}/>
        </div>
        <button style={{...S.btnC,width:"100%",justifyContent:"center"}} onClick={acceptChallenge}>⚔ ACCEPT & ENTER ARENA</button>
      </div>

      <div style={{display:"flex",gap:8,width:"100%",maxWidth:520,flexWrap:"wrap"}}>
        <button style={S.btnG} onClick={()=>go("home")}>← BACK</button>
        <button style={{...S.btnY,flex:1}} onClick={handleGenerateInvite}>🗡️ GENERATE INVITE</button>
      </div>
    </div>
  );
}

// ══ WAITING ══
function WaitingScreen({ go, p1, p2, code, betLabel, gameType, onSimulate }) {
  const gt = GAME_TYPES.find(g=>g.v===gameType)?.l || "RPS";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.title}>⏳ WAITING</div>
      <div style={{...S.sub,marginBottom:"2rem",marginTop:6}}>for opponent to accept</div>
      <div style={S.card}>
        <div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:"2rem",marginBottom:"1rem"}}>
          <div style={{textAlign:"center"}}><div style={{fontSize:"2rem"}}>😤</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"#f5e642",marginTop:4}}>{p1.toUpperCase()}</div><div style={{fontSize:11,color:"#6b6b8a"}}>challenger</div></div>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:14,color:"#2a2a3e"}}>VS</div>
          <div style={{textAlign:"center"}}><div style={{fontSize:"2rem"}}>🤔</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"#f542a4",marginTop:4}}>{p2.toUpperCase()}</div><div style={{fontSize:11,color:"#6b6b8a"}}>pending…</div></div>
        </div>
        {betLabel && <div style={S.betStrip}>💰 BET: {betLabel.toUpperCase()}</div>}
        <div style={{textAlign:"center",marginBottom:"0.75rem"}}><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:"#6b6b8a",marginBottom:6}}>GAME</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:"#42f5e6"}}>{gt}</div></div>
        <hr style={{border:"none",borderTop:"1px solid #2a2a3e",margin:"0.75rem 0"}}/>
        <div style={{textAlign:"center"}}><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7,color:"#6b6b8a",marginBottom:8}}>SHARE THIS CODE</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:28,color:"#f5e642",letterSpacing:12}}>{code}</div></div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
        <button style={S.btnG} onClick={()=>go("home")}>← CANCEL</button>
        <button style={S.btnY} onClick={onSimulate}>🧪 SIMULATE ACCEPT</button>
      </div>
    </div>
  );
}

// ══ RPS GAME ══
function RPSScreen({ state, setState, p1, p2, isLeisure, betLabel, onFinish }) {
  const NEED = 3;
  const play = (move) => {
    if (state.phase!=="choose") return;
    const cpu = MOVES[Math.floor(Math.random()*3)];
    let out;
    if (move===cpu) out="draw";
    else if (BEATS[move]===cpu) out="p1";
    else out="p2";
    const ns = { ...state, p2move:cpu, phase:"result", lastResult:out, history:[...state.history, out],
      p1s: out==="p1" ? state.p1s+1 : state.p1s,
      p2s: out==="p2" ? state.p2s+1 : state.p2s,
      round: state.round+1, playerMove: move };
    setState(ns);
    const np1s = ns.p1s; const np2s = ns.p2s;
    if (np1s>=NEED||np2s>=NEED||ns.round>=5) {
      setTimeout(()=>{
        const winner = np1s>np2s?"p1":np2s>np1s?(isLeisure?"cpu":"p2"):"draw";
        onFinish(winner, `${np1s} — ${np2s}`, ns.history.map((h,i)=>`Round ${i+1}: ${h==="draw"?"🤝 Draw":h==="p1"?`⭐ ${p1} won`:`💥 ${p2} won`}`).join("\n"));
      }, 1300);
    } else {
      setTimeout(()=>setState(s=>({...s,phase:"choose",lastResult:null,p2move:null})),1300);
    }
  };
  const dots = Array.from({length:5},(_,i)=>({ cls: state.history[i]==="p1"?"p1":state.history[i]==="p2"?"p2":state.history[i]==="draw"?"draw":"" }));
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.title}>{isLeisure?"🎮 LEISURE":"⚔ BATTLE!"}</div>
      {betLabel && <div style={{...S.betStrip,width:"100%",maxWidth:520}}>💰 {betLabel.toUpperCase()}</div>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",maxWidth:520,marginBottom:"1rem"}}>
        <div style={{textAlign:"center",flex:1}}><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:8}}>{p1.toUpperCase()}</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:28,color:"#f5e642"}}>{state.p1s}</div></div>
        <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:14,color:"#2a2a3e"}}>VS</div>
        <div style={{textAlign:"center",flex:1}}><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:8}}>{p2.toUpperCase()}</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:28,color:"#f542a4"}}>{state.p2s}</div></div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:"1rem"}}>
        {dots.map((d,i)=><div key={i} style={{width:10,height:10,borderRadius:"50%",background:d.cls==="p1"?"#f5e642":d.cls==="p2"?"#f542a4":d.cls==="draw"?"#6b6b8a":"#2a2a3e",border:`1px solid ${d.cls?"transparent":"#2a2a3e"}`}}/>)}
      </div>
      {state.phase==="result" && (
        <div style={{textAlign:"center",marginBottom:"1rem",minHeight:70}}>
          <div style={{fontSize:"2rem",marginBottom:4}}>{state.lastResult==="draw"?"🤝":state.lastResult==="p1"?"⭐":"💥"}</div>
          <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:10,color:state.lastResult==="p1"?"#f5e642":state.lastResult==="p2"?"#f542a4":"#6b6b8a"}}>
            {state.lastResult==="draw"?"DRAW!":state.lastResult==="p1"?`${p1.toUpperCase()} WINS ROUND!`:`${p2.toUpperCase()} WINS ROUND!`}
          </div>
          <div style={{marginTop:6,fontSize:13,color:"#6b6b8a"}}>{MOVE_ICONS[state.playerMove]} vs {MOVE_ICONS[state.p2move]}</div>
        </div>
      )}
      {state.phase==="choose" && <div style={{textAlign:"center",fontFamily:"'Press Start 2P',monospace",fontSize:7,color:"#6b6b8a",marginBottom:"1rem"}}>CHOOSE YOUR MOVE</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.75rem",width:"100%",maxWidth:400,marginBottom:"1rem"}}>
        {MOVES.map(m=>(
          <div key={m} onClick={()=>play(m)} style={{background:"#1a1a26",border:`2px solid ${state.phase==="choose"?"#2a2a3e":"#1a1a26"}`,borderRadius:4,padding:"1.2rem 0.5rem",cursor:state.phase==="choose"?"pointer":"default",textAlign:"center",opacity:state.phase==="choose"?1:0.4,transition:"border-color 0.15s"}}>
            <div style={{fontSize:"2rem"}}>{MOVE_ICONS[m]}</div>
            <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:6,color:"#6b6b8a",marginTop:6}}>{m.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══ TRIVIA GAME ══
function TriviaScreen({ state, setState, p1, p2, isLeisure, betLabel, onFinish }) {
  const q = state.qs[state.qi];
  const choose = (opt) => {
    if (state.chosen) return;
    const correct = opt===q.a;
    const cpuCorrect = Math.random()>0.4;
    const ns = { ...state, chosen:opt, phase:"result",
      p1s: correct ? state.p1s+1 : state.p1s,
      p2s: cpuCorrect ? state.p2s+1 : state.p2s };
    setState(ns);
    setTimeout(()=>{
      if (ns.qi+1 >= ns.qs.length) {
        const winner = ns.p1s>ns.p2s?"p1":ns.p2s>ns.p1s?(isLeisure?"cpu":"p2"):"draw";
        onFinish(winner, `${ns.p1s} — ${ns.p2s}`, `${p1}: ${ns.p1s}/5 correct\n${p2}: ${ns.p2s}/5 correct`);
      } else {
        setState(s=>({...s,qi:s.qi+1,chosen:null,phase:"question"}));
      }
    }, 1500);
  };
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.title}>🧠 TRIVIA BATTLE</div>
      {betLabel && <div style={{...S.betStrip,width:"100%",maxWidth:520}}>💰 {betLabel.toUpperCase()}</div>}
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:520,marginBottom:"1rem"}}>
        <div style={{textAlign:"center"}}><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7}}>{p1.toUpperCase()}</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:24,color:"#f5e642"}}>{state.p1s}</div></div>
        <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"#6b6b8a",alignSelf:"center"}}>Q {state.qi+1}/5</div>
        <div style={{textAlign:"center"}}><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7}}>{p2.toUpperCase()}</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:24,color:"#f542a4"}}>{state.p2s}</div></div>
      </div>
      <div style={S.card}>
        <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,lineHeight:1.8,marginBottom:"1.25rem",color:"#e8e8f0"}}>{q.q}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {q.opts.map(opt=>{
            let bg="#12121a", border="#2a2a3e", color="#e8e8f0";
            if (state.chosen) {
              if (opt===q.a) { bg="rgba(66,245,230,0.1)"; border="#42f5e6"; color="#42f5e6"; }
              else if (opt===state.chosen && state.chosen!==q.a) { bg="rgba(245,66,164,0.1)"; border="#f542a4"; color="#f542a4"; }
            }
            return (
              <div key={opt} onClick={()=>choose(opt)} style={{background:bg,border:`1px solid ${border}`,borderRadius:2,padding:"0.75rem",cursor:state.chosen?"default":"pointer",color,fontSize:13,fontWeight:600,transition:"all 0.2s"}}>{opt}</div>
            );
          })}
        </div>
      </div>
      {state.chosen && <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:state.chosen===q.a?"#42f5e6":"#f542a4",textAlign:"center"}}>{state.chosen===q.a?"✓ CORRECT!":"✗ WRONG!"}</div>}
    </div>
  );
}

// ══ TYPING GAME ══
function TypingScreen({ state, setState, p1, p2, isLeisure, betLabel, onFinish }) {
  const inputRef = useRef(null);
  useEffect(()=>{ if (inputRef.current) inputRef.current.focus(); },[]);

  const handleType = (e) => {
    const val = e.target.value;
    if (state.done) return;
    const start = state.startTime || Date.now();
    setState(s=>({...s,typed:val,startTime:start}));
    if (val===state.sentence) {
      const elapsed = (Date.now()-start)/1000/60;
      const words = state.sentence.split(" ").length;
      const wpm = Math.round(words/elapsed);
      const cpuWpm = state.cpuWpm;
      setState(s=>({...s,done:true,wpm}));
      const winner = wpm>cpuWpm?"p1":(isLeisure?"cpu":"p2");
      setTimeout(()=>onFinish(winner, `${wpm} vs ${cpuWpm} WPM`, `${p1}: ${wpm} WPM\n${p2}: ${cpuWpm} WPM`), 800);
    }
  };

  const chars = state.sentence.split("").map((ch,i)=>{
    let color = "#6b6b8a";
    if (i < state.typed.length) color = state.typed[i]===ch ? "#42f5e6" : "#f542a4";
    return <span key={i} style={{color}}>{ch}</span>;
  });

  const progress = state.typed.length / state.sentence.length * 100;

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.title}>⌨️ TYPING DUEL</div>
      {betLabel && <div style={{...S.betStrip,width:"100%",maxWidth:520}}>💰 {betLabel.toUpperCase()}</div>}
      <div style={{display:"flex",justifyContent:"space-between",width:"100%",maxWidth:520,marginBottom:"1rem"}}>
        <div style={{textAlign:"center"}}><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7}}>{p1.toUpperCase()}</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:16,color:"#f5e642"}}>{state.wpm||"—"} WPM</div></div>
        <div style={{textAlign:"center"}}><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:7}}>{p2.toUpperCase()}</div><div style={{fontFamily:"'Press Start 2P',monospace",fontSize:16,color:"#f542a4"}}>{state.cpuWpm} WPM</div></div>
      </div>
      <div style={S.card}>
        <div style={{fontFamily:"monospace",fontSize:17,letterSpacing:1,lineHeight:2,marginBottom:"1.25rem",wordBreak:"break-word"}}>{chars}</div>
        <div style={{background:"#12121a",borderRadius:2,height:6,marginBottom:"1rem",overflow:"hidden"}}>
          <div style={{background:"#f5e642",height:"100%",width:`${progress}%`,transition:"width 0.1s",borderRadius:2}}/>
        </div>
        <input ref={inputRef} type="text" value={state.typed} onChange={handleType} style={{...S.input,fontFamily:"monospace"}} placeholder="Start typing here…" disabled={state.done}/>
      </div>
      {state.done && <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:10,color:"#f5e642",textAlign:"center"}}>✓ DONE! {state.wpm} WPM</div>}
    </div>
  );
}

// ══ RESULT ══
function ResultScreen({ result, go, onRematch }) {
  const isWin = result.winner==="p1";
  const isDraw = result.winner==="draw";
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.title}>🏆 BATTLE OVER</div>
      <div style={{fontSize:"4rem",textAlign:"center",margin:"1rem 0"}}>{isDraw?"🤝":isWin?"🏆":"💀"}</div>
      <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:"clamp(10px,2vw,15px)",textAlign:"center",marginBottom:4,color:isWin?"#f5e642":isDraw?"#6b6b8a":"#f542a4"}}>{result.winName.toUpperCase()} {isDraw?"TIED":"WINS"}!</div>
      <div style={{fontFamily:"'Press Start 2P',monospace",fontSize:9,color:"#6b6b8a",marginBottom:"1.5rem"}}>{result.score}</div>
      {result.bet && (
        <div style={S.card}>
          <div style={S.cardTitle}>💰 BET VERDICT</div>
          <div style={{fontSize:15,color:"#f542a4",fontWeight:600}}>
            {result.winner==="p1" ? result.p2 : result.p1} owes: {result.bet}
          </div>
        </div>
      )}
      <div style={S.card}>
        <div style={S.cardTitle}>📊 RECAP</div>
        <div style={{fontSize:13,color:"#6b6b8a",lineHeight:2,whiteSpace:"pre-line"}}>{result.recap}</div>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center"}}>
        <button style={S.btnG} onClick={()=>go("home")}>🏠 HOME</button>
        <button style={S.btnY} onClick={onRematch}>🔁 REMATCH</button>
      </div>
    </div>
  );
}

// ══ LEADERBOARD ══
function LeaderboardScreen({ lb, go, setLb }) {
  const clear = () => { localStorage.removeItem("oba_lb"); setLb([]); };
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.title}>🏆 LEADERBOARD</div>
      <div style={{...S.sub,marginBottom:"2rem",marginTop:6}}>hall of champions</div>
      <div style={S.card}>
        {lb.length===0 ? <div style={{color:"#6b6b8a",textAlign:"center",padding:"1rem",fontFamily:"'Press Start 2P',monospace",fontSize:8}}>NO RECORDS YET</div> :
          lb.map((e,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #12121a",gap:8}}>
              <span style={{fontFamily:"'Press Start 2P',monospace",fontSize:8,color:"#f5e642",minWidth:24}}>#{i+1}</span>
              <span style={{flex:1,fontWeight:600}}>{e.name}</span>
              <span style={{fontSize:11,color:"#42f5e6"}}>{e.game}</span>
              <span style={{fontSize:10,color:"#6b6b8a"}}>{e.date}</span>
            </div>
          ))
        }
      </div>
      <div style={{display:"flex",gap:8}}>
        <button style={S.btnG} onClick={()=>go("home")}>← BACK</button>
        {lb.length>0 && <button style={{...S.btnG,color:"#f542a4",borderColor:"rgba(245,66,164,0.3)"}} onClick={clear}>🗑 CLEAR</button>}
      </div>
    </div>
  );
}

// ══ HOW TO ══
function HowToScreen({ go }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"2rem 1rem"}}>
      <div style={S.title}>📖 HOW TO PLAY</div>
      <div style={{...S.sub,marginBottom:"2rem",marginTop:6}}>the rules</div>
      {[
        {t:"🗡️ DUEL MODE",b:"1. Enter your name + opponent's name\n2. Pick a game (RPS, Trivia, or Typing)\n3. Set a bet (or play friendly)\n4. Generate the invite → copy it to Slack or Line\n5. Your opponent opens the same app and enters the battle code\n6. Game begins automatically!"},
        {t:"🎮 LEISURE MODE",b:"Jump in and play Rock Paper Scissors against the CPU. No code needed, no bet."},
        {t:"🪨 Rock Paper Scissors",b:"Best of 5 rounds. Rock beats Scissors. Scissors beats Paper. Paper beats Rock."},
        {t:"🧠 Trivia Battle",b:"5 questions each. You vs CPU (simulated). Most correct answers wins. Answer quickly before the CPU does!"},
        {t:"⌨️ Typing Speed",b:"Type the displayed sentence as fast as you can. Your WPM vs a random CPU speed. Accuracy matters — every character must be correct!"},
        {t:"🌐 How to host it",b:"Download the .jsx file → deploy to Netlify, Vercel, or GitHub Pages. Share the URL in your Slack/Line channel. Everyone uses the same URL — that's your arena!"},
      ].map(s=>(
        <div key={s.t} style={S.card}>
          <div style={S.cardTitle}>{s.t}</div>
          <div style={{fontSize:13,color:"#6b6b8a",lineHeight:1.8,whiteSpace:"pre-line"}}>{s.b}</div>
        </div>
      ))}
      <button style={S.btnG} onClick={()=>go("home")}>← BACK</button>
    </div>
  );
}
