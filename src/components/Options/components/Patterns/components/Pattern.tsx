import React, {FC, useCallback} from 'react';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Checkbox,
  Grid,
  IconButton,
  InputBase,
  MenuItem,
  Select,
  TableCell,
  TableRow,
} from '@mui/material';

import {ProxyPattern, ProxyPatternType} from '../../../../../tools/index';
import {CopyIcon, MySelectProps} from '../../../../index';
import {isValidPattern} from '../utils/validation';

const selectInputProps = {underline: 'none'};

interface PatternProps {
  pattern: ProxyPattern;
  isFirst: boolean;
  isLast: boolean;
  onChange: (pattern: ProxyPattern, changes: Partial<Omit<ProxyPattern, 'id'>>) => void;
  onDelete: (pattern: ProxyPattern) => void;
  onCopy: (pattern: ProxyPattern) => void;
  onMove: (pattern: ProxyPattern, offset: -1 | 1) => void;
}

const Pattern: FC<PatternProps> = ({
  pattern,
  isFirst,
  isLast,
  onChange,
  onDelete,
  onCopy,
  onMove,
}) => {
  const handleTypeChange = useCallback<NonNullable<MySelectProps['onChange']>>(
    (event: Parameters<NonNullable<MySelectProps['onChange']>>[0]) => {
      onChange(pattern, {type: event.target.value as ProxyPatternType});
    },
    [onChange, pattern],
  );

  return (
    <TableRow>
      <TableCell padding="none" className="name-cell">
        <InputBase
          multiline
          size="small"
          onChange={(event) => onChange(pattern, {name: event.target.value})}
          value={pattern.name}
          fullWidth
          autoComplete="off"
        />
      </TableCell>
      <TableCell padding="none" className="pattern-cell">
        <InputBase
          multiline
          size="small"
          onChange={(event) => onChange(pattern, {pattern: event.target.value})}
          value={pattern.pattern}
          fullWidth
          autoComplete="off"
          error={!isValidPattern(pattern.pattern, pattern.type)}
        />
      </TableCell>
      <TableCell padding="none" className="type-cell">
        <Select<string>
          onChange={handleTypeChange}
          value={pattern.type}
          fullWidth
          input={<InputBase size="small" />}
          inputProps={selectInputProps}
        >
          <MenuItem value="wildcard">Wildcard</MenuItem>
          <MenuItem value="regexp">RegExp</MenuItem>
        </Select>
      </TableCell>
      <TableCell padding="none" className="enabled-cell">
        <Grid container sx={{alignItems: 'center'}}>
          <Grid>
            <Checkbox
              className="small-checkbox"
              onChange={(event) => onChange(pattern, {enabled: event.target.checked})}
              checked={pattern.enabled}
            />
          </Grid>
          <Grid>
            <IconButton onClick={() => onMove(pattern, -1)} disabled={isFirst} size="small">
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={() => onMove(pattern, 1)} disabled={isLast} size="small">
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={() => onCopy(pattern)} size="small">
              <CopyIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={() => onDelete(pattern)} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );
};

export {Pattern};
