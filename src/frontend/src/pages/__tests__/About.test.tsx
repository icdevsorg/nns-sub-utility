import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { About } from '../About';

describe('About', () => {
  it('renders the page title', () => {
    render(<About />);
    expect(screen.getByText('About ICRC-79')).toBeInTheDocument();
  });

  it('renders "What is ICRC-79?" section', () => {
    render(<About />);
    expect(screen.getByText('What is ICRC-79?')).toBeInTheDocument();
  });

  it('renders "How It Works" section', () => {
    render(<About />);
    expect(screen.getByText('How It Works')).toBeInTheDocument();
  });

  it('renders "Canister Details" section with canister ID', () => {
    render(<About />);
    expect(screen.getByText('Canister Details')).toBeInTheDocument();
    expect(screen.getByText('hl3xq-uiaaa-aaaar-qbxqa-cai')).toBeInTheDocument();
  });

  it('renders "Deep Link Integration" section', () => {
    render(<About />);
    expect(screen.getByText('Deep Link Integration')).toBeInTheDocument();
  });

  it('renders the deep link parameter table', () => {
    render(<About />);
    expect(screen.getByText('token')).toBeInTheDocument();
    expect(screen.getByText('service')).toBeInTheDocument();
    expect(screen.getByText('amount')).toBeInTheDocument();
    expect(screen.getByText('interval')).toBeInTheDocument();
  });

  it('renders View link to IC Dashboard', () => {
    render(<About />);
    const link = screen.getByText('View →');
    expect(link).toHaveAttribute('href', expect.stringContaining('dashboard.internetcomputer.org'));
  });
});
