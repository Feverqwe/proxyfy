import React, {FC, useEffect} from 'react';
import {
  Alert,
  Box,
  Checkbox,
  Grid,
  InputBase,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import {Redirect, useHistory, useLocation} from 'react-router';
import {Link} from 'react-router-dom';
import InfoIcon from '@mui/icons-material/Info';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import {styled} from '@mui/system';
import getConfig from '../../tools/getConfig';
import Header from '../Header';
import ConfigStruct, {ConfigProxy, ProxyPattern, ProxyPatternType} from '../../tools/ConfigStruct';
import promisifyApi from '../../tools/promisifyApi';
import CopyIcon from './CopyIcon';
import splitMultiPattern from '../../tools/splitMultiPattern';
import getObjectId from '../../tools/getObjectId';
import Notification from './Notification';
import ActionBox from './ActionBox';
import MyButtonM from './MyButtonM';

const qs = require('querystring-es3');

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
      minWidth: '240px',
    },
    '& .type-cell': {
      width: '120px',
    },
    '& .enabled-cell': {
      width: '140px',
    },
    '& .MuiInputBase-root.Mui-error': {
      boxShadow: 'inset 0 0 2px #ff0000',
    },
  };
});

const Patterns = React.memo(() => {
  const location = useLocation();
  const [proxy, setProxy] = React.useState<ConfigProxy>();
  const [isRedirect, setRedirect] = React.useState(false);

  useEffect(() => {
    let isMounted = true;

    const query = qs.parse(location.search.substr(1));
    (async () => {
      try {
        let proxy: ConfigProxy | undefined;
        if (query.id) {
          const {proxies} = await getConfig();
          proxy = proxies.find((p) => p.id === query.id);
        }

        if (!isMounted) return;
        if (!proxy) {
          setRedirect(true);
        } else {
          setProxy(proxy);
        }
      } catch (err) {
        console.error('getConfig error: %O', err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [location.search]);

  if (!proxy) return null;

  if (isRedirect) {
    return <Redirect to="/" />;
  }

  return <PatternsLoaded key={proxy.id} proxy={proxy} />;
});

export const matchAllPresets = [
  {
    name: 'all URLs',
    pattern: '*',
    type: 'wildcard' as ProxyPatternType,
  },
];

export const localhostPresets = [
  {
    name: "local hostnames (usually no dots in the name). Pattern exists because 'Do not use this proxy for localhost and intranet/private IP addresses' is checked.",
    pattern: '^[^:]+\\/\\/(?:localhost|127\\.\\d+\\.\\d+\\.\\d+)(?::\\d+)?$',
    type: 'regexp' as ProxyPatternType,
  },
  {
    name: "local subnets (IANA reserved address space). Pattern exists because 'Do not use this proxy for localhost and intranet/private IP addresses' is checked.",
    pattern:
      '^[^:]+\\/\\/(?:192\\.168\\.\\d+\\.\\d+|10\\.\\d+\\.\\d+\\.\\d+|172\\.(?:1[6789]|2[0-9]|3[01])\\.\\d+\\.\\d+)(?::\\d+)?$',
    type: 'regexp' as ProxyPatternType,
  },
  {
    name: "localhost - matches the local host optionally prefixed by a user:password authentication string and optionally suffixed by a port number. The entire local subnet (127.0.0.0/8) matches. Pattern exists because 'Do not use this proxy for localhost and intranet/private IP addresses' is checked.",
    pattern: '^[^:]+\\/\\/[\\w-]+(?::\\d+)?$',
    type: 'regexp' as ProxyPatternType,
  },
];

interface PatternsLoadedProps {
  proxy: ConfigProxy;
}

const PatternsLoaded: FC<PatternsLoadedProps> = ({proxy}) => {
  const history = useHistory();
  const refWhiteRules = React.useRef<PatternListHandler | null>(null);
  const refBlackRules = React.useRef<PatternListHandler | null>(null);
  const [notify, setNotify] = React.useState<{text: string} | null>(null);

  const handleNewWhite = React.useCallback((e) => {
    e.preventDefault();
    refWhiteRules.current?.addRule();
  }, []);

  const handleNewBlack = React.useCallback((e) => {
    e.preventDefault();
    refBlackRules.current?.addRule();
  }, []);

  const handleSave = React.useCallback(
    async (e, noRedirect = false) => {
      e.preventDefault();
      const whitePatterns = refWhiteRules.current?.getPatterns() || [];
      const blackPatterns = refBlackRules.current?.getPatterns() || [];

      try {
        const config = await getConfig();
        const existsProxy = config.proxies.find((p) => p.id === proxy.id);
        if (!existsProxy) {
          throw new Error('Proxy is not found');
        }

        existsProxy.whitePatterns = whitePatterns;
        existsProxy.blackPatterns = blackPatterns;
        const _ = ConfigStruct.assert(config);
        await promisifyApi('chrome.storage.sync.set')(config);

        if (!noRedirect) {
          history.push('/');
        }
        return true;
      } catch (err) {
        console.error('Save proxy error: %O', err);
        return false;
      }
    },
    [proxy, history],
  );

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey) {
        const {keyCode} = e;
        switch (keyCode) {
          case 83:
            e.preventDefault();
            handleSave(e, true).then((isSaved) => {
              isSaved && setNotify({text: 'Saved'});
            });
            break;
        }
      }
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  const handleWhitelistMatchAll = React.useCallback((e) => {
    e.preventDefault();
    matchAllPresets.forEach(({name, pattern, type}) => {
      refWhiteRules.current?.addRule(name, pattern, type);
    });
  }, []);

  const handleBlacklistLocalhost = React.useCallback((e) => {
    e.preventDefault();
    localhostPresets.forEach(({name, pattern, type}) => {
      refBlackRules.current?.addRule(name, pattern, type);
    });
  }, []);

  return (
    <>
      <Header title="Edit patterns" />
      <Box component={Paper} m={2}>
        <Grid container>
          <Grid item xs={12}>
            <Alert severity="info">
              Proxyfy ignores everything on this page unless set to "Use enabled proxies by patterns
              and order"
            </Alert>
            <Box m={2}>
              <Typography variant="h5">White Patterns</Typography>
              <PatternList ref={refWhiteRules} list={proxy.whitePatterns} />
              <Box my={2} textAlign="center">
                Add whitelist pattern to match all URLs
                <MyButtonM
                  onClick={handleWhitelistMatchAll}
                  variant="contained"
                  size="small"
                  color="secondary"
                >
                  Add
                </MyButtonM>
              </Box>
            </Box>
            <Box m={2}>
              <Typography variant="h5">Black Patterns</Typography>
              <PatternList ref={refBlackRules} list={proxy.blackPatterns} />
              <Box my={2} textAlign="center">
                Add black patterns to prevent this proxy being used for localhost & intranet/private
                IP addresses
                <MyButtonM
                  onClick={handleBlacklistLocalhost}
                  variant="contained"
                  size="small"
                  color="secondary"
                >
                  Add
                </MyButtonM>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <ActionBox mx={2} mb={2}>
              <MyButtonM component={Link} to="/" variant="contained">
                Cancel
              </MyButtonM>
              <MyButtonM onClick={handleNewWhite} variant="contained" color="secondary">
                New White
              </MyButtonM>
              <MyButtonM onClick={handleNewBlack} variant="contained" color="secondary">
                New Black
              </MyButtonM>
              <MyButtonM onClick={handleSave} variant="contained" color="primary">
                Save
              </MyButtonM>
            </ActionBox>
          </Grid>
        </Grid>
      </Box>
      {notify && <Notification key={getObjectId(notify)} notify={notify} />}
    </>
  );
};

interface PatternListProps {
  list: ProxyPattern[];
}

interface PatternListHandler {
  addRule: (name?: string, pattern?: string, type?: ProxyPatternType) => void;
  getPatterns: () => ProxyPattern[];
}

const PatternList = React.forwardRef<PatternListHandler, PatternListProps>(({list}, ref) => {
  const [scope] = React.useState<{patterns: ProxyPattern[]}>({patterns: []});
  const [patterns, setPatterns] = React.useState(list);

  scope.patterns = patterns;

  React.useImperativeHandle(
    ref,
    () => {
      return {
        addRule(name = '', pattern = '', type = ProxyPatternType.Wildcard) {
          const {patterns} = scope;
          patterns.push({
            enabled: true,
            name,
            type: type as ProxyPatternType,
            pattern,
          });
          setPatterns(patterns.slice(0));
        },
        getPatterns() {
          return scope.patterns;
        },
      };
    },
    [scope],
  );

  const handlePatternDelete = React.useCallback(
    (pattern) => {
      const {patterns} = scope;
      const pos = patterns.indexOf(pattern);
      if (pos === -1) return;
      patterns.splice(pos, 1);
      setPatterns(patterns.slice(0));
    },
    [scope],
  );

  const handlePatternCopy = React.useCallback(
    (pattern) => {
      const {patterns} = scope;
      const pos = patterns.indexOf(pattern);
      if (pos === -1) return;
      const clone = JSON.parse(JSON.stringify(pattern));
      patterns.splice(pos + 1, 0, clone);
      setPatterns(patterns.slice(0));
    },
    [scope],
  );

  const handlePatternMove = React.useCallback(
    (pattern, offset) => {
      const {patterns} = scope;
      const pos = patterns.indexOf(pattern);
      if (pos === -1) return;
      patterns.splice(pos, 1);

      patterns.splice(pos + offset, 0, pattern);
      setPatterns(patterns.slice(0));
    },
    [scope],
  );

  const helpTooltip = React.useMemo(() => {
    return (
      <Box>
        <Typography variant="body2">
          Use newline or comma `,` for splitting patterns <br />
          If line starts from pound sign `#` it will ignored
        </Typography>
        <Typography variant="h6">Wildcard</Typography>
        <Typography variant="body2">
          <b>*</b> - all domains <br />
          <b>*.bbc.co.uk</b> - exact domain and all subdomains <br />
          <b>**.bbc.co.uk</b> - subdomains only (not bbc.co.uk) <br />
          <b>bbc.co.uk</b> - exact domain only <br />
          <b>http://bbc.co.uk</b> - exact http protocol <br />
        </Typography>
        <Typography variant="h6">RegExp</Typography>
        <Typography variant="body2">
          Input url looks like <b>scheme://host:port</b> credentials, path, query are ignored
        </Typography>
      </Box>
    );
  }, []);

  return (
    <TableContainerS>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell className="name-cell">Name</TableCell>
            <TableCell className="pattern-cell">Pattern</TableCell>
            <TableCell className="type-cell">
              <Grid container alignItems="center">
                <Grid item xs>
                  Type
                </Grid>
                <Grid item>
                  <Tooltip
                    placement="left-start"
                    title={helpTooltip}
                    style={{verticalAlign: 'middle'}}
                  >
                    <InfoIcon color="primary" />
                  </Tooltip>
                </Grid>
              </Grid>
            </TableCell>
            <TableCell className="enabled-cell">Enabled</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {patterns.map((pattern, index) => {
            const isFirst = index === 0;
            const isLast = index === patterns.length - 1;
            return (
              <Pattern
                key={getObjectId(pattern)}
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

const selectInputProps = {
  underline: 'none',
};

interface PatternProps {
  pattern: ProxyPattern;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (pattern: ProxyPattern) => unknown;
  onCopy: (pattern: ProxyPattern) => unknown;
  onMove: (pattern: ProxyPattern, dir: number) => unknown;
}

const Pattern: FC<PatternProps> = ({pattern, isFirst, isLast, onDelete, onCopy, onMove}) => {
  const [isValid, setValid] = React.useState(true);
  const origPattern = React.useMemo(() => ({...pattern}), [pattern]);

  React.useEffect(() => {
    setValid(isValidPattern(pattern.pattern, pattern.type));
  }, [pattern.pattern, pattern.type]);

  const handleDelete = React.useCallback(
    (e) => {
      e.preventDefault();
      onDelete(pattern);
    },
    [onDelete, pattern],
  );

  const handleCopy = React.useCallback(
    (e) => {
      e.preventDefault();
      onCopy(pattern);
    },
    [onCopy, pattern],
  );

  const handleMoveUp = React.useCallback(
    (e) => {
      e.preventDefault();
      onMove(pattern, -1);
    },
    [onMove, pattern],
  );

  const handleMoveDown = React.useCallback(
    (e) => {
      e.preventDefault();
      onMove(pattern, 1);
    },
    [onMove, pattern],
  );

  const handleEnabledChange = React.useCallback(
    (e) => {
      pattern.enabled = e.target.checked;
    },
    [pattern],
  );

  const handleNameChange = React.useCallback(
    (e) => {
      pattern.name = e.target.value;
    },
    [pattern],
  );

  const handlePatternChange = React.useCallback(
    (e) => {
      pattern.pattern = e.target.value;
      setValid(isValidPattern(pattern.pattern, pattern.type));
    },
    [pattern],
  );

  const handleTypeChange = React.useCallback(
    (e) => {
      pattern.type = e.target.value;
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
          <Grid item>
            <Checkbox
              className="small-checkbox"
              onChange={handleEnabledChange}
              defaultChecked={origPattern.enabled}
            />
          </Grid>
          <Grid item>
            <IconButton onClick={handleMoveUp} disabled={isFirst} size="small">
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={handleMoveDown} disabled={isLast} size="small">
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={handleCopy} size="small">
              <CopyIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={handleDelete} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );
};

function isValidPattern(value: string, type: string) {
  if (type === 'wildcard') return true;
  let result = true;
  try {
    splitMultiPattern(value).forEach((v) => new RegExp(`(?:${v})`));
  } catch (err) {
    result = false;
  }
  return result;
}

export default Patterns;
