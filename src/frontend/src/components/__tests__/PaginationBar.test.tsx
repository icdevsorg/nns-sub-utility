import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PaginationBar } from '../PaginationBar';

describe('PaginationBar', () => {
  it('renders current page info', () => {
    render(<PaginationBar page={0} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByText('Page 1 of 5')).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    render(<PaginationBar page={0} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByText('← Previous')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(<PaginationBar page={4} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByText('Next →')).toBeDisabled();
  });

  it('calls onPageChange with next page', () => {
    const onPageChange = vi.fn();
    render(<PaginationBar page={2} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('Next →'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with previous page', () => {
    const onPageChange = vi.fn();
    render(<PaginationBar page={2} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByText('← Previous'));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('shows "Page 1 of 1" when totalPages is 0', () => {
    render(<PaginationBar page={0} totalPages={0} onPageChange={() => {}} />);
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  });
});
