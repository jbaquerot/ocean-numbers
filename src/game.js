const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numToWords(n) {
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numToWords(n % 100) : '');
}
export function makePair() {
  const left = Math.random() < .4 ? Math.floor(Math.random() * 90) + 10 : Math.floor(Math.random() * 900) + 100;
  const right = (Math.floor(Math.random() * 9) + 1) * 100;
  return { numStr: `${left},${String(right).padStart(3, '0')}`, words: `${numToWords(left)} thousand and ${numToWords(right)}` };
}
function uniquePair(used) {
  let pair;
  do { pair = makePair(); } while (used.includes(pair.words));
  return pair;
}
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export function normalise(s) { return s.trim().toLowerCase().replace(/[-\s]+/g, ' '); }

const ANIMALS = [
  { animal:'🐠', animalName:'Clownfish' }, { animal:'🐙', animalName:'Octopus' },
  { animal:'🦈', animalName:'Shark' }, { animal:'🐬', animalName:'Dolphin' },
  { animal:'🐳', animalName:'Whale' }, { animal:'🦭', animalName:'Seal' },
  { animal:'🐡', animalName:'Pufferfish' }, { animal:'🦑', animalName:'Squid' },
  { animal:'🐚', animalName:'Seashell' }, { animal:'🐋', animalName:'Blue Whale' },
  { animal:'🦀', animalName:'Crab' }, { animal:'🦞', animalName:'Lobster' },
  { animal:'🐟', animalName:'Fish' }, { animal:'🦐', animalName:'Shrimp' },
];
export const HINTS = [
  { icon:'✂️', text:'The comma splits the number into LEFT and RIGHT!' },
  { icon:'🏗️', text:'LEFT side always ends with THOUSAND' },
  { icon:'🏠', text:'RIGHT side always ends with HUNDRED' },
  { icon:'🔢', text:'Count the zeros! TWO zeros = HUNDRED ✅' },
  { icon:'🚦', text:'THOUSAND never crosses the comma!' },
];
const TYPES = ['quiz','writing','quiz','matching','quiz','writing','matching','quiz','writing','matching'];
export function generateRounds() {
  const animals = shuffle(ANIMALS).slice(0, 10);
  return TYPES.map((type, i) => {
    const animal = animals[i];
    if (type === 'quiz') {
      const main = makePair(); const options = [main.words];
      while (options.length < 4) options.push(uniquePair(options).words);
      return { type, number: main.numStr, correct: main.words, options: shuffle(options), ...animal };
    }
    if (type === 'writing') { const p = makePair(); return { type, number: p.numStr, correct: p.words, ...animal }; }
    const used = [];
    const pairs = Array.from({ length: 4 }, () => { const p = uniquePair(used); used.push(p.words); return { number: p.numStr, word: p.words }; });
    return { type, pairs, ...animal };
  });
}
