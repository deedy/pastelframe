import { render, screen } from '@testing-library/react';
import PastelFrame from './PastelFrame';

test('renders learn react link', () => {
  render(<PastelFrame />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
