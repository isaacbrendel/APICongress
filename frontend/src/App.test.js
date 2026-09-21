import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('./components/BackgroundVideo', () => {
  return function MockBackground({ children }) {
    return <div data-testid="background">{children}</div>;
  };
});

test('renders APICONGRESS brand on home', () => {
  render(<App />);
  expect(screen.getByText(/APICONGRESS/i)).toBeInTheDocument();
});

test('renders open floor call to action', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /open floor/i })).toBeInTheDocument();
});

test('renders trending rail', () => {
  render(<App />);
  expect(screen.getByLabelText(/trending debate topics/i)).toBeInTheDocument();
});
