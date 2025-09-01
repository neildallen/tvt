// Polyfills for Node.js modules in browser environment
import { Buffer } from 'buffer';

// Make Buffer available globally
(window as any).global = window;
(window as any).Buffer = Buffer;

// Export for module usage
export { Buffer };
