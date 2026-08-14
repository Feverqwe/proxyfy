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
  Tooltip,
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
          placeholder="Rule name"
          inputProps={{'aria-label': 'Rule name'}}
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
          placeholder="*.example.com"
          inputProps={{'aria-label': 'URL pattern'}}
        />
      </TableCell>
      <TableCell padding="none" className="type-cell">
        <Select<string>
          onChange={handleTypeChange}
          value={pattern.type}
          fullWidth
          input={<InputBase size="small" />}
          inputProps={selectInputProps}
          aria-label="Pattern type"
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
              slotProps={{input: {'aria-label': `Enable ${pattern.name || 'rule'}`}}}
            />
          </Grid>
          <Grid>
            <Tooltip title="Move up">
              <span>
                <IconButton
                  aria-label="Move rule up"
                  onClick={() => onMove(pattern, -1)}
                  disabled={isFirst}
                  size="small"
                >
                  <ArrowUpwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Grid>
          <Grid>
            <Tooltip title="Move down">
              <span>
                <IconButton
                  aria-label="Move rule down"
                  onClick={() => onMove(pattern, 1)}
                  disabled={isLast}
                  size="small"
                >
                  <ArrowDownwardIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Grid>
          <Grid>
            <Tooltip title="Duplicate">
              <IconButton aria-label="Duplicate rule" onClick={() => onCopy(pattern)} size="small">
                <CopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid>
            <Tooltip title="Delete">
              <IconButton
                aria-label="Delete rule"
                onClick={() => onDelete(pattern)}
                size="small"
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );
};

export {Pattern};
