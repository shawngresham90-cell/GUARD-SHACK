import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest runs with `globals: false`, so React Testing Library cannot auto-register
// its afterEach cleanup. Register it explicitly to unmount rendered trees between
// tests — otherwise repeated renders of the same text accumulate in the jsdom DOM
// and `getByText` throws "found multiple elements".
afterEach(() => {
  cleanup();
});
