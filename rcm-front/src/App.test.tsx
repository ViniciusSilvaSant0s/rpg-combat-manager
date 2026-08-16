import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import App from './App'

test('renders the initial counter and increments it', () => {
  render(<App />)

  const counter = screen.getByRole('button', { name: 'Count is 0' })

  fireEvent.click(counter)

  expect(counter).toHaveTextContent('Count is 1')
})
