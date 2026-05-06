import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { About } from '../About';
import { Principal } from '@dfinity/principal';

const tokenMock = { data: undefined as any, isPending: false };

vi.mock('../../hooks/useTokenInfo', () => ({
  useTokenInfo: () => tokenMock,
}));

beforeEach(() => {
  tokenMock.data = [
    {
      tokenCanister: Principal.fromText('ryjl3-tyaaa-aaaaa-aaaba-cai'),
      tokenSymbol: 'ICP',
      tokenDecimals: 8,
      tokenFee: [10_000n],
      standards: ['ICRC-1', 'ICRC-2'],
    },
  ];
  tokenMock.isPending = false;
});

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
    expect(screen.getAllByText('service').length).toBeGreaterThan(0);
    expect(screen.getByText('amount')).toBeInTheDocument();
    expect(screen.getByText('interval')).toBeInTheDocument();
  });

  it('updates the generated deep link from the builder', () => {
    render(<About />);

    fireEvent.change(screen.getByLabelText('Service Canister Principal'), {
      target: { value: 'aaaaa-aa' },
    });
    fireEvent.change(screen.getByLabelText('Token Canister Principal'), {
      target: { value: 'ryjl3-tyaaa-aaaaa-aaaba-cai' },
    });
    fireEvent.change(screen.getByLabelText('Product ID'), {
      target: { value: '42' },
    });

    expect((screen.getByLabelText('Generated deep link') as HTMLTextAreaElement).value).toContain(
      '/#/subscribe?token=ryjl3-tyaaa-aaaaa-aaaba-cai&service=aaaaa-aa&interval=Monthly&product=42',
    );
  });

  it('renders service principal guidance and account-string documentation', () => {
    render(<About />);

    expect(screen.getByText(/backend\/service canister principal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/principal:64-hex-subaccount/i).length).toBeGreaterThan(0);
  });

  it('explains which request fields are truly optional and their defaults', () => {
    render(<About />);

    expect(screen.getByText(/the final subscription request still requires token, service, amount, and interval/i)).toBeInTheDocument();
    expect(screen.getByText(/if omitted, the first payment is immediate/i)).toBeInTheDocument();
    expect(screen.getByText(/defaults to the service canister's default account/i)).toBeInTheDocument();
    expect(screen.getByText(/optional request items not yet exposed by the url builder/i)).toBeInTheDocument();
  });

  it('renders View link to IC Dashboard', () => {
    render(<About />);
    const link = screen.getByText('View →');
    expect(link).toHaveAttribute('href', expect.stringContaining('dashboard.internetcomputer.org'));
  });
});
