import { TextDecoder, TextEncoder } from 'util';

// jsdom does not expose these Web Platform encoders even though browsers do.
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
