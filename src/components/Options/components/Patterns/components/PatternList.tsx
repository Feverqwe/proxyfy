import React, {FC, useCallback, useMemo} from 'react';

import InfoIcon from '@mui/icons-material/Info';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import {styled} from '@mui/system';

import {ProxyPattern} from '../../../../../tools/index';
import {copyPattern, movePattern, removePattern, updatePattern} from '../utils/patternListState';

import {Pattern} from './Pattern';

const TableContainerS = styled(TableContainer)(({theme}) => ({
  '& .small-checkbox': {padding: '4px'},
  '& tbody tr:hover': {backgroundColor: theme.palette.action.hover},
  '& tbody td': {verticalAlign: 'top'},
  '& .name-cell': {width: '250px'},
  '& .pattern-cell': {paddingLeft: '6px', paddingRight: '6px'},
  '& .type-cell': {width: '120px'},
  '& .enabled-cell': {width: '160px'},
  '& .MuiInputBase-root.Mui-error': {boxShadow: 'inset 0 0 2px #ff0000'},
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
        <div>Use newline or comma `,` for splitting patterns</div>
        <div>If line starts from pound sign `#` it will ignored</div>
        <br />
        <div>
          Input url looks like <b>scheme://host:port</b> credentials, path, query are ignored
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
            <TableCell className="enabled-cell">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patterns.map((pattern, index) => (
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
          ))}
        </TableBody>
      </Table>
    </TableContainerS>
  );
};

export {PatternList};
