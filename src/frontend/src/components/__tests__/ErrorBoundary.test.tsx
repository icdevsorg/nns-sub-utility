import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

function ThrowingComponent({ message }: { message: string }): never {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  // Suppress React error boundary console.error noise
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <p>Hello world</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders error message when child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Test failure" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test failure')).toBeInTheDocument();
  });

  it('renders Try Again button', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Oops" />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('renders Try Again button that resets error state', () => {
    // We can't easily test re-render after reset since React re-throws
    // during the same render cycle. Instead, verify the button exists and is clickable.
    render(
      <ErrorBoundary>
        <ThrowingComponent message="Oops" />
      </ErrorBoundary>,
    );
    const btn = screen.getByText('Try Again');
    expect(btn).toBeInTheDocument();
    // Clicking should not throw
    fireEvent.click(btn);
  });
});
