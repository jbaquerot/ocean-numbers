const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

export function numToWords(n) {
  if (n >= 1000000) {
    const rest = n % 1000000;
    return numToWords(Math.floor(n / 1000000)) + ' million' + (rest ? (rest < 1000 ? ' and ' : ' ') + numToWords(rest) : '');
  }
  if (n >= 1000) return numToWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' and ' + numToWords(n % 1000) : '');
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + numToWords(n % 100) : '');
}
export const DIFFICULTIES = {
  easy: { label: 'Easy', description: 'Thousands with whole hundreds · e.g. 24,300' },
  hard: { label: 'Hard', description: 'Thousands with tens and ones · e.g. 246,783' },
  veryHard: { label: 'Very hard', description: 'Millions with full number groups · e.g. 12,345,678' },
};
export function makePair(difficulty = 'easy') {
  const left = Math.random() < .4 ? Math.floor(Math.random() * 90) + 10 : Math.floor(Math.random() * 900) + 100;
  let right = (Math.floor(Math.random() * 9) + 1) * 100;
  if (difficulty !== 'easy') right = (Math.floor(Math.random() * 9) + 1) * 100 + Math.floor(Math.random() * 99) + 1;
  const millions = difficulty === 'veryHard' ? (Math.floor(Math.random() * 999) + 1) * 1000000 : 0;
  const value = millions + left * 1000 + right;
  return { numStr: value.toLocaleString('en-US'), words: numToWords(value) };
}
function uniquePair(used, difficulty) {
  let pair;
  do { pair = makePair(difficulty); } while (used.includes(pair.words));
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
export function hintsFor(difficulty) {
  if (difficulty === 'easy') return HINTS;
  return [
    { icon:'✂️', text:'Read the number in groups of three digits, separated by commas.' },
    { icon:'🏗️', text: difficulty === 'veryHard' ? 'From left to right: MILLIONS, THOUSANDS, then the last group.' : 'Read the group before the comma, then say THOUSAND.' },
    { icon:'🔢', text:'Read each group as hundreds, tens and ones. Skip any zero groups.' },
    { icon:'✏️', text:'Use a hyphen for numbers like twenty-one. Spaces work too!' },
    { icon:'💡', text:'Use AND after hundreds with a remainder, and between thousands and the last group.' },
  ];
}
const TYPES = ['quiz','writing','quiz','matching','quiz','writing','matching','quiz','writing','matching'];
export function generateRounds(difficulty = 'easy', count = 10) {
  if (!Object.hasOwn(DIFFICULTIES, difficulty)) throw new RangeError('Unknown difficulty');
  if (!Number.isInteger(count) || count < 1 || count > 50) throw new RangeError('Choose between 1 and 50 rounds');
  const animals = shuffle(ANIMALS);
  return Array.from({ length: count }, (_, i) => {
    const type = TYPES[i % TYPES.length];
    const animal = animals[i % animals.length];
    if (type === 'quiz') {
      const main = makePair(difficulty); const options = [main.words];
      while (options.length < 4) options.push(uniquePair(options, difficulty).words);
      return { type, number: main.numStr, correct: main.words, options: shuffle(options), ...animal };
    }
    if (type === 'writing') { const p = makePair(difficulty); return { type, number: p.numStr, correct: p.words, ...animal }; }
    const used = [];
    const pairs = Array.from({ length: 4 }, () => { const p = uniquePair(used, difficulty); used.push(p.words); return { number: p.numStr, word: p.words }; });
    return { type, pairs, ...animal };
  });
}
