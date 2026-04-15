import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DfxCommandBuilder } from '../DfxCommandBuilder';

describe('DfxCommandBuilder', () => {
  const servicePrincipal = 'rrkah-fqaaa-aaaaa-aaaaq-cai';

  it('renders the component title', () => {
    render(<DfxCommandBuilder servicePrincipal={servicePrincipal} />);
    expect(screen.getByText('DFX Command Builder')).toBeInTheDocument();
  });

  it('renders operation select with default value', () => {
    render(<DfxCommandBuilder servicePrincipal={servicePrincipal} />);
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('get_service_subscriptions');
  });

  it('generates command containing service principal', () => {
    render(<DfxCommandBuilder servicePrincipal={servicePrincipal} />);
    const pre = screen.getByText(/dfx canister call/);
    expect(pre.textContent).toContain(servicePrincipal);
  });

  it('generates command containing canister ID', () => {
    render(<DfxCommandBuilder servicePrincipal={servicePrincipal} />);
    const pre = screen.getByText(/dfx canister call/);
    expect(pre.textContent).toContain('hl3xq-uiaaa-aaaar-qbxqa-cai');
  });

  it('switches operation and updates command', () => {
    render(<DfxCommandBuilder servicePrincipal={servicePrincipal} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'get_service_payments' } });
    const pre = screen.getByText(/dfx canister call/);
    expect(pre.textContent).toContain('icrc79_get_service_payments');
  });

  it('shows subscription ID input for mutation operations', () => {
    render(<DfxCommandBuilder servicePrincipal={servicePrincipal} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'cancel_subscription' } });
    expect(screen.getByPlaceholderText('e.g. 42')).toBeInTheDocument();
  });

  it('shows reason input for pause/cancel operations', () => {
    render(<DfxCommandBuilder servicePrincipal={servicePrincipal} />);
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'pause_subscription' } });
    expect(screen.getByPlaceholderText('Optional reason')).toBeInTheDocument();
  });

  it('renders copy button', () => {
    render(<DfxCommandBuilder servicePrincipal={servicePrincipal} />);
    // The copy button exists (text "Copy" or similar icon)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
