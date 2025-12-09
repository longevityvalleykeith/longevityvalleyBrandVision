/**
 * LanguageSwitcher Component
 *
 * Floating language selector for manual language/region override.
 * Persists selection to localStorage and updates UI immediately.
 *
 * Part of Phase 3A SOFT Guardrails - overcoming language barriers.
 *
 * @module client/components/LanguageSwitcher
 * @version 1.0.0
 * @see docs/INPUT_GATEKEEPING_SPEC.md
 */

import { useState, useCallback, useEffect } from 'react';
import type { SupportedLanguage, CulturalRegion } from '@/types/cultural';

// =============================================================================
// TYPES
// =============================================================================

interface LanguageSwitcherProps {
  /** Current language */
  language: SupportedLanguage;
  /** Callback when language changes */
  onLanguageChange: (language: SupportedLanguage, region: CulturalRegion) => void;
  /** Position variant */
  position?: 'floating' | 'inline';
  /** Custom className */
  className?: string;
}

interface LanguageOption {
  code: SupportedLanguage;
  region: CulturalRegion;
  label: string;
  flag: string;
  nativeLabel: string;
}

// =============================================================================
// LANGUAGE OPTIONS
// =============================================================================

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', region: 'western', label: 'English', flag: '🇬🇧', nativeLabel: 'English' },
  { code: 'zh-CN', region: 'china', label: 'Simplified Chinese', flag: '🇨🇳', nativeLabel: '简体中文' },
  { code: 'zh-TW', region: 'taiwan', label: 'Traditional Chinese', flag: '🇹🇼', nativeLabel: '繁體中文' },
  { code: 'ms', region: 'malaysia', label: 'Bahasa Malaysia', flag: '🇲🇾', nativeLabel: 'Bahasa Melayu' },
];

// =============================================================================
// LOCAL STORAGE KEY
// =============================================================================

const STORAGE_KEY = 'longevity-valley-language';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function LanguageSwitcher({
  language,
  onLanguageChange,
  position = 'floating',
  className = '',
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before rendering (SSR safe)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current language option
  const currentOption = LANGUAGE_OPTIONS.find(opt => opt.code === language) || LANGUAGE_OPTIONS[0]!;

  /**
   * Handle language selection
   */
  const handleSelect = useCallback((option: LanguageOption) => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        language: option.code,
        region: option.region,
        timestamp: Date.now(),
      }));
    }

    // Notify parent
    onLanguageChange(option.code, option.region);
    setIsOpen(false);
  }, [onLanguageChange]);

  /**
   * Toggle dropdown
   */
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.language-switcher')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  // Don't render until mounted (SSR safe)
  if (!mounted) return null;

  const isFloating = position === 'floating';

  return (
    <div
      className={`language-switcher ${isFloating ? 'floating' : 'inline'} ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={toggleDropdown}
        className="switcher-trigger"
        aria-label="Select language"
        aria-expanded={isOpen}
      >
        <span className="flag">{currentOption.flag}</span>
        <span className="label">{currentOption.nativeLabel}</span>
        <span className={`chevron ${isOpen ? 'open' : ''}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="switcher-dropdown">
          <div className="dropdown-header">
            Select Language
          </div>
          {LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              onClick={() => handleSelect(option)}
              className={`dropdown-option ${option.code === language ? 'active' : ''}`}
            >
              <span className="option-flag">{option.flag}</span>
              <span className="option-labels">
                <span className="option-native">{option.nativeLabel}</span>
                <span className="option-english">{option.label}</span>
              </span>
              {option.code === language && (
                <span className="option-check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{switcherStyles}</style>
    </div>
  );
}

// =============================================================================
// HELPER: Load saved language from localStorage
// =============================================================================

export function loadSavedLanguage(): { language: SupportedLanguage; region: CulturalRegion } | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      // Validate the saved data
      const validLanguages: SupportedLanguage[] = ['en', 'zh-CN', 'zh-TW', 'ms'];
      if (validLanguages.includes(data.language)) {
        return {
          language: data.language,
          region: data.region,
        };
      }
    }
  } catch {
    // Invalid data, ignore
  }

  return null;
}

// =============================================================================
// HELPER: Detect browser language
// =============================================================================

export function detectBrowserLanguage(): { language: SupportedLanguage; region: CulturalRegion } {
  if (typeof window === 'undefined') {
    return { language: 'en', region: 'western' };
  }

  const browserLang = navigator.language || 'en';

  // Check for Chinese variants
  if (browserLang.startsWith('zh')) {
    if (browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('Hant')) {
      return { language: 'zh-TW', region: 'taiwan' };
    }
    return { language: 'zh-CN', region: 'china' };
  }

  // Check for Malay
  if (browserLang.startsWith('ms') || browserLang.startsWith('my')) {
    return { language: 'ms', region: 'malaysia' };
  }

  // Default to English
  return { language: 'en', region: 'western' };
}

// =============================================================================
// STYLES
// =============================================================================

const switcherStyles = `
  .language-switcher {
    position: relative;
    z-index: 1000;
    font-family: system-ui, -apple-system, sans-serif;
  }

  .language-switcher.floating {
    position: fixed;
    bottom: 20px;
    right: 20px;
  }

  .language-switcher.inline {
    display: inline-block;
  }

  .switcher-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
  }

  .switcher-trigger:hover {
    border-color: #8b5cf6;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.15);
  }

  .switcher-trigger .flag {
    font-size: 18px;
  }

  .switcher-trigger .label {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .switcher-trigger .chevron {
    display: flex;
    align-items: center;
    transition: transform 0.2s ease;
  }

  .switcher-trigger .chevron.open {
    transform: rotate(180deg);
  }

  .switcher-dropdown {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    min-width: 220px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;
    animation: slideUp 0.2s ease;
  }

  .language-switcher.inline .switcher-dropdown {
    bottom: auto;
    top: calc(100% + 8px);
    animation: slideDown 0.2s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .dropdown-header {
    padding: 10px 14px;
    font-size: 12px;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #f3f4f6;
  }

  .dropdown-option {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
  }

  .dropdown-option:hover {
    background: #f9fafb;
  }

  .dropdown-option.active {
    background: #f5f3ff;
  }

  .option-flag {
    font-size: 20px;
  }

  .option-labels {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .option-native {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
  }

  .option-english {
    font-size: 12px;
    color: #6b7280;
  }

  .option-check {
    color: #8b5cf6;
    font-weight: 600;
    font-size: 16px;
  }

  /* Mobile adjustments */
  @media (max-width: 640px) {
    .language-switcher.floating {
      bottom: 16px;
      right: 16px;
    }

    .switcher-trigger .label {
      display: none;
    }

    .switcher-dropdown {
      right: 0;
      min-width: 200px;
    }
  }
`;

export { LanguageSwitcher };
