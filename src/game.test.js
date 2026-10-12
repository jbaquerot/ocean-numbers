import test from 'node:test';
import assert from 'node:assert/strict';
import { numToWords, normalise, generateRounds } from './game.js';

test('English number spelling at tens and hundreds boundaries', () => {
  for (const [n, expected] of [[10, 'ten'], [19, 'nineteen'], [20, 'twenty'], [21, 'twenty-one'], [99, 'ninety-nine'], [100, 'one hundred'], [101, 'one hundred and one'], [999, 'nine hundred and ninety-nine']]) assert.equal(numToWords(n), expected);
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
