import {
  ArrowLeftRight,
  BookOpen,
  Check,
  Copy,
  Equal,
  Eraser,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
  TriangleAlert
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { FractionInputError, compareFractions } from './fraction';
import type { ComparisonResult } from './fraction';
import type { PageMeta } from './pages';
import { pages } from './pages';
import './styles.css';

type AppProps = {
  page: PageMeta;
};

type Example = {
  label: string;
  left: string;
  right: string;
};

const examples: Example[] = [
  { label: 'Different denominators', left: '3/4', right: '5/8' },
  { label: 'Equivalent fractions', left: '2/3', right: '8/12' },
  { label: 'Negative fractions', left: '-1/2', right: '-3/4' },
  { label: 'Mixed number', left: '1 2/3', right: '5/4' },
  { label: 'Large integers', left: '123456789123456789/7', right: '987654321987654321/56' }
];

const randomPairs: Array<[string, string]> = [
  ['4/9', '5/12'],
  ['7/10', '2/3'],
  ['-2/5', '-1/3'],
  ['1 1/4', '6/5'],
  ['9/12', '3/4'],
  ['5', '22/5']
];

export default function App({ page }: AppProps) {
  if (page.key === 'privacy') return <PrivacyPage />;
  if (page.key === 'terms') return <TermsPage />;
  if (page.key === 'guide') return <GuidePage />;
  if (page.key === 'notFound') return <NotFoundPage />;
  return <HomePage />;
}

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <section className="tool-band" aria-labelledby="tool-heading">
          <div className="tool-grid page-shell">
            <div className="tool-intro">
              <p className="eyebrow">Exact fraction comparison</p>
              <h1 id="tool-heading">Comparing Fractions Calculator</h1>
              <p className="lead">
                Enter two fractions, mixed numbers, integers, or negative fractions to see which
                fraction is greater, less than, or equal. The comparison uses exact BigInt math, not
                decimal rounding.
              </p>
              <ul className="feature-list" aria-label="Supported inputs">
                <li>Fractions like 3/4 or -5/6</li>
                <li>Integers like 2 or -10</li>
                <li>Mixed numbers like 1 2/3</li>
              </ul>
            </div>
            <FractionTool />
          </div>
        </section>
        <section className="page-shell compact-guide" aria-labelledby="quick-guide">
          <div className="section-heading">
            <p className="eyebrow">Related tutorial</p>
            <h2 id="quick-guide">How do you compare fractions?</h2>
            <p>
              Most comparing fractions questions use the same few ideas: same denominator, same
              numerator, common denominator, cross multiplication, and visual checks.
            </p>
          </div>
          <div className="method-grid">
            <MethodCard
              title="Same denominators"
              body="If the denominators match, compare the numerators. For example, 5/8 is greater than 3/8 because 5 is greater than 3."
            />
            <MethodCard
              title="Different denominators"
              body="Use a common denominator or cross multiply. Both methods compare equal-size parts, which is why they agree."
            />
            <MethodCard
              title="Negative and mixed fractions"
              body="Convert mixed numbers first and keep the sign. On the number line, the value farther right is greater."
            />
          </div>
          <p className="next-link">
            <a href={pages.guide.path}>Read the full how to compare fractions guide</a>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function FractionTool() {
  const [left, setLeft] = useState('3/4');
  const [right, setRight] = useState('5/8');
  const [submitted, setSubmitted] = useState(true);
  const [copied, setCopied] = useState(false);

  const result = useMemo<ComparisonResult | Error | null>(() => {
    try {
      if (!submitted) return null;
      return compareFractions(left, right);
    } catch (error) {
      return error instanceof Error
        ? error
        : new Error('Something went wrong while comparing those values.');
    }
  }, [left, right, submitted]);

  const comparison = result instanceof Error ? null : result;
  const error = result instanceof Error ? result : null;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setSubmitted(true);
  }

  function useExample(example: Example) {
    setLeft(example.left);
    setRight(example.right);
    setCopied(false);
    setSubmitted(true);
  }

  function swapInputs() {
    setLeft(right);
    setRight(left);
    setCopied(false);
    setSubmitted(true);
  }

  function clearInputs() {
    setLeft('');
    setRight('');
    setCopied(false);
    setSubmitted(false);
  }

  function resetInputs() {
    setLeft('3/4');
    setRight('5/8');
    setCopied(false);
    setSubmitted(true);
  }

  function randomize() {
    const [nextLeft, nextRight] = randomPairs[Math.floor(Math.random() * randomPairs.length)];
    setLeft(nextLeft);
    setRight(nextRight);
    setCopied(false);
    setSubmitted(true);
  }

  async function copyResult() {
    if (!comparison) return;
    const stepText = comparison.steps
      .map((step, index) => `${index + 1}. ${step.title}: ${step.expression ?? step.body}`)
      .join('\n');
    await navigator.clipboard.writeText(`${comparison.plainText}\n${stepText}`);
    setCopied(true);
  }

  return (
    <div className="tool-panel" aria-label="Fraction comparison calculator">
      <form className="fraction-form" onSubmit={submit}>
        <div className="input-row">
          <label>
            <span>First fraction</span>
            <input
              value={left}
              onChange={(event) => {
                setLeft(event.target.value);
                setSubmitted(false);
              }}
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="3/4"
            />
          </label>
          <button
            className="icon-button"
            type="button"
            onClick={swapInputs}
            aria-label="Swap fractions"
            title="Swap fractions"
          >
            <ArrowLeftRight aria-hidden="true" size={20} />
          </button>
          <label>
            <span>Second fraction</span>
            <input
              value={right}
              onChange={(event) => {
                setRight(event.target.value);
                setSubmitted(false);
              }}
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="5/8"
            />
          </label>
        </div>
        <div className="actions">
          <button className="primary-button" type="submit">
            <Equal aria-hidden="true" size={19} />
            Compare
          </button>
          <button type="button" className="secondary-button" onClick={clearInputs}>
            <Eraser aria-hidden="true" size={18} />
            Clear
          </button>
          <button type="button" className="secondary-button" onClick={resetInputs}>
            <RotateCcw aria-hidden="true" size={18} />
            Reset
          </button>
          <button type="button" className="secondary-button" onClick={randomize}>
            <RefreshCcw aria-hidden="true" size={18} />
            Random
          </button>
        </div>
      </form>
      <div className="examples" aria-label="Example comparisons">
        {examples.map((example) => (
          <button type="button" key={example.label} onClick={() => useExample(example)}>
            {example.label}
          </button>
        ))}
      </div>
      <ResultPanel result={comparison} error={error} copied={copied} onCopy={copyResult} />
    </div>
  );
}

