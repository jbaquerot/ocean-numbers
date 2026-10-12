import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { generateRounds, shuffle, normalise, hintsFor, DIFFICULTIES } from './game.js';

const STORAGE_KEY = 'ocean-numbers-stats';
function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const bests = {};
    for (const [key, value] of Object.entries(saved?.bests ?? {})) {
      const [level, count] = key.split(':');
      if (Object.hasOwn(DIFFICULTIES, level) && Number(count) >= 1 && Number(count) <= 50 && Number.isInteger(value) && value >= 0 && value <= Number(count)) bests[key] = value;
    }
    if (Number.isInteger(saved?.bestScore) && saved.bestScore >= 0 && saved.bestScore <= 10) bests['easy:10'] = Math.max(bests['easy:10'] ?? 0, saved.bestScore);
    return { totalPlayed: Number.isInteger(saved?.totalPlayed) && saved.totalPlayed >= 0 ? saved.totalPlayed : 0, bests };
  } catch { return { totalPlayed: 0, bests: {} }; }
}

export default function OceanNumberGame() {
  return <MotionConfig reducedMotion="user"><Game /></MotionConfig>;
}
function Game() {
  const [rounds, setRounds] = useState(() => generateRounds());
  const [playerName, setPlayerName] = useState('');
  const [difficulty, setDifficulty] = useState('easy');
  const [roundCount, setRoundCount] = useState('10');
  const [screen, setScreen] = useState('intro');
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [stats, setStats] = useState(loadStats);
  const [isNewBest, setIsNewBest] = useState(false);
  const [phase, setPhase] = useState('question');
  const [feedback, setFeedback] = useState({ correct: false, message: '' });
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [writing, setWriting] = useState('');
  const [shuffWords, setShuffWords] = useState([]);
  const [selNum, setSelNum] = useState(null);
  const [selWord, setSelWord] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongPair, setWrongPair] = useState(null);
  const [hintIdx, setHintIdx] = useState(4);
  const [showHint, setShowHint] = useState(false);
  const wrongTimer = useRef(null);
  const answered = useRef(false);
  const advanced = useRef(false);
  const round = rounds[roundIdx];
  const hints = hintsFor(difficulty);
  const count = Number(roundCount);
  const validSettings = playerName.trim().length > 0 && Number.isInteger(count) && count >= 1 && count <= 50;
  const statsKey = `${difficulty}:${count}`;
  const bestScore = stats.bests[statsKey] ?? 0;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch { /* Storage is optional. */ }
  }, [stats]);
  useEffect(() => {
    if (screen !== 'playing') return;
    answered.current = false; advanced.current = false;
    setPhase('question'); setSelectedOpt(null); setWriting('');
    setShowHint(false); setFeedback({ correct: false, message: '' });
    setSelNum(null); setSelWord(null); setMatched([]); setWrongPair(null);
    if (round.type === 'matching') setShuffWords(shuffle(round.pairs.map(p => p.word)));
    return () => clearTimeout(wrongTimer.current);
  }, [roundIdx, screen, round]);

  const startGame = () => {
    if (!validSettings) return;
    setPlayerName(n => n.trim()); setHintIdx(hints.length - 1);
    setRounds(generateRounds(difficulty, count)); setScore(0); setRoundIdx(0); setIsNewBest(false); setScreen('playing');
  };
  const goNext = () => {
    if (phase !== 'feedback' || advanced.current) return;
    advanced.current = true;
    if (roundIdx + 1 >= rounds.length) {
      setIsNewBest(score > bestScore);
      setStats(s => ({ totalPlayed: s.totalPlayed + 1, bests: { ...s.bests, [statsKey]: Math.max(s.bests[statsKey] ?? 0, score) } }));
      setScreen('finished');
    } else setRoundIdx(n => n + 1);
  };
  const completeAnswer = ok => {
    answered.current = true;
    if (ok) setScore(s => s + 1);
    setFeedback({ correct: ok, message: ok ? '🎉 Brilliant! That is correct!' : `❌ Not quite!\nCorrect answer:\n"${round.correct}"` });
    setPhase('feedback');
  };
  const handleQuiz = opt => {
    if (phase !== 'question' || answered.current) return;
    setSelectedOpt(opt); completeAnswer(opt === round.correct);
  };
  const handleWriting = () => {
    if (!writing.trim() || phase !== 'question' || answered.current) return;
    completeAnswer(normalise(writing) === normalise(round.correct));
  };
  const handleMatch = (type, value) => {
    if (phase !== 'question' || answered.current || wrongPair) return;
    const newNum = type === 'num' ? (selNum === value ? null : value) : selNum;
    const newWord = type === 'word' ? (selWord === value ? null : value) : selWord;
    if (type === 'num') setSelNum(newNum); else setSelWord(newWord);
    if (newNum && newWord) {
      const pair = round.pairs.find(p => p.number === newNum);
      if (pair?.word === newWord) {
        const next = [...matched, newNum];
        setMatched(next); setSelNum(null); setSelWord(null);
        if (next.length === round.pairs.length) {
          answered.current = true; setScore(s => s + 1);
          setFeedback({ correct: true, message: '🎉 All matched! Brilliant!' }); setPhase('feedback');
        }
      } else {
        setWrongPair({ num: newNum, word: newWord });
        wrongTimer.current = setTimeout(() => { setWrongPair(null); setSelNum(null); setSelWord(null); }, 800);
      }
    }
  };
  const toggleHint = () => { if (!showHint) setHintIdx(h => (h + 1) % hints.length); setShowHint(v => !v); };
  const isMatchedWord = w => { const p = round.pairs?.find(x => x.word === w); return p ? matched.includes(p.number) : false; };
  const background = 'min-h-screen bg-linear-to-b from-blue-900 via-blue-700 to-cyan-500';

  if (screen === 'intro') return (
    <main className={`${background} flex items-center justify-center p-4`}>
      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl">
        <p className="text-5xl mb-2" aria-hidden="true">🌊</p>
        <h1 className="text-3xl font-bold text-blue-800 mb-1">Ocean Numbers!</h1>
        <div className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-2">♾️ INFINITE RANDOM ROUNDS</div>
        <p className="text-gray-500 text-sm mb-5">Welcome, explorer! Set up your ocean adventure.</p>
        <form onSubmit={e => { e.preventDefault(); startGame(); }} className="text-left space-y-4">
          <div>
            <label htmlFor="player-name" className="block text-sm font-bold text-blue-900 mb-1">Your name</label>
            <input id="player-name" type="text" autoComplete="given-name" required maxLength={30} value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Enter your name" className="w-full border-2 border-blue-100 rounded-xl px-4 py-3 text-gray-700 focus:border-blue-500" />
          </div>
          <div>
            <label htmlFor="difficulty" className="block text-sm font-bold text-blue-900 mb-1">Difficulty</label>
            <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full border-2 border-blue-100 rounded-xl px-4 py-3 text-gray-700 bg-white focus:border-blue-500" aria-describedby="difficulty-description">
              {Object.entries(DIFFICULTIES).map(([value, level]) => <option key={value} value={value}>{level.label}</option>)}
            </select>
            <p id="difficulty-description" className="text-xs text-gray-500 mt-2" aria-live="polite">{DIFFICULTIES[difficulty].description}</p>
          </div>
          <div>
            <label htmlFor="round-count" className="block text-sm font-bold text-blue-900 mb-1">Number of rounds</label>
            <input id="round-count" type="number" min={1} max={50} step={1} required value={roundCount} onChange={e => setRoundCount(e.target.value)} aria-describedby="round-count-description" className="w-full border-2 border-blue-100 rounded-xl px-4 py-3 text-gray-700 focus:border-blue-500" />
            <p id="round-count-description" className="text-xs text-gray-500 mt-2">Choose 1–50 rounds. Longer games include quiz, writing and matching.</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-800">🎲 New numbers every game &nbsp; 💡 Helpful hints &nbsp; 🚫 No timer</div>
          {stats.totalPlayed > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800"><p>🏅 Games played: <strong>{stats.totalPlayed}</strong></p>{Number.isInteger(count) && count >= 1 && count <= 50 && <p>🏆 Best at {DIFFICULTIES[difficulty].label.toLowerCase()}, {count} {count === 1 ? 'round' : 'rounds'}: <strong>{bestScore}/{count}</strong></p>}</div>}
          <button type="submit" disabled={!validSettings} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-xl hover:bg-blue-700 transition-colors disabled:opacity-40">🌊 Dive In!</button>
        </form>
      </motion.div>
    </main>
  );

  if (screen === 'finished') {
    const pct = score / rounds.length;
    const msg = pct === 1 ? '🌟 Perfect score! You are an Ocean Number master!' : pct >= .8 ? '🎉 Excellent work! Nearly perfect!' : pct >= .6 ? '💪 Great effort! Keep practising!' : '💛 Keep going! Every attempt makes you stronger!';
    return (
      <main className={`${background} flex items-center justify-center p-4`}>
        <motion.div initial={{ scale: .8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <p className="text-6xl mb-2" aria-hidden="true">🏆</p>
          <h1 className="text-3xl font-bold text-blue-800 mb-1">Game Over!</h1>
          <p className="text-gray-500 text-sm mb-1 break-words">Amazing work, {playerName}! 🌟</p>
          <p className="text-blue-600 text-xs mb-4">{DIFFICULTIES[difficulty].label} · {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'}</p>
          <div className="bg-blue-50 rounded-2xl p-5 mb-4">
            <p className="text-5xl font-bold text-blue-700 mb-2">{score}/{rounds.length}</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-3"><motion.div className="bg-green-500 h-3 rounded-full" initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ duration: .8, delay: .2 }} /></div>
            <p className="text-gray-600 text-sm">{msg}</p>
          </div>
          {isNewBest && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: .5 }} className="bg-yellow-100 border border-yellow-300 rounded-xl p-3 mb-4 text-sm text-yellow-800 font-bold">🎊 New Best Score: {score}/{rounds.length}!<p className="font-normal text-xs mt-1">For {DIFFICULTIES[difficulty].label.toLowerCase()} · {rounds.length} {rounds.length === 1 ? 'round' : 'rounds'}</p></motion.div>}
          <div className="flex flex-wrap justify-center gap-2 mb-5">{rounds.map((r, i) => <span key={i} className="text-2xl" title={r.animalName}>{r.animal}</span>)}</div>
          <div className="space-y-2">
            <button onClick={startGame} className="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold hover:bg-blue-700 transition-colors">🔄 New Random Game!</button>
            <button onClick={() => setScreen('intro')} className="w-full bg-white border-2 border-blue-200 text-blue-600 py-3 rounded-2xl font-bold hover:bg-blue-50 transition-colors text-sm">🏠 Back to Menu</button>
          </div>
        </motion.div>
      </main>
    );
  }

  const typeLabels = { quiz: '🎯 Quiz', writing: '✏️ Writing', matching: '🔀 Matching' };
  return (
    <main className={`${background} p-4`}>
      <div className="max-w-lg mx-auto">
        <p className="text-white/90 text-sm mb-2 break-words">🌊 {playerName} · {DIFFICULTIES[difficulty].label}</p>
        <div className="flex items-center justify-between mb-2 text-white">
          <div><p className="text-xs opacity-80">Round {roundIdx + 1} / {rounds.length}</p><p className="font-bold text-lg" aria-live="polite">⭐ {score} pts</p></div>
          <div className="text-center"><p className="text-4xl" aria-hidden="true">{round.animal}</p><p className="text-xs opacity-80">{round.animalName}</p></div>
          <div className="text-right"><p className="text-xs opacity-80">{typeLabels[round.type]}</p><p className="font-bold text-sm">{rounds.length - roundIdx - 1} left 🌊</p></div>
        </div>
        <div className="bg-white/20 rounded-full h-2 mb-3" role="progressbar" aria-label="Game progress" aria-valuemin={0} aria-valuemax={rounds.length} aria-valuenow={roundIdx}>
          <motion.div className="h-2 rounded-full bg-yellow-400" animate={{ width: `${roundIdx / rounds.length * 100}%` }} transition={{ duration: .4 }} />
        </div>
        <div className="flex flex-wrap justify-center gap-1 mb-3" aria-hidden="true">{rounds.map((r, i) => <div key={i} className={`h-2 rounded-full transition-all ${i < roundIdx ? 'bg-yellow-400 w-4' : i === roundIdx ? 'bg-white w-4' : 'bg-white/30 w-2'}`} />)}</div>
        <AnimatePresence mode="wait">
          <motion.div key={roundIdx} initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -80, opacity: 0 }} transition={{ duration: .25 }} className="bg-white rounded-3xl shadow-2xl p-5 mb-3">
            {round.type === 'quiz' && <>
              <h1 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">🎯 Choose the correct answer</h1>
              <div className="bg-blue-50 rounded-2xl p-4 mb-4 text-center"><p className="text-3xl sm:text-4xl font-bold text-blue-800 tracking-wide">{round.number}</p><p className="text-xs text-blue-500 mt-1">← in words, this is…?</p></div>
              <div className="space-y-2">{round.options.map((opt, i) => <button key={i} onClick={() => handleQuiz(opt)} disabled={phase === 'feedback'} className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${phase === 'feedback' && opt === round.correct ? 'border-green-500 bg-green-50 text-green-800' : phase === 'feedback' && opt === selectedOpt ? 'border-red-400 bg-red-50 text-red-700' : phase === 'question' ? 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 cursor-pointer' : 'border-gray-100 text-gray-400 cursor-not-allowed'}`}><span className="mr-2 font-bold text-gray-500">{String.fromCharCode(65+i)}.</span>{opt}</button>)}</div>
            </>}
            {round.type === 'writing' && <>
              <h1 className="text-xs font-bold text-purple-600 uppercase tracking-widest mb-3">✏️ Type the number in words</h1>
              <div className="bg-purple-50 rounded-2xl p-4 mb-4 text-center"><p className="text-3xl sm:text-4xl font-bold text-purple-800 tracking-wide">{round.number}</p><p className="text-xs text-purple-500 mt-1">Write this out in full</p></div>
              <textarea aria-label="Number in words" value={writing} onChange={e => setWriting(e.target.value)} disabled={phase === 'feedback'} rows={3} placeholder={difficulty === 'veryHard' ? 'e.g. twelve million three hundred...' : 'e.g. two hundred thousand and...'} className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-purple-400 mb-3 resize-none" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleWriting(); } }} />
              {phase === 'question' && <button onClick={handleWriting} disabled={!writing.trim()} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-40">Submit ✅</button>}
              {phase === 'feedback' && <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500"><span className="font-bold">You wrote:</span> {writing}</div>}
            </>}
            {round.type === 'matching' && <>
              <h1 className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-1">🔀 Match each number to its words!</h1>
              <p className="text-xs text-gray-500 mb-3 text-center">Tap a number 🔢 → then tap its matching words 📝</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2"><p className="text-center text-xs font-bold text-teal-600 mb-1">NUMBERS 🔢</p>
                  {round.pairs.map((pair, i) => {
                    const isM = matched.includes(pair.number), isW = wrongPair?.num === pair.number, isSel = selNum === pair.number;
                    return <motion.button key={i} animate={isW ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }} transition={{ duration: .3 }} onClick={() => handleMatch('num', pair.number)} disabled={isM || !!wrongPair || phase !== 'question'} aria-pressed={isSel} aria-label={isM ? `${pair.number}, matched` : pair.number} className={`w-full py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${isM ? 'border-green-500 bg-green-100 text-green-700' : isW ? 'border-red-400 bg-red-100 text-red-600' : isSel ? 'border-blue-600 bg-blue-100 text-blue-800 scale-95' : 'border-gray-200 hover:border-teal-400 text-gray-700'}`}>{isM ? '✅' : pair.number}</motion.button>;
                  })}
                </div>
                <div className="space-y-2"><p className="text-center text-xs font-bold text-teal-600 mb-1">WORDS 📝</p>
                  {shuffWords.map((word, i) => {
                    const isM = isMatchedWord(word), isW = wrongPair?.word === word, isSel = selWord === word;
                    return <motion.button key={i} animate={isW ? { x: [-4, 4, -4, 4, 0] } : { x: 0 }} transition={{ duration: .3 }} onClick={() => handleMatch('word', word)} disabled={isM || !!wrongPair || phase !== 'question'} aria-pressed={isSel} aria-label={isM ? `${word}, matched` : word} className={`w-full py-2 px-2 rounded-xl border-2 text-xs leading-snug transition-all ${isM ? 'border-green-500 bg-green-100 text-green-700' : isW ? 'border-red-400 bg-red-100 text-red-600' : isSel ? 'border-blue-600 bg-blue-100 text-blue-800 scale-95' : 'border-gray-200 hover:border-teal-400 text-gray-700'}`}>{isM ? '✅' : word}</motion.button>;
                  })}
                </div>
              </div>
              <div className="flex justify-center gap-2 mt-3" aria-label={`${matched.length} of 4 pairs matched`}>{round.pairs.map((_, i) => <motion.div key={i} animate={{ scale: i < matched.length ? 1.2 : 1 }} className={`w-3 h-3 rounded-full transition-colors ${i < matched.length ? 'bg-green-500' : 'bg-gray-200'}`} />)}</div>
            </>}
            <AnimatePresence>{phase === 'feedback' && <motion.div role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 p-4 rounded-xl text-center text-sm font-semibold whitespace-pre-line ${feedback.correct ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-700'}`}>{feedback.message}</motion.div>}</AnimatePresence>
          </motion.div>
        </AnimatePresence>
        {phase === 'question' && <button onClick={toggleHint} aria-expanded={showHint} aria-controls="hint" className="w-full bg-yellow-400 text-yellow-900 py-3 rounded-2xl font-bold mb-2 hover:bg-yellow-300 transition-colors text-sm">💡 {showHint ? 'Hide Hint' : 'Need a Hint?'}</button>}
        <AnimatePresence>{showHint && phase === 'question' && <motion.div id="hint" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-4 mb-2 overflow-hidden">
          <p className="text-2xl text-center mb-1">{hints[hintIdx].icon}</p><p className="text-yellow-800 font-semibold text-sm text-center">{hints[hintIdx].text}</p>
          <div className="mt-2 font-mono text-xs bg-white rounded-xl p-3 text-gray-600 text-center leading-relaxed"><p className="font-bold text-gray-500 mb-1">VISUAL GUIDE</p><p>{difficulty === 'veryHard' ? 'MILLIONS , THOUSANDS , LAST GROUP' : difficulty === 'hard' ? 'THOUSANDS , HUNDREDS + TENS + ONES' : 'THOUSANDS , HUNDREDS'}</p></div>
          <p className="text-xs text-yellow-700 text-center mt-2">Hide and reopen for the next hint!</p>
        </motion.div>}</AnimatePresence>
        {phase === 'feedback' && <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={goNext} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors shadow-lg">{roundIdx + 1 >= rounds.length ? '🏆 See My Score!' : 'Next Round →'}</motion.button>}
        <p className="text-center mt-4 text-white opacity-20 text-xl select-none" aria-hidden="true">🌊 🐠 🌊 🐡 🌊 🐬 🌊</p>
      </div>
    </main>
  );
}
