/**
 * Base64 encoding/decoding utilities
 * 
 * Simple implementation for React Native compatibility
 */

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Encode a string to base64
 */
export function base64Encode(str: string): string {
  // Use native btoa if available (Hermes with proper config)
  if (typeof btoa === 'function') {
    try {
      return btoa(str);
    } catch {
      // Fall through to manual implementation
    }
  }
  
  let result = '';
  const bytes: number[] = [];
  
  // Convert string to byte array (ASCII only)
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xFF);
  }
  
  // Encode bytes to base64
  for (let i = 0; i < bytes.length; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    
    result += BASE64_CHARS[b1 >> 2];
    result += BASE64_CHARS[((b1 & 0x03) << 4) | (b2 >> 4)];
    result += i + 1 < bytes.length ? BASE64_CHARS[((b2 & 0x0F) << 2) | (b3 >> 6)] : '=';
    result += i + 2 < bytes.length ? BASE64_CHARS[b3 & 0x3F] : '=';
  }
  
  return result;
}

/**
 * Decode a base64 string
 */
export function base64Decode(str: string): string {
  // Use native atob if available
  if (typeof atob === 'function') {
    try {
      return atob(str);
    } catch {
      // Fall through to manual implementation
    }
  }
  
  let result = '';
  
  // Remove padding
  const cleanStr = str.replace(/=+$/, '');
  
  // Build lookup table
  const lookup: { [key: string]: number } = {};
  for (let i = 0; i < BASE64_CHARS.length; i++) {
    lookup[BASE64_CHARS[i]] = i;
  }
  
  // Decode base64 to bytes
  const bytes: number[] = [];
  for (let i = 0; i < cleanStr.length; i += 4) {
    const c1 = lookup[cleanStr[i]] ?? 0;
    const c2 = lookup[cleanStr[i + 1]] ?? 0;
    const c3 = i + 2 < cleanStr.length ? (lookup[cleanStr[i + 2]] ?? 0) : 0;
    const c4 = i + 3 < cleanStr.length ? (lookup[cleanStr[i + 3]] ?? 0) : 0;
    
    bytes.push((c1 << 2) | (c2 >> 4));
    if (i + 2 < cleanStr.length) bytes.push(((c2 & 0x0F) << 4) | (c3 >> 2));
    if (i + 3 < cleanStr.length) bytes.push(((c3 & 0x03) << 6) | c4);
  }
  
  // Convert bytes to string
  for (const b of bytes) {
    result += String.fromCharCode(b);
  }
  
  return result;
}
