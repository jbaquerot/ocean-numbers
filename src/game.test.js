import test from 'node:test';
import assert from 'node:assert/strict';
import { numToWords, normalise, generateRounds, hintsFor } from './game.js';

test('English number spelling at tens and hundreds boundaries', () => {
  for (const [n, expected] of [[10, 'ten'], [19, 'nineteen'], [20, 'twenty'], [21, 'twenty-one'], [99, 'ninety-nine'], [100, 'one hundred'], [101, 'one hundred and one'], [999, 'nine hundred and ninety-nine']]) assert.equal(numToWords(n), expected);
});
test('Larger numbers handle zero groups and millions without losing place values', () => {
  for (const [n, expected] of [
    [1000, 'one thousand'], [10001, 'ten thousand and one'],
    [246783, 'two hundred and forty-six thousand and seven hundred and eighty-three'],
    [1000000, 'one million'], [1000001, 'one million and one'],
    [1001000, 'one million one thousand'],
    [12345678, 'twelve million three hundred and forty-five thousand and six hundred and seventy-eight'],
    [999999999, 'nine hundred and ninety-nine million nine hundred and ninety-nine thousand and nine hundred and ninety-nine'],
  ]) assert.equal(numToWords(n), expected);
});
test('Every difficulty respects custom round counts and its number range', () => {
  for (const difficulty of ['easy', 'hard', 'veryHard']) {
    for (const count of [1, 4, 10, 15, 50]) {
      const rounds = generateRounds(difficulty, count);
      assert.equal(rounds.length, count);
      rounds.forEach(r => {
        const pairs = r.type === 'matching' ? r.pairs : [{ number: r.number, word: r.correct }];
        for (const p of pairs) {
          const n = Number(p.number.replaceAll(',', ''));
          assert.equal(p.word, numToWords(n));
          if (difficulty === 'easy') { assert.ok(n >= 10100 && n <= 999900); assert.equal(n % 100, 0); }
          if (difficulty === 'hard') { assert.ok(n >= 10101 && n <= 999999); assert.notEqual(n % 100, 0); }
          if (difficulty === 'veryHard') { assert.ok(n >= 1000000 && n <= 999999999); assert.notEqual(n % 100, 0); }
        }
        if (r.type === 'quiz') { assert.equal(new Set(r.options).size, 4); assert.ok(r.options.includes(r.correct)); }
        if (r.type === 'matching') assert.equal(new Set(r.pairs.map(p => p.number)).size, 4);
      });
    }
  }
});
test('Rejects invalid game settings and supplies appropriate advanced hints', () => {
  for (const count of [0, 51, 1.5, NaN, '10']) assert.throws(() => generateRounds('easy', count), RangeError);
  assert.throws(() => generateRounds('unknown', 10), RangeError);
  assert.ok(hintsFor('veryHard').some(h => h.text.includes('MILLIONS')));
  assert.ok(!hintsFor('hard').some(h => h.text.includes('always ends')));
});
test('Writing accepts case, hyphens and whitespace while rejecting wrong words', () => {
  assert.equal(normalise('  Twenty-ONE   thousand AND\nthree hundred  '), normalise('twenty-one thousand and three hundred'));
  assert.notEqual(normalise('twenty-one hundred'), normalise('twenty-one thousand'));
});
test('Generated games have ten rounds, unique choices and correct number/word pairs', () => {
  function validate(number, words) {
    const [left, right] = number.split(',').map(Number);
    assert.ok(left >= 10 && left <= 999);
    assert.ok(right >= 100 && right <= 900 && right % 100 === 0);
    assert.equal(words, `${numToWords(left)} thousand and ${numToWords(right)}`);
  }
  for (let game = 0; game < 100; game++) {
    const rounds = generateRounds();
    assert.equal(rounds.length, 10);
    assert.equal(new Set(rounds.map(r => r.animalName)).size, 10);
    assert.deepEqual(rounds.map(r => r.type), ['quiz','writing','quiz','matching','quiz','writing','matching','quiz','writing','matching']);
    for (const r of rounds) {
      if (r.type === 'matching') {
        assert.equal(r.pairs.length, 4);
        assert.equal(new Set(r.pairs.map(p => p.number)).size, 4);
        r.pairs.forEach(p => validate(p.number, p.word));
      } else {
        validate(r.number, r.correct);
        if (r.type === 'quiz') { assert.equal(new Set(r.options).size, 4); assert.ok(r.options.includes(r.correct)); }
      }
    }
  }
});
