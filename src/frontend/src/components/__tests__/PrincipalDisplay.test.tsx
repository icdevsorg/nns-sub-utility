import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PrincipalDisplay } from '../PrincipalDisplay';

describe('PrincipalDisplay', () => {
  const principal = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  it('renders shortened principal by default', () => {
    render(<PrincipalDisplay principal={principal} />);
    // First 7 chars + ... + last 5 chars
    expect(screen.getByText('rrkah-f...q-cai')).toBeInTheDocument();
  });

  it('renders full principal when short=false', () => {
    render(<PrincipalDisplay principal={principal} short={false} />);
    expect(screen.getByText(principal)).toBeInTheDocument();
  });

  it('renders short principal as-is when under 16 chars', () => {
    const shortPrincipal = 'aaaaa-aa';
    render(<PrincipalDisplay principal={shortPrincipal} />);
    expect(screen.getByText('aaaaa-aa')).toBeInTheDocument();
  });

  it('copies principal to clipboard on click', async () => {
    render(<PrincipalDisplay principal={principal} />);
    const button = screen.getByRole('button');
    await act(async () => {
      fireEvent.click(button);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(principal);
  });

  it('has the full principal as tooltip', () => {
    render(<PrincipalDisplay principal={principal} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('title', principal);
  });
});
