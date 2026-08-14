import React, {FC, useCallback, useMemo} from 'react';

import InfoIcon from '@mui/icons-material/Info';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import {styled} from '@mui/system';

import {ProxyPattern} from '../../../../../tools/index';
import {copyPattern, movePattern, removePattern, updatePattern} from '../utils/patternListState';

import {Pattern} from './Pattern';

const TableContainerS = styled(TableContainer)(({theme}) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: '12px',
  '& .small-checkbox': {padding: '6px'},
  '& tbody tr:hover': {backgroundColor: theme.palette.action.hover},
  '& tbody td': {verticalAlign: 'middle'},
  '& .name-cell': {width: '220px'},
  '& .pattern-cell': {paddingLeft: '10px', paddingRight: '10px'},
  '& .type-cell': {width: '120px'},
  '& .enabled-cell': {width: '190px'},
  '& .MuiInputBase-root': {padding: '7px 8px', borderRadius: '7px'},
  '& .MuiInputBase-root:focus-within': {backgroundColor: theme.palette.background.paper},
  '& .MuiInputBase-root.Mui-error': {boxShadow: `inset 0 0 0 1px ${theme.palette.error.main}`},
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

  const helpTooltip = useMemo(
    () => (
      <div>
        <div>Use a new line or comma to separate patterns.</div>
        <div>Lines beginning with # are ignored.</div>
        <br />
        <div>
          URLs are matched as <b>scheme://host:port</b>. Credentials, paths, and queries are
          ignored.
        </div>
      </div>
    ),
    [],
  );

  return (
    <TableContainerS sx={{mt: 2}}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell className="name-cell">Name</TableCell>
            <TableCell className="pattern-cell">
              Pattern
              <Tooltip
                placement="left-start"
                title={helpTooltip}
                style={{marginLeft: '8px', verticalAlign: 'middle'}}
              >
                <InfoIcon fontSize="small" />
              </Tooltip>
            </TableCell>
            <TableCell className="type-cell">Type</TableCell>
            <TableCell className="enabled-cell">Enabled & actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patterns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4}>
                <Box sx={{py: 2.5, textAlign: 'center'}}>
                  <Typography variant="body2" color="text.secondary">
                    No rules in this section.
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
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
        </TableBody>
      </Table>
    </TableContainerS>
  );
};

export {PatternList};
