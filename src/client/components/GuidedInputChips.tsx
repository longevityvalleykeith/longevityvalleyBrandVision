/**
 * GuidedInputChips Component (Simplified)
 *
 * Universal chips with toggle expand. Click to append to field.
 *
 * @module client/components/GuidedInputChips
 * @version 2.0.0 - Simplified, less clutter
 */

import { useState, useCallback, useMemo } from 'react';
import { getFieldChips, type ChipField } from '@/config/cultural/guidedChips';
import type { CulturalRegion } from '@/types/cultural';

// =============================================================================
// TYPES
// =============================================================================

interface GuidedInputChipsProps {
  field: ChipField;
  region: CulturalRegion;
  onChipClick: (value: string) => void;
  className?: string;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function GuidedInputChips({
  field,
  region,
  onChipClick,
  className = '',
}: GuidedInputChipsProps) {
  const [expanded, setExpanded] = useState(false);

  const chips = useMemo(() => getFieldChips(field, region), [field, region]);

  const visibleChips = expanded
    ? [...chips.primary, ...chips.expanded]
    : chips.primary;

  const handleClick = useCallback((chip: string) => {
    onChipClick(chip);
  }, [onChipClick]);

  const toggleExpand = useCallback(() => {
    setExpanded(prev => !prev);
  }, []);

  return (
    <div className={`guided-chips ${className}`} style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
        {visibleChips.map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(chip)}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#6b7280',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '9999px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#e5e7eb';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            + {chip}
          </button>
        ))}

        {chips.expanded.length > 0 && (
          <button
            type="button"
            onClick={toggleExpand}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 500,
              color: '#8b5cf6',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {expanded ? '− less' : '+ more'}
          </button>
        )}
      </div>
    </div>
  );
}

export { GuidedInputChips };
