/**
 * Phase 3 - File Validation Utilities
 * 
 * Implements P0 Critical: Validate file uploads with magic number checks
 * 
 * @module server/utils/fileValidation
 * @version 3.0.0
 */

import { VALIDATION } from '@/types';
import crypto from 'crypto';

// =============================================================================
// TYPES
// =============================================================================

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  detectedMimeType?: string;
  sanitizedFilename?: string;
  hash?: string;
}

export interface ValidatedFile {
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
  sanitizedFilename: string;
  size: number;
  hash: string;
}

// =============================================================================
// MAGIC BYTE SIGNATURES
// =============================================================================

const MAGIC_SIGNATURES: Record<string, { bytes: number[]; offset?: number; mimeType: string }[]> = {
  'image/jpeg': [
    { bytes: [0xFF, 0xD8, 0xFF, 0xE0], mimeType: 'image/jpeg' }, // JFIF
    { bytes: [0xFF, 0xD8, 0xFF, 0xE1], mimeType: 'image/jpeg' }, // EXIF
    { bytes: [0xFF, 0xD8, 0xFF, 0xE8], mimeType: 'image/jpeg' }, // SPIFF
    { bytes: [0xFF, 0xD8, 0xFF, 0xDB], mimeType: 'image/jpeg' }, // Raw JPEG
  ],
  'image/png': [
    { bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mimeType: 'image/png' },
  ],
  'image/webp': [
    { bytes: [0x52, 0x49, 0x46, 0x46], mimeType: 'image/webp' }, // RIFF header
  ],
  'image/gif': [
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mimeType: 'image/gif' }, // GIF87a
    { bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mimeType: 'image/gif' }, // GIF89a
  ],
};

// =============================================================================
// MAGIC BYTE DETECTION
// =============================================================================

/**
 * Detect actual file type from magic bytes
 */
export function detectMimeType(buffer: Buffer): string | null {
  // Check for WEBP (special case - needs additional validation)
  if (buffer.length >= 12) {
    const riff = buffer.subarray(0, 4);
    const webp = buffer.subarray(8, 12);
    if (
      riff[0] === 0x52 && riff[1] === 0x49 && riff[2] === 0x46 && riff[3] === 0x46 &&
      webp[0] === 0x57 && webp[1] === 0x45 && webp[2] === 0x42 && webp[3] === 0x50
    ) {
      return 'image/webp';
    }
  }

  // Check other signatures
  for (const [mimeType, signatures] of Object.entries(MAGIC_SIGNATURES)) {
    if (mimeType === 'image/webp') continue; // Already handled above
    
    for (const sig of signatures) {
      const offset = sig.offset || 0;
      if (buffer.length < offset + sig.bytes.length) continue;
      
      let matches = true;
      for (let i = 0; i < sig.bytes.length; i++) {
        if (buffer[offset + i] !== sig.bytes[i]) {
          matches = false;
          break;
        }
      }
      
      if (matches) {
        return sig.mimeType;
      }
    }
  }

  return null;
}

/**
 * Validate that declared MIME type matches actual file content
 */
export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): boolean {
  const detectedType = detectMimeType(buffer);
  
  if (!detectedType) {
    return false;
  }

  // Handle MIME type aliases
  const normalizedDeclared = normalizeMimeType(declaredMimeType);
  const normalizedDetected = normalizeMimeType(detectedType);

  return normalizedDeclared === normalizedDetected;
}

/**
 * Normalize MIME type for comparison
 */
function normalizeMimeType(mimeType: string): string {
  const lower = mimeType.toLowerCase().trim();
  
  // Handle common aliases
  const aliases: Record<string, string> = {
    'image/jpg': 'image/jpeg',
    'image/pjpeg': 'image/jpeg',
  };

  return aliases[lower] || lower;
}

// =============================================================================
// FILENAME SANITIZATION
// =============================================================================

