import React, {FC, useCallback, useState} from 'react';

import {Box, Typography} from '@mui/material';
import {styled} from '@mui/system';

import {ProxyPattern} from '../../../../../tools/index';
import {
  copyPattern,
  movePattern,
  placePattern,
  removePattern,
  updatePattern,
} from '../utils/patternListState';

import {Pattern, type PatternDropPosition} from './Pattern';

const PatternListRoot = styled(Box)(({theme}) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '7px',
  overflow: 'hidden',
  '& .pattern-list-grid': {
    display: 'grid',
    gridTemplateColumns: '28px 36px minmax(120px, 0.75fr) minmax(220px, 1.5fr) 116px 36px',
    columnGap: '8px',
    alignItems: 'center',
  },
  '& .pattern-list-header': {
    padding: '6px 8px',
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.action.hover,
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  '& .pattern-row': {
    position: 'relative',
    padding: '5px 8px',
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  '& .pattern-row[data-dragging="true"]': {opacity: 0.45},
  '& .pattern-row[data-drop-position]::after': {
    content: '""',
    position: 'absolute',
    zIndex: 1,
    right: '8px',
    left: '8px',
    height: '2px',
    borderRadius: '2px',
    backgroundColor: theme.palette.primary.main,
    pointerEvents: 'none',
  },
  '& .pattern-row[data-drop-position="before"]::after': {top: '-1px'},
  '& .pattern-row[data-drop-position="after"]::after': {bottom: '-1px'},
  '& .pattern-row:hover': {backgroundColor: theme.palette.action.hover},
  '& .drag-cell': {display: 'flex', justifyContent: 'center'},
  '& .small-checkbox': {padding: '6px'},
  '& .MuiInputBase-root': {padding: '4px 6px', borderRadius: '5px'},
  '& .MuiInputBase-root:focus-within': {backgroundColor: theme.palette.background.paper},
  '& .MuiInputBase-root.Mui-error': {boxShadow: `inset 0 0 0 1px ${theme.palette.error.main}`},
  [theme.breakpoints.down('sm')]: {
    '& .pattern-list-header': {display: 'none'},
    '& .pattern-row': {
      gridTemplateColumns: '28px 36px minmax(0, 1fr) 36px',
      gridTemplateAreas: '"drag toggle name actions" ". . pattern pattern" ". . type type"',
      rowGap: '4px',
      paddingBlock: '8px',
      borderTop: 0,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '& .pattern-row:last-child': {borderBottom: 0},
    '& .drag-cell': {gridArea: 'drag'},
    '& .toggle-cell': {gridArea: 'toggle'},
    '& .name-cell': {gridArea: 'name'},
    '& .pattern-cell': {gridArea: 'pattern'},
    '& .type-cell': {gridArea: 'type', width: 116},
    '& .actions-cell': {gridArea: 'actions'},
  },
}));

interface PatternListProps {
  patterns: ProxyPattern[];
  onChange: (patterns: ProxyPattern[]) => void;
}

const PatternList: FC<PatternListProps> = ({patterns, onChange}) => {
  const [draggedPatternId, setDraggedPatternId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    patternId: string;
    position: PatternDropPosition;
  } | null>(null);

  const handlePatternChange = useCallback(
    (pattern: ProxyPattern, changes: Partial<Omit<ProxyPattern, 'id'>>) => {
      onChange(updatePattern(patterns, pattern.id, changes));
    },
    [onChange, patterns],
  );

  const resetDragState = useCallback(() => {
    setDraggedPatternId(null);
    setDropTarget(null);
  }, []);

  const handleDragStart = useCallback(
    (pattern: ProxyPattern, event: React.DragEvent<HTMLElement>) => {
      if (!pattern.id) return;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', pattern.id);
      const row = event.currentTarget.closest('.pattern-row') as HTMLElement | null;
      if (row) {
        const bounds = row.getBoundingClientRect();
        event.dataTransfer.setDragImage(
          row,
          Math.max(0, event.clientX - bounds.left),
          Math.max(0, event.clientY - bounds.top),
        );
      }
      setDraggedPatternId(pattern.id);
    },
    [],
  );

  const handleDragOver = useCallback(
    (pattern: ProxyPattern, event: React.DragEvent<HTMLElement>) => {
      const patternId = pattern.id;
      if (!draggedPatternId || !patternId || patternId === draggedPatternId) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const bounds = event.currentTarget.getBoundingClientRect();
      const position =
        event.clientY < bounds.top + bounds.height / 2 ? ('before' as const) : ('after' as const);
      setDropTarget((current) => {
        if (current?.patternId === patternId && current?.position === position) return current;
        return {patternId, position};
      });
    },
    [draggedPatternId],
  );

  const handleDrop = useCallback(
    (pattern: ProxyPattern, event: React.DragEvent<HTMLElement>) => {
      const patternId = pattern.id;
      if (!draggedPatternId || !patternId || patternId === draggedPatternId) return;

      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';
      onChange(placePattern(patterns, draggedPatternId, patternId, position));
      resetDragState();
    },
    [draggedPatternId, onChange, patterns, resetDragState],
  );

  return (
    <PatternListRoot sx={{mt: 1.25}}>
      {patterns.length > 0 && (
        <Box className="pattern-list-grid pattern-list-header" aria-hidden="true">
          <span />
          <span />
          <span>Name</span>
          <span>URL pattern</span>
          <span>Match</span>
          <span />
        </Box>
      )}
      {patterns.length === 0 ? (
        <Box sx={{py: 2.5, textAlign: 'center'}}>
          <Typography variant="body2" color="text.secondary">
            No rules yet.
          </Typography>
        </Box>
      ) : (
        patterns.map((pattern, index) => (
          <Pattern
            key={pattern.id}
            pattern={pattern}
            onChange={handlePatternChange}
            onMove={(item, offset) => onChange(movePattern(patterns, item.id, offset))}
            onCopy={(item) => onChange(copyPattern(patterns, item.id))}
            onDelete={(item) => onChange(removePattern(patterns, item.id))}
            isFirst={index === 0}
            isLast={index === patterns.length - 1}
            isDragging={pattern.id === draggedPatternId}
            dropPosition={dropTarget?.patternId === pattern.id ? dropTarget?.position : undefined}
            onDragStart={handleDragStart}
            onDragEnd={resetDragState}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))
      )}
    </PatternListRoot>
  );
};

export {PatternList};
