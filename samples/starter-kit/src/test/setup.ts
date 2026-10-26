import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Testing Library only cleans up automatically when vitest runs with globals enabled, which this
// project does not. Without this, every render in a file accumulates and the second test in a
// suite starts finding the first one's elements.
afterEach(cleanup)
