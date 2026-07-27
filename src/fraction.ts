export type ComparisonSymbol = '<' | '=' | '>';

export type ParseIssueCode =
  | 'empty'
  | 'too-long'
  | 'too-many-digits'
  | 'invalid'
  | 'zero-denominator';

export class FractionInputError extends Error {
  code: ParseIssueCode;

  constructor(code: ParseIssueCode, message: string) {
    super(message);
    this.name = 'FractionInputError';
    this.code = code;
  }
}

export type Fraction = {
  numerator: bigint;
  denominator: bigint;
};

export type ParsedFraction = {
  original: string;
  fraction: Fraction;
  display: string;
  wasMixed: boolean;
  wasReduced: boolean;
  normalizedDenominator: boolean;
};

export type ComparisonStep = {
  title: string;
  body: string;
  expression?: string;
};

export type VisualState =
  | {
      kind: 'bars';
      left: Fraction;
      right: Fraction;
      maxSegments: number;
    }
  | {
      kind: 'hidden';
      reason: string;
    };

export type ComparisonResult = {
  left: ParsedFraction;
  right: ParsedFraction;
  symbol: ComparisonSymbol;
  crossProducts: {
    left: bigint;
    right: bigint;
  };
  steps: ComparisonStep[];
  visual: VisualState;
  plainText: string;
};

const INPUT_LIMIT = 96;
const DIGIT_LIMIT = 60;
const VISUAL_DENOMINATOR_LIMIT = 24n;
const SIGN_NORMALIZER = /[\u2212\u2012\u2013\u2014]/g;

export function parseFraction(input: string): ParsedFraction {
  const original = input;
  const trimmed = input.replace(SIGN_NORMALIZER, '-').trim();

  if (!trimmed) {
    throw new FractionInputError('empty', 'Enter a fraction, mixed number, or integer.');
  }

  if (trimmed.length > INPUT_LIMIT) {
    throw new FractionInputError(
      'too-long',
      `Keep each input under ${INPUT_LIMIT} characters.`
    );
  }

  const compactSlash = trimmed.replace(/\s*\/\s*/g, '/').replace(/\s+/g, ' ');
  const mixedMatch = compactSlash.match(/^([+-]?\d+)\s+(\d+)\/([+-]?\d+)$/);
  const fractionMatch = compactSlash.match(/^([+-]?\d+)\/([+-]?\d+)$/);
  const integerMatch = compactSlash.match(/^[+-]?\d+$/);

  let numerator: bigint;
  let denominator: bigint;
  let wasMixed = false;

  if (mixedMatch) {
    const [, wholeText, partNumeratorText, partDenominatorText] = mixedMatch;
    assertDigitLimit(wholeText, partNumeratorText, partDenominatorText);
    const whole = BigInt(wholeText);
    const partNumerator = BigInt(partNumeratorText);
    const partDenominator = BigInt(partDenominatorText);
    if (partDenominator === 0n) {
      throw new FractionInputError('zero-denominator', 'The denominator cannot be 0.');
    }
    const sign = whole < 0n || wholeText.startsWith('-') ? -1n : 1n;
    numerator = sign * (absBigInt(whole) * absBigInt(partDenominator) + partNumerator);
    denominator = partDenominator;
    wasMixed = true;
  } else if (fractionMatch) {
    const [, numeratorText, denominatorText] = fractionMatch;
    assertDigitLimit(numeratorText, denominatorText);
    numerator = BigInt(numeratorText);
    denominator = BigInt(denominatorText);
    if (denominator === 0n) {
      throw new FractionInputError('zero-denominator', 'The denominator cannot be 0.');
    }
  } else if (integerMatch) {
    assertDigitLimit(compactSlash);
    numerator = BigInt(compactSlash);
    denominator = 1n;
  } else {
    throw new FractionInputError(
      'invalid',
      'Use formats like 3/4, -5/6, 2, or -1 2/3.'
    );
  }

  const raw = { numerator, denominator };
  const normalized = normalizeFraction(raw);

  return {
    original,
    fraction: normalized,
    display: formatFraction(normalized),
    wasMixed,
    wasReduced:
      absBigInt(raw.numerator) !== absBigInt(normalized.numerator) ||
      absBigInt(raw.denominator) !== absBigInt(normalized.denominator),
    normalizedDenominator: raw.denominator < 0n
  };
}

export function compareFractions(leftInput: string, rightInput: string): ComparisonResult {
  const left = parseFraction(leftInput);
  const right = parseFraction(rightInput);
  const leftCross = left.fraction.numerator * right.fraction.denominator;
  const rightCross = right.fraction.numerator * left.fraction.denominator;
  const symbol = compareBigInts(leftCross, rightCross);
  const steps = buildSteps(left, right, leftCross, rightCross, symbol);
  const plainText = `${left.display} ${symbol} ${right.display}`;

  return {
    left,
    right,
    symbol,
    crossProducts: {
      left: leftCross,
      right: rightCross
    },
    steps,
    visual: getVisualState(left.fraction, right.fraction),
    plainText
  };
}