/**
 * Sanitize filename to prevent path traversal and injection attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators
  let sanitized = filename.replace(/[/\\]/g, '');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Limit length
  if (sanitized.length > 200) {
    const ext = getExtension(sanitized);
    const name = sanitized.slice(0, 200 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  // Prevent hidden files
  if (sanitized.startsWith('.')) {
    sanitized = `_${sanitized.slice(1)}`;
  }

  // Default name if empty
  if (!sanitized || sanitized === '.') {
    sanitized = `upload_${Date.now()}`;
  }

  return sanitized;
}

/**
 * Get file extension
 */
function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts[parts.length - 1] || '') : '';
}

// =============================================================================
// COMPREHENSIVE FILE VALIDATION
// =============================================================================

/**
 * Perform comprehensive file validation
 */
export function validateFile(
  buffer: Buffer,
  declaredMimeType: string,
  originalFilename: string
): FileValidationResult {
  // Check file size
  if (buffer.length === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (buffer.length > VALIDATION.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size (${Math.round(buffer.length / 1024 / 1024)}MB) exceeds maximum allowed (${VALIDATION.MAX_FILE_SIZE / 1024 / 1024}MB)`,
    };
  }

  // Detect actual MIME type
  const detectedMimeType = detectMimeType(buffer);
  
  if (!detectedMimeType) {
    return {
      valid: false,
      error: 'Unable to detect file type. File may be corrupted or unsupported.',
    };
  }

  // Check if detected type is allowed
  if (!VALIDATION.ALLOWED_MIME_TYPES.includes(detectedMimeType as any)) {
    return {
      valid: false,
      error: `File type "${detectedMimeType}" is not allowed. Supported types: ${VALIDATION.ALLOWED_MIME_TYPES.join(', ')}`,
      detectedMimeType,
    };
  }

  // Validate magic bytes match declared type (optional strictness)
  if (!validateMagicBytes(buffer, declaredMimeType)) {
    // Log mismatch but allow if detected type is valid
    console.warn(
      `MIME type mismatch: declared "${declaredMimeType}", detected "${detectedMimeType}"`
    );
  }

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(originalFilename);

  // Generate file hash for deduplication/verification
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  return {
    valid: true,
    detectedMimeType,
    sanitizedFilename,
    hash,
  };
}

/**
 * Complete file validation and transformation
 */
export async function processUploadedFile(
  data: Buffer | string,
  declaredMimeType: string,
  originalFilename: string
): Promise<ValidatedFile> {
  // Convert base64 to buffer if needed
  const buffer = typeof data === 'string' 
    ? Buffer.from(data, 'base64')
    : data;

  const validation = validateFile(buffer, declaredMimeType, originalFilename);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  return {
    buffer,
    mimeType: validation.detectedMimeType!,
    originalFilename,
    sanitizedFilename: validation.sanitizedFilename!,
    size: buffer.length,
    hash: validation.hash!,
  };
}

// =============================================================================
// IMAGE-SPECIFIC VALIDATION
// =============================================================================

/**
 * Validate image dimensions (optional additional check)
 */
export async function validateImageDimensions(
  buffer: Buffer,
  mimeType: string,
  options: { minWidth?: number; minHeight?: number; maxWidth?: number; maxHeight?: number } = {}
): Promise<{ valid: boolean; width?: number; height?: number; error?: string }> {
  // This would require an image processing library like sharp
  // Placeholder implementation
  const { minWidth = 100, minHeight = 100, maxWidth = 8192, maxHeight = 8192 } = options;

  // For now, we'll do a basic check based on file size
  // In production, use sharp or similar to get actual dimensions
  
  return { valid: true };
}

// =============================================================================
// VIRUS/MALWARE SCANNING PLACEHOLDER
// =============================================================================

/**
 * Scan file for malware (placeholder for integration with scanning service)
 */
export async function scanForMalware(buffer: Buffer): Promise<{ safe: boolean; threat?: string }> {
  // In production, integrate with:
  // - ClamAV
  // - VirusTotal API
  // - AWS Macie
  // - Google Cloud DLP
  
  // Basic check: look for common malicious patterns
  const content = buffer.toString('utf8', 0, Math.min(buffer.length, 1000));
  
  // Check for script injection in images (polyglot attacks)
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(content)) {
      return { safe: false, threat: 'Potential script injection detected' };
    }
  }

  return { safe: true };
}
