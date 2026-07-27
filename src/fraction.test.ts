import { describe, expect, it } from 'vitest';
import { FractionInputError, compareFractions, getVisualState, parseFraction } from './fraction';

describe('parseFraction', () => {
  it('normalizes ordinary fractions and negative denominators', () => {
    expect(parseFraction('6/8').display).toBe('3/4');
    expect(parseFraction('3/-4').display).toBe('-3/4');
    expect(parseFraction('-3/-4').display).toBe('3/4');
  });

  it('parses integers, improper fractions, and mixed numbers', () => {
    expect(parseFraction('5').display).toBe('5');
    expect(parseFraction('9/4').display).toBe('9/4');
    expect(parseFraction('1 2/3').display).toBe('5/3');
    expect(parseFraction('-1 2/3').display).toBe('-5/3');
  });

  it('rejects empty input, invalid syntax, zero denominator, and resource limits', () => {
    expect(() => parseFraction('')).toThrow(FractionInputError);
    expect(() => parseFraction('1 // 2')).toThrow('Use formats');
    expect(() => parseFraction('1/0')).toThrow('denominator cannot be 0');
    expect(() => parseFraction(`${'1'.repeat(61)}/2`)).toThrow('no more than 60 digits');
  });
});

describe('compareFractions', () => {
  it('compares same denominators and records numerator steps', () => {
    const result = compareFractions('5/8', '3/8');
    expect(result.symbol).toBe('>');
    expect(result.left.display).toBe('5/8');
    expect(result.right.display).toBe('3/8');
    expect(result.steps.some((step) => step.title === 'Compare the numerators')).toBe(true);
  });

  it('compares same numerators through exact cross products', () => {
    const result = compareFractions('3/5', '3/7');
    expect(result.symbol).toBe('>');
    expect(result.crossProducts.left).toBe(21n);
    expect(result.crossProducts.right).toBe(15n);
  });

  it('compares different denominators without decimal rounding', () => {
    const result = compareFractions('3/4', '5/8');
    expect(result.symbol).toBe('>');
    expect(result.crossProducts.left).toBe(24n);
    expect(result.crossProducts.right).toBe(20n);
    expect(result.steps.map((step) => step.title)).toContain('Use cross multiplication');
  });

  it('recognizes equivalent fractions and zero', () => {
    expect(compareFractions('2/3', '8/12').symbol).toBe('=');
    expect(compareFractions('0/9', '0').plainText).toBe('0 = 0');
  });

  it('handles negative numbers, negative denominators, and swap order', () => {
    expect(compareFractions('-1/2', '-3/4').symbol).toBe('>');
    expect(compareFractions('1/-2', '-3/4').symbol).toBe('>');
    expect(compareFractions('-3/4', '-1/2').symbol).toBe('<');
  });

  it('handles improper fractions, mixed numbers, integers, and big integers', () => {
    expect(compareFractions('9/4', '2').symbol).toBe('>');
    expect(compareFractions('1 2/3', '5/3').symbol).toBe('=');
    expect(compareFractions('5', '22/5').symbol).toBe('>');
    expect(compareFractions('123456789123456789/7', '987654321987654321/56').symbol).toBe('<');
  });

  it('degrades visual models for misleading cases', () => {
    expect(getVisualState({ numerator: 1n, denominator: 2n }, { numerator: 3n, denominator: 4n }).kind).toBe(
      'bars'
    );
    expect(
      getVisualState({ numerator: -1n, denominator: 2n }, { numerator: 3n, denominator: 4n }).kind
    ).toBe('hidden');
    expect(getVisualState({ numerator: 5n, denominator: 4n }, { numerator: 3n, denominator: 4n }).kind).toBe(
      'hidden'
    );
    expect(getVisualState({ numerator: 1n, denominator: 25n }, { numerator: 1n, denominator: 24n }).kind).toBe(
      'hidden'
    );
  });
});
