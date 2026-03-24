import React, {FC, useCallback, useEffect, useMemo, useState} from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {ProxyPattern, ProxyPatternType} from '../../../../../tools/index';
import {CopyIcon, MySelectProps} from '../../../../index';
import {isValidPattern} from '../utils/validation';

const selectInputProps = {
  underline: 'none',
};

interface PatternProps {
  pattern: ProxyPattern;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (pattern: ProxyPattern) => void;
  onCopy: (pattern: ProxyPattern) => void;
  onMove: (pattern: ProxyPattern, dir: number) => void;
}

const Pattern: FC<PatternProps> = ({pattern, isFirst, isLast, onDelete, onCopy, onMove}) => {
  const [isValid, setValid] = useState(true);
  const origPattern = useMemo(
    () => ({
      name: pattern.name,
      pattern: pattern.pattern,
      type: pattern.type,
      enabled: pattern.enabled,
    }),
    [pattern],
  );

  useEffect(() => {
    setValid(isValidPattern(pattern.pattern, pattern.type));
  }, [pattern.pattern, pattern.type]);

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onDelete(pattern);
    },
    [pattern, onDelete],
  );

  const handleCopy = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onCopy(pattern);
    },
    [pattern, onCopy],
  );

  const handleMoveUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onMove(pattern, -1);
    },
    [pattern, onMove],
  );

  const handleMoveDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onMove(pattern, 1);
    },
    [pattern, onMove],
  );

  const handleEnabledChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      pattern.enabled = e.target.checked;
    },
    [pattern],
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      pattern.name = e.target.value;
    },
    [pattern],
  );

  const handlePatternChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      pattern.pattern = e.target.value;
      setValid(isValidPattern(pattern.pattern, pattern.type));
    },
    [pattern],
  );

  const handleTypeChange = useCallback<NonNullable<MySelectProps['onChange']>>(
    (e: Parameters<NonNullable<MySelectProps['onChange']>>[0]) => {
      const value = e.target.value as ProxyPatternType;
      pattern.type = value;
      setValid(isValidPattern(pattern.pattern, pattern.type));
    },
    [pattern],
  );

  return (
    <TableRow>
      <TableCell padding="none" className="name-cell">
        <InputBase
          multiline
          size="small"
          onChange={handleNameChange}
          defaultValue={origPattern.name}
          fullWidth
          autoComplete="off"
        />
      </TableCell>
      <TableCell padding="none" className="pattern-cell">
        <InputBase
          multiline
          size="small"
          onChange={handlePatternChange}
          defaultValue={origPattern.pattern}
          fullWidth
          autoComplete="off"
          error={!isValid}
        />
      </TableCell>
      <TableCell padding="none" className="type-cell">
        <Select<string>
          onChange={handleTypeChange}
          defaultValue={origPattern.type}
          fullWidth
          input={<InputBase size="small" />}
          inputProps={selectInputProps}
        >
          <MenuItem value="wildcard">Wildcard</MenuItem>
          <MenuItem value="regexp">RegExp</MenuItem>
        </Select>
      </TableCell>
      <TableCell padding="none" className="enabled-cell">
        <Grid container alignItems="center">
          <Grid>
            <Checkbox
              className="small-checkbox"
              onChange={handleEnabledChange}
              defaultChecked={origPattern.enabled}
            />
          </Grid>
          <Grid>
            <IconButton onClick={handleMoveUp} disabled={isFirst} size="small">
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={handleMoveDown} disabled={isLast} size="small">
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={handleCopy} size="small">
              <CopyIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={handleDelete} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );
};

export {Pattern};
