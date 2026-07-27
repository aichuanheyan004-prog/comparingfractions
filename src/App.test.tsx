import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { pages } from './pages';

describe('App fraction tool', () => {
  it('compares values, swaps inputs, copies result, and resets', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    });

    render(<App page={pages.home} />);

    const first = screen.getByLabelText('First fraction');
    const second = screen.getByLabelText('Second fraction');
    await user.clear(first);
    await user.type(first, '2/3');
    await user.clear(second);
    await user.type(second, '3/4');
    await user.click(screen.getByRole('button', { name: 'Compare' }));

    const result = screen.getByRole('heading', { name: 'Result' }).closest('section');
    expect(result).not.toBeNull();
    expect(within(result as HTMLElement).getByText('<')).toBeInTheDocument();
    expect(screen.getByText('Use cross multiplication')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Swap fractions' }));
    expect(within(result as HTMLElement).getByText('>')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy result and steps' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText('Copied result and steps.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(first).toHaveValue('3/4');
    expect(second).toHaveValue('5/8');
  });

  it('shows clear denominator and syntax errors', async () => {
    const user = userEvent.setup();
    render(<App page={pages.home} />);

    const first = screen.getByLabelText('First fraction');
    await user.clear(first);
    await user.type(first, '1/0');
    await user.click(screen.getByRole('button', { name: 'Compare' }));
    expect(screen.getByRole('alert')).toHaveTextContent('denominator cannot be 0');

    await user.clear(first);
    await user.type(first, '1 // 2');
    await user.click(screen.getByRole('button', { name: 'Compare' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Use formats');
  });

  it('renders guide long-tail sections on the tutorial page', () => {
    render(<App page={pages.guide} />);
    expect(screen.getByRole('heading', { name: 'How to Compare Fractions' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'How do you compare fractions with different denominators?'
      })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cross multiply to tell which fraction is greater' })).toBeInTheDocument();
    expect(screen.getByText(/greater than and less than signs/i)).toBeInTheDocument();
  });
});
