import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer', () => {
  it('renders the powered by text', () => {
    render(<Footer />);
    expect(screen.getByText('Internet Computer')).toBeInTheDocument();
  });

  it('renders link to IC Dashboard', () => {
    render(<Footer />);
    const link = screen.getByText('View on IC Dashboard');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('dashboard.internetcomputer.org'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('includes the canister ID in the dashboard link', () => {
    render(<Footer />);
    const link = screen.getByText('View on IC Dashboard');
    expect(link).toHaveAttribute('href', expect.stringContaining('hl3xq-uiaaa-aaaar-qbxqa-cai'));
  });
});