export function normalizeFraction(fraction: Fraction): Fraction {
  if (fraction.denominator === 0n) {
    throw new FractionInputError('zero-denominator', 'The denominator cannot be 0.');
  }

  let numerator = fraction.numerator;
  let denominator = fraction.denominator;

  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }

  if (numerator === 0n) {
    return { numerator: 0n, denominator: 1n };
  }

  const divisor = gcd(absBigInt(numerator), denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  };
}

export function formatFraction(fraction: Fraction): string {
  if (fraction.denominator === 1n) {
    return fraction.numerator.toString();
  }

  return `${fraction.numerator.toString()}/${fraction.denominator.toString()}`;
}

export function formatMixedFraction(fraction: Fraction): string {
  const normalized = normalizeFraction(fraction);
  const sign = normalized.numerator < 0n ? '-' : '';
  const absoluteNumerator = absBigInt(normalized.numerator);
  const whole = absoluteNumerator / normalized.denominator;
  const remainder = absoluteNumerator % normalized.denominator;

  if (remainder === 0n) {
    return `${sign}${whole.toString()}`;
  }

  if (whole === 0n) {
    return `${sign}${remainder.toString()}/${normalized.denominator.toString()}`;
  }

  return `${sign}${whole.toString()} ${remainder.toString()}/${normalized.denominator.toString()}`;
}

export function getVisualState(left: Fraction, right: Fraction): VisualState {
  const bothProperNonNegative =
    left.numerator >= 0n &&
    right.numerator >= 0n &&
    left.numerator <= left.denominator &&
    right.numerator <= right.denominator;

  const simpleEnough =
    left.denominator <= VISUAL_DENOMINATOR_LIMIT &&
    right.denominator <= VISUAL_DENOMINATOR_LIMIT;

  if (bothProperNonNegative && simpleEnough) {
    return {
      kind: 'bars',
      left,
      right,
      maxSegments: Number(left.denominator > right.denominator ? left.denominator : right.denominator)
    };
  }

  return {
    kind: 'hidden',
    reason:
      'The fraction bars are shown only for non-negative proper fractions with denominators up to 24. The exact BigInt comparison above is still used.'
  };
}

function buildSteps(
  left: ParsedFraction,
  right: ParsedFraction,
  leftCross: bigint,
  rightCross: bigint,
  symbol: ComparisonSymbol
): ComparisonStep[] {
  const steps: ComparisonStep[] = [];
  const leftOriginal = left.original.trim();
  const rightOriginal = right.original.trim();

  if (left.wasMixed || right.wasMixed) {
    steps.push({
      title: 'Convert mixed numbers',
      body: 'A mixed number is converted to an improper fraction before comparison.',
      expression: `${leftOriginal} -> ${left.display}; ${rightOriginal} -> ${right.display}`
    });
  }

  const normalizationNotes = [
    left.wasReduced || left.normalizedDenominator
      ? `${leftOriginal} normalizes to ${left.display}`
      : `${leftOriginal} is ${left.display}`,
    right.wasReduced || right.normalizedDenominator
      ? `${rightOriginal} normalizes to ${right.display}`
      : `${rightOriginal} is ${right.display}`
  ];

  steps.push({
    title: 'Normalize each fraction',
    body: 'Signs are moved to the numerator, denominators are made positive, and equivalent fractions are reduced.',
    expression: normalizationNotes.join('; ')
  });

  if (left.fraction.denominator === right.fraction.denominator) {
    steps.push({
      title: 'Compare the numerators',
      body: 'The denominators match, so the fraction with the larger numerator is larger.',
      expression: `${left.fraction.numerator.toString()} ${symbol} ${right.fraction.numerator.toString()}`
    });
  } else {
    steps.push({
      title: 'Use cross multiplication',
      body: 'With positive denominators, comparing a/b and c/d is the same as comparing a x d and c x b.',
      expression: `${left.fraction.numerator.toString()} x ${right.fraction.denominator.toString()} = ${leftCross.toString()}; ${right.fraction.numerator.toString()} x ${left.fraction.denominator.toString()} = ${rightCross.toString()}`
    });
    steps.push({
      title: 'Read the result',
      body: 'The larger cross product belongs to the larger fraction. Equal cross products mean the fractions are equivalent.',
      expression: `${leftCross.toString()} ${symbol} ${rightCross.toString()}`
    });
  }

  steps.push({
    title: 'Final comparison',
    body: 'The comparison is exact. No decimal rounding is used.',
    expression: `${left.display} ${symbol} ${right.display}`
  });

  return steps;
}

function compareBigInts(left: bigint, right: bigint): ComparisonSymbol {
  if (left < right) return '<';
  if (left > right) return '>';
  return '=';
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left;
  let b = right;

  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }

  return a;
}

function absBigInt(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function assertDigitLimit(...parts: string[]): void {
  const tooManyDigits = parts.some((part) => part.replace(/^[+-]/, '').length > DIGIT_LIMIT);
  if (tooManyDigits) {
    throw new FractionInputError(
      'too-many-digits',
      `Use no more than ${DIGIT_LIMIT} digits in any numerator, denominator, or whole number.`
    );
  }
}