type ResultPanelProps = {
  result: ComparisonResult | null;
  error: Error | null;
  copied: boolean;
  onCopy: () => void;
};

function ResultPanel({ result, error, copied, onCopy }: ResultPanelProps) {
  return (
    <section className="result-panel" aria-labelledby="result-heading">
      <div className="result-header">
        <h2 id="result-heading">Result</h2>
        <button
          className="icon-button"
          type="button"
          onClick={onCopy}
          disabled={!result}
          aria-label="Copy result and steps"
          title="Copy result and steps"
        >
          {copied ? <Check aria-hidden="true" size={19} /> : <Copy aria-hidden="true" size={19} />}
        </button>
      </div>
      <div className="result-live" aria-live="polite">
        {error ? (
          <ErrorMessage error={error} />
        ) : result ? (
          <ComparisonOutput result={result} copied={copied} />
        ) : (
          <p className="muted">Enter two values and press Compare.</p>
        )}
      </div>
    </section>
  );
}

function ErrorMessage({ error }: { error: Error }) {
  const message =
    error instanceof FractionInputError
      ? error.message
      : 'Something went wrong while comparing those values.';

  return (
    <div className="error-box" role="alert">
      <TriangleAlert aria-hidden="true" size={22} />
      <div>
        <strong>Check the input</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}

function ComparisonOutput({ result, copied }: { result: ComparisonResult; copied: boolean }) {
  return (
    <div className="comparison-output">
      <div className="answer-line">
        <FractionText value={result.left.display} />
        <span className="symbol" aria-label={symbolLabel(result.symbol)}>
          {result.symbol}
        </span>
        <FractionText value={result.right.display} />
      </div>
      {copied ? <p className="copied-note">Copied result and steps.</p> : null}
      <FractionVisual result={result} />
      <ol className="steps">
        {result.steps.map((step) => (
          <li key={`${step.title}-${step.expression ?? step.body}`}>
            <strong>{step.title}</strong>
            <p>{step.body}</p>
            {step.expression ? <code>{step.expression}</code> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function FractionText({ value }: { value: string }) {
  return <span className="fraction-text">{value}</span>;
}

function FractionVisual({ result }: { result: ComparisonResult }) {
  if (result.visual.kind === 'hidden') {
    return (
      <div className="visual-note">
        <ShieldCheck aria-hidden="true" size={19} />
        <p>{result.visual.reason}</p>
      </div>
    );
  }

  return (
    <div className="fraction-bars" aria-label="Fraction bar visual model">
      <FractionBar fraction={result.left.fraction} label={result.left.display} />
      <FractionBar fraction={result.right.fraction} label={result.right.display} />
    </div>
  );
}

function FractionBar({ fraction, label }: { fraction: { numerator: bigint; denominator: bigint }; label: string }) {
  const denominator = Number(fraction.denominator);
  const numerator = Number(fraction.numerator);
  const cells = Array.from({ length: denominator }, (_, index) => index < numerator);

  return (
    <div className="bar-row">
      <span>{label}</span>
      <div className="bar" style={{ gridTemplateColumns: `repeat(${denominator}, minmax(0, 1fr))` }}>
        {cells.map((filled, index) => (
          <span key={`${label}-${index}`} className={filled ? 'filled' : ''} />
        ))}
      </div>
    </div>
  );
}

function MethodCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="method-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}

function GuidePage() {
  return (
    <>
      <Header />
      <main className="page-shell text-page">
        <p className="eyebrow">Fraction comparison tutorial</p>
        <h1>How to Compare Fractions</h1>
        <p className="lead narrow">
          To compare fractions, first look for a simple relationship. Same denominators, same
          numerators, common denominators, cross multiplication, fraction bars, and number lines all
          answer the same question: which value is farther to the right on the number line?
        </p>
        <section aria-labelledby="quick-answer">
          <h2 id="quick-answer">Quick answer</h2>
          <p>
            A fraction comparison checks whether the first fraction is less than, equal to, or
            greater than the second fraction. For different denominators, cross multiply exactly:
            compare <code>a x d</code> with <code>c x b</code> for <code>a/b</code> and{' '}
            <code>c/d</code>. This is the same comparison you get from a common denominator.
          </p>
          <p>
            Need a worked answer now? Use the{' '}
            <a href={pages.home.path}>comparing fractions calculator</a> and then read the steps
            below to check the reasoning.
          </p>
        </section>
        <GuideSections />
        <section aria-labelledby="sources">
          <h2 id="sources">Learning sources</h2>
          <p>
            This guide was written from current educational references checked on July 27, 2026,
            including{' '}
            <a href="https://www.thecorestandards.org/Math/Content/4/NF/A/2/" rel="noopener">
              Common Core 4.NF.A.2
            </a>
            ,{' '}
            <a
              href="https://www.khanacademy.org/math/cc-fourth-grade-math/comparing-fractions-and-equivalent-fractions"
              rel="noopener"
            >
              Khan Academy fraction comparison lessons
            </a>
            ,{' '}
            <a href="https://www.mathsisfun.com/comparing-fractions.html" rel="noopener">
              Math is Fun comparing fractions
            </a>
            , and{' '}
            <a
              href="https://flexbooks.ck12.org/cbook/ck-12-cbse-maths-class-6/section/5.3/primary/lesson/comparing-and-ordering-fractions/"
              rel="noopener"
            >
              CK-12 comparing and ordering fractions
            </a>
            . The wording and examples here are original to this site.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function GuideSections() {
  return (
    <>
      <section aria-labelledby="same-denominator">
        <h2 id="same-denominator">Compare fractions with the same denominator</h2>
        <p>
          If two fractions have the same denominator, the parts are the same size. Compare the
          numerators only. For example, <code>5/8 &gt; 3/8</code> because 5 eighths is more than 3
          eighths.
        </p>
      </section>
      <section aria-labelledby="same-numerator">
        <h2 id="same-numerator">Compare fractions with the same numerator</h2>
        <p>
          For positive fractions with the same numerator, the smaller denominator makes larger
          pieces. That means <code>3/5 &gt; 3/7</code>. Do not use this shortcut when signs or
          numerators differ without checking the values.
        </p>
      </section>
      <section aria-labelledby="different-denominators">
        <h2 id="different-denominators">How do you compare fractions with different denominators?</h2>
        <p>
          Use equivalent fractions with a common denominator, then compare numerators. To compare{' '}
          <code>3/4</code> and <code>5/8</code>, rewrite <code>3/4</code> as <code>6/8</code>.
          Since <code>6/8 &gt; 5/8</code>, <code>3/4 &gt; 5/8</code>.
        </p>
      </section>
      <section aria-labelledby="cross-multiply">
        <h2 id="cross-multiply">Cross multiply to tell which fraction is greater</h2>
        <p>
          Cross multiplication is a compact way to do the common denominator comparison. For{' '}
          <code>a/b</code> and <code>c/d</code>, compare <code>a x d</code> and <code>c x b</code>.
          It works when denominators are positive. This calculator normalizes negative denominators
          before using the rule.
        </p>
      </section>
      <section aria-labelledby="greater-less">
        <h2 id="greater-less">Use greater than and less than signs with fractions</h2>
        <p>
          After comparing, write the relation with <code>&lt;</code>, <code>=</code>, or{' '}
          <code>&gt;</code>. Read it left to right: <code>2/3 &lt; 3/4</code> says two thirds is
          less than three fourths.
        </p>
      </section>
      <section aria-labelledby="negative-fractions">
        <h2 id="negative-fractions">Compare negative fractions</h2>
        <p>
          Negative fractions are compared on the same number line. The value closer to zero is
          greater, so <code>-1/3 &gt; -2/3</code>. Cross multiplication still works after signs are
          normalized and denominators are positive.
        </p>
      </section>
      <section aria-labelledby="mixed-improper">
        <h2 id="mixed-improper">Compare mixed numbers and improper fractions</h2>
        <p>
          Convert mixed numbers to improper fractions first. For example, <code>1 2/3</code> becomes{' '}
          <code>5/3</code>. Then use the same denominator or cross multiplication method.
        </p>
      </section>
      <section aria-labelledby="visual-models">
        <h2 id="visual-models">Check with fraction bars or a number line</h2>
        <p>
          Fraction bars help when both values are between 0 and 1. Number lines help with negatives
          and mixed numbers because the greater value is always farther right. Visual models should
          support the exact math, not replace it for extreme values.
        </p>
      </section>
      <section aria-labelledby="mistakes">
        <h2 id="mistakes">Common mistakes when comparing fractions</h2>
        <ul>
          <li>Comparing denominators only when the numerators are not the same.</li>
          <li>Using the same-numerator shortcut on negative fractions without checking the sign.</li>
          <li>Rounding decimals and treating a rounded tie as exact equality.</li>
          <li>Forgetting that a negative denominator changes the sign of the fraction.</li>
        </ul>
      </section>
    </>
  );
}

function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="page-shell text-page">
        <p className="eyebrow">Version one privacy</p>
        <h1>Privacy Policy</h1>
        <p className="lead narrow">
          Comparing Fractions is designed as a browser-local educational tool. You can compare
          fractions without creating an account.
        </p>
        <section>
          <h2>Data we process</h2>
          <p>
            The fractions you type are processed in your browser to show a comparison and
            explanation. Version one does not use analytics, advertising trackers, cookies,
            accounts, databases, or server-side fraction storage.
          </p>
        </section>
        <section>
          <h2>Children and classrooms</h2>
          <p>
            This site is intended for ordinary educational use by students, parents, and teachers,
            but it does not collect names, class rosters, email addresses, grades, or public user
            content.
          </p>
        </section>
        <section>
          <h2>Contact</h2>
          <p>
            For privacy questions, contact the site owner through the public GitHub repository once
            it is available.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function TermsPage() {
  return (
    <>
      <Header />
      <main className="page-shell text-page">
        <p className="eyebrow">Educational use</p>
        <h1>Terms of Use</h1>
        <p className="lead narrow">
          Comparing Fractions provides an educational calculator and tutorial. It is a helper for
          checking work, not a replacement for your teacher, curriculum, or required coursework.
        </p>
        <section>
          <h2>Use of the tool</h2>
          <p>
            You may use the calculator to compare fractions, integers, mixed numbers, improper
            fractions, and negative fractions within the stated input limits. Results are generated
            from the values you enter.
          </p>
        </section>
        <section>
          <h2>No guarantees</h2>
          <p>
            We aim for accurate math and test edge cases, but the site is provided as-is. Always
            review important school, tutoring, or assessment work yourself.
          </p>
        </section>
        <section>
          <h2>Content rights</h2>
          <p>
            The site text, examples, and interface are original. External educational references are
            linked for learning context and are owned by their respective publishers.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}

function NotFoundPage() {
  return (
    <>
      <Header />
      <main className="page-shell text-page not-found">
        <h1>Page Not Found</h1>
        <p className="lead narrow">
          That page is not part of Comparing Fractions. The calculator and tutorial are still here.
        </p>
        <p>
          <a className="primary-link" href={pages.home.path}>
            Open the fraction comparison calculator
          </a>
        </p>
      </main>
      <Footer />
    </>
  );
}

function Header() {
  return (
    <header className="site-header">
      <a className="brand" href={pages.home.path} aria-label="Comparing Fractions home">
        <span className="brand-mark">3/4</span>
        <span>Comparing Fractions</span>
      </a>
      <nav aria-label="Primary navigation">
        <a href={pages.home.path}>Calculator</a>
        <a href={pages.guide.path}>How to Compare</a>
        <a href={pages.privacy.path}>Privacy</a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <strong>Comparing Fractions</strong>
        <p>Exact browser-local comparison for students, parents, and teachers.</p>
      </div>
      <nav aria-label="Footer navigation">
        <a href={pages.guide.path}>
          <BookOpen aria-hidden="true" size={17} />
          Guide
        </a>
        <a href={pages.privacy.path}>Privacy</a>
        <a href={pages.terms.path}>Terms</a>
      </nav>
    </footer>
  );
}

function symbolLabel(symbol: '<' | '=' | '>') {
  if (symbol === '<') return 'less than';
  if (symbol === '>') return 'greater than';
  return 'equal to';
}
