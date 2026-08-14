import React, {FC, useCallback} from 'react';

import {Box, Typography} from '@mui/material';
import {styled} from '@mui/system';

import {ProxyPattern} from '../../../../../tools/index';
import {copyPattern, movePattern, removePattern, updatePattern} from '../utils/patternListState';

import {Pattern} from './Pattern';

const PatternListRoot = styled(Box)(({theme}) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '7px',
  overflow: 'hidden',
  '& .pattern-list-grid': {
    display: 'grid',
    gridTemplateColumns: '36px minmax(120px, 0.75fr) minmax(220px, 1.5fr) 116px 36px',
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
    padding: '5px 8px',
    borderTop: `1px solid ${theme.palette.divider}`,
  },
  '& .pattern-row:hover': {backgroundColor: theme.palette.action.hover},
  '& .small-checkbox': {padding: '6px'},
  '& .MuiInputBase-root': {padding: '4px 6px', borderRadius: '5px'},
  '& .MuiInputBase-root:focus-within': {backgroundColor: theme.palette.background.paper},
  '& .MuiInputBase-root.Mui-error': {boxShadow: `inset 0 0 0 1px ${theme.palette.error.main}`},
  [theme.breakpoints.down('sm')]: {
    '& .pattern-list-header': {display: 'none'},
    '& .pattern-row': {
      gridTemplateColumns: '36px minmax(0, 1fr) 36px',
      gridTemplateAreas: '"toggle name actions" ". pattern pattern" ". type type"',
      rowGap: '4px',
      paddingBlock: '8px',
      borderTop: 0,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    '& .pattern-row:last-child': {borderBottom: 0},
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
  const handlePatternChange = useCallback(
    (pattern: ProxyPattern, changes: Partial<Omit<ProxyPattern, 'id'>>) => {
      onChange(updatePattern(patterns, pattern.id, changes));
    },
    [onChange, patterns],
  );

  return (
    <PatternListRoot sx={{mt: 1.25}}>
      {patterns.length > 0 && (
        <Box className="pattern-list-grid pattern-list-header" aria-hidden="true">
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
          />
        ))
      )}
    </PatternListRoot>
  );
};

export {PatternList};
