import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import InfoIcon from '@mui/icons-material/Info';
import {ProxyPattern, ProxyPatternType} from '../../../../../tools/index';
import {Pattern} from './Pattern';

const TableContainerS = styled(TableContainer)(({theme}) => {
  return {
    '& .small-checkbox': {
      padding: '4px',
    },
    '& tbody tr:hover': {
      backgroundColor: theme.palette.action.hover,
    },
    '& tbody td': {
      verticalAlign: 'top',
    },
    '& .name-cell': {
      width: '250px',
    },
    '& .pattern-cell': {
      paddingLeft: '6px',
      paddingRight: '6px',
    },
    '& .type-cell': {
      width: '120px',
    },
    '& .enabled-cell': {
      width: '160px',
    },
    '& .MuiInputBase-root.Mui-error': {
      boxShadow: 'inset 0 0 2px #ff0000',
    },
  };
});

interface PatternListProps {
  list: ProxyPattern[];
}

export interface PatternListHandler {
  addRule: (name?: string, pattern?: string, type?: ProxyPatternType) => void;
  getPatterns: () => ProxyPattern[];
}

const PatternList = forwardRef<PatternListHandler, PatternListProps>(({list}, ref) => {
  const [patterns, setPatterns] = useState(list);
  const refPatterns = useRef(patterns);
  refPatterns.current = patterns;

  useImperativeHandle(ref, () => ({
    addRule(name = '', pattern = '', type = ProxyPatternType.Wildcard) {
      const newPatterns = refPatterns.current.slice(0);
      newPatterns.push({
        enabled: true,
        name,
        type: type as ProxyPatternType,
        pattern,
      });
      setPatterns((refPatterns.current = newPatterns));
    },
    getPatterns() {
      return refPatterns.current;
    },
  }));

  const handlePatternDelete = useCallback(
    (pattern: ProxyPattern) => {
      const newPatterns = patterns.slice(0);
      const pos = newPatterns.indexOf(pattern);
      if (pos >= 0) {
        newPatterns.splice(pos, 1);
        setPatterns(newPatterns);
      }
    },
    [patterns],
  );

  const handlePatternCopy = useCallback(
    (pattern: ProxyPattern) => {
      const newPatterns = patterns.slice(0);
      const pos = newPatterns.indexOf(pattern);
      if (pos >= 0) {
        const clone = JSON.parse(JSON.stringify(pattern));
        newPatterns.splice(pos + 1, 0, clone);
        setPatterns(newPatterns);
      }
    },
    [patterns],
  );

  const handlePatternMove = useCallback(
    (pattern: ProxyPattern, offset: number) => {
      const newPatterns = patterns.slice(0);
      const pos = newPatterns.indexOf(pattern);
      if (pos >= 0) {
        newPatterns.splice(pos, 1);
        newPatterns.splice(pos + offset, 0, pattern);
        setPatterns(newPatterns);
      }
    },
    [patterns],
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
          {patterns.map((pattern, index) => {
            const isFirst = index === 0;
            const isLast = index === patterns.length - 1;
            return (
              <Pattern
                key={index}
                pattern={pattern}
                onMove={handlePatternMove}
                onCopy={handlePatternCopy}
                onDelete={handlePatternDelete}
                isFirst={isFirst}
                isLast={isLast}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainerS>
  );
});

export {PatternList};
