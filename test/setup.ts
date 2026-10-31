import { afterEach } from "vitest";
import { cleanup } from "@testing-library/vue";

// Vitest does not run with globals enabled, so Testing Library cannot register
// its own cleanup hook. Without this, components stay mounted between tests and
// keep reacting to shared route mocks.
afterEach(() => {
  cleanup();
});
