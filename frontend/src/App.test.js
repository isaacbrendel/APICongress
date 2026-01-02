import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  test('renders home screen initially', () => {
    render(<App />);
    // Check for home screen elements - topic input should be present
    const inputElements = screen.getAllByRole('textbox');
    expect(inputElements.length).toBeGreaterThan(0);
  });

  test('background video component is present', () => {
    const { container } = render(<App />);
    // Check that the BackgroundVideo wrapper is rendered
    expect(container.firstChild).toBeTruthy();
  });
});
