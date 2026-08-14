import React, {FC, useCallback, useState} from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import {
  Box,
  Checkbox,
  IconButton,
  InputBase,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Select,
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
  isDragging: boolean;
  dropPosition?: PatternDropPosition;
  onChange: (pattern: ProxyPattern, changes: Partial<Omit<ProxyPattern, 'id'>>) => void;
  onDelete: (pattern: ProxyPattern) => void;
  onCopy: (pattern: ProxyPattern) => void;
  onDragStart: (pattern: ProxyPattern, event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (pattern: ProxyPattern, event: React.DragEvent<HTMLElement>) => void;
  onDrop: (pattern: ProxyPattern, event: React.DragEvent<HTMLElement>) => void;
}

type PatternDropPosition = 'before' | 'after';

const Pattern: FC<PatternProps> = ({
  pattern,
  isFirst,
  isLast,
  isDragging,
  dropPosition,
  onChange,
  onDelete,
  onCopy,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const handleTypeChange = useCallback<NonNullable<MySelectProps['onChange']>>(
    (event: Parameters<NonNullable<MySelectProps['onChange']>>[0]) => {
      onChange(pattern, {type: event.target.value as ProxyPatternType});
    },
    [onChange, pattern],
  );

  const runAction = useCallback((action: () => void) => {
    setMenuAnchor(null);
    action();
  }, []);

  return (
    <Box
      className="pattern-list-grid pattern-row"
      component="article"
      data-dragging={isDragging || undefined}
      data-drop-position={dropPosition}
      onDragOver={(event) => onDragOver(pattern, event)}
      onDrop={(event) => onDrop(pattern, event)}
    >
      <Box className="drag-cell">
        <IconButton
          aria-hidden="true"
          className="drag-handle"
          draggable
          disabled={isFirst && isLast}
          size="small"
          tabIndex={-1}
          title="Drag to reorder"
          onDragStart={(event) => onDragStart(pattern, event)}
          onDragEnd={onDragEnd}
          sx={{
            p: 0.5,
            cursor: 'grab',
            color: 'text.disabled',
            '&:active': {cursor: 'grabbing'},
          }}
        >
          <DragIndicatorRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Tooltip title={pattern.enabled ? 'Disable rule' : 'Enable rule'}>
        <Checkbox
          className="small-checkbox toggle-cell"
          onChange={(event) => onChange(pattern, {enabled: event.target.checked})}
          checked={pattern.enabled}
          slotProps={{
            input: {
              'aria-label': `${pattern.enabled ? 'Disable' : 'Enable'} ${pattern.name || 'rule'}`,
            },
          }}
        />
      </Tooltip>
      <InputBase
        className="name-cell"
        multiline
        size="small"
        onChange={(event) => onChange(pattern, {name: event.target.value})}
        value={pattern.name}
        fullWidth
        autoComplete="off"
        placeholder="Rule name"
        inputProps={{'aria-label': 'Rule name'}}
      />
      <InputBase
        className="pattern-cell"
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
      <Select<string>
        className="type-cell"
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
      <Box className="actions-cell">
        <Tooltip title="Rule actions">
          <IconButton
            aria-label="Rule actions"
            size="small"
            onClick={(event) => setMenuAnchor(event.currentTarget)}
            aria-controls={menuAnchor ? `rule-actions-${pattern.id}` : undefined}
            aria-haspopup="menu"
            aria-expanded={menuAnchor ? 'true' : undefined}
          >
            <MoreVertRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Menu
          id={`rule-actions-${pattern.id}`}
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => runAction(() => onCopy(pattern))}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Duplicate</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => runAction(() => onDelete(pattern))} sx={{color: 'error.main'}}>
            <ListItemIcon sx={{color: 'error.main'}}>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

export {Pattern};
export type {PatternDropPosition};
