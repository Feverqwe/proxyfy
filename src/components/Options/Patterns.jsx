import React, {useEffect} from "react";
import {
  Box,
  Button,
  Checkbox,
  Grid,
  InputBase,
  makeStyles,
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
  Typography
} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import Header from "../Header";
import {Redirect, useHistory, useLocation} from "react-router";
import qs from "querystring-es3";
import promiseTry from "../../tools/promiseTry";
import {Link} from "react-router-dom";
import PropTypes from "prop-types";
import ConfigStruct from "../../tools/ConfigStruct";
import promisifyApi from "../../tools/promisifyApi";
import getId from "../../tools/getId";
import InfoIcon from '@material-ui/icons/Info';
import CopyIcon from "./CopyIcon";
import ArrowUpwardIcon from "@material-ui/icons/ArrowUpward";
import ArrowDownwardIcon from "@material-ui/icons/ArrowDownward";

const useStyles = makeStyles((theme) => {
  return {
    actionBox: {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    button: {
      margin: '8px',
    },
    center: {
      textAlign: 'center',
    },
    micro: {
      '& .small-checkbox': {
        padding: 0,
      },
      '& tbody tr:hover': {
        backgroundColor: theme.palette.action.hover,
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
        width: '130px',
      },
      '& .MuiInputBase-root.Mui-error': {
        boxShadow: 'inset 0 0 2px #ff0000',
      }
    },
    vCenter: {
      verticalAlign: 'middle'
    },
  };
});

const Patterns = React.memo(() => {
  const location = useLocation();
  const [proxy, setProxy] = React.useState(null);
  const [isRedirect, setRedirect] = React.useState(null);

  useEffect(() => {
    let isMounted = true;

    const query = qs.parse(location.search.substr(1));
    promiseTry(() => {
      if (query.id) {
        return getConfig().then(({proxies}) => {
          return proxies.find(p => p.id === query.id);
        });
      }
      return null;
    }).then((proxy) => {
      if (!isMounted) return;
      if (!proxy) {
        setRedirect(true);
      } else {
        setProxy(proxy);
      }
    }).catch((err) => {
      console.error('getConfig error: %O', err);
    });

    return () => {
      isMounted = false;
    }
  }, [location.search]);

  if (!proxy) return null;

  if (isRedirect) {
    return (
      <Redirect to={'/'} />
    );
  }

  return (
    <PatternsLoaded key={proxy.id} proxy={proxy}/>
  );
});

export const matchAllPresets = [
  {
    name: 'all URLs',
    pattern: '*',
    type: 'wildcard',
  },
];

export const localhostPresets = [
  {
    name: `local hostnames (usually no dots in the name). Pattern exists because 'Do not use this proxy for localhost and intranet/private IP addresses' is checked.`,
    pattern: `^[^:]+\\/\\/(?:[^:@/]+(?::[^@/]+)?@)?(?:localhost|127\\.\\d+\\.\\d+\\.\\d+)(?::\\d+)?(?:/.*)?$`,
    type: 'regexp',
  },
  {
    name: `local subnets (IANA reserved address space). Pattern exists because 'Do not use this proxy for localhost and intranet/private IP addresses' is checked.`,
    pattern: `^[^:]+\\/\\/(?:[^:@/]+(?::[^@/]+)?@)?(?:192\\.168\\.\\d+\\.\\d+|10\\.\\d+\\.\\d+\\.\\d+|172\\.(?:1[6789]|2[0-9]|3[01])\\.\\d+\\.\\d+)(?::\\d+)?(?:/.*)?$`,
    type: 'regexp',
  },
  {
    name: `localhost - matches the local host optionally prefixed by a user:password authentication string and optionally suffixed by a port number. The entire local subnet (127.0.0.0/8) matches. Pattern exists because 'Do not use this proxy for localhost and intranet/private IP addresses' is checked.`,
    pattern: `^[^:]+\\/\\/(?:[^:@/]+(?::[^@/]+)?@)?[\\w-]+(?::\\d+)?(?:/.*)?$`,
    type: 'regexp'
  }
];

const PatternsLoaded = React.memo(({proxy}) => {
  const history = useHistory();
  const classes = useStyles();
  const refWhiteRules = React.useRef();
  const refBlackRules = React.useRef();

  const handleNewWhite = React.useCallback((e) => {
    e.preventDefault();
    refWhiteRules.current.addRule();
  }, []);

  const handleNewBlack = React.useCallback((e) => {
    e.preventDefault();
    refBlackRules.current.addRule();
  }, []);

  const handleSave = React.useCallback((e) => {
    e.preventDefault();
    const whitePatterns = refWhiteRules.current.getPatterns();
    const blackPatterns = refBlackRules.current.getPatterns();

    return promiseTry(async () => {
      const config = await getConfig();
      const existsProxy = config.proxies.find(p => p.id === proxy.id);
      if (!existsProxy) {
        throw new Error('Proxy is not found');
      }
      existsProxy.whitePatterns = whitePatterns;
      existsProxy.blackPatterns = blackPatterns
      ConfigStruct.assert(config);
      await promisifyApi('chrome.storage.sync.set')(config);
    }).then(() => {
      history.push('/');
    }, (err) => {
      console.error('Save proxy error: %O', err);
    });
  }, [proxy]);

  const handleWhitelistMatchAll = React.useCallback((e) => {
    e.preventDefault();
    matchAllPresets.forEach(({name, pattern, type}) => {
      refWhiteRules.current.addRule(name, pattern, type);
    });
  }, []);

  const handleBlacklistLocalhost = React.useCallback((e) => {
    e.preventDefault();
    localhostPresets.forEach(({name, pattern, type}) => {
      refBlackRules.current.addRule(name, pattern, type);
    });
  }, []);

  return (
    <>
      <Header title={'Edit patterns'}/>
      <Box component={Paper} m={2}>
        <Grid container>
          <Grid item xs={12}>
            <Box m={2}>
              <Typography variant={'h5'}>
                White Patterns
              </Typography>
              <PatternList ref={refWhiteRules} list={proxy.whitePatterns}/>
              <Box my={2} className={classes.center}>
                Add whitelist pattern to match all URLs
                <Button
                  onClick={handleWhitelistMatchAll}
                  variant="contained"
                  size={'small'}
                  className={classes.button}
                  color={"secondary"}
                >
                  Add
                </Button>
              </Box>
            </Box>
            <Box m={2}>
              <Typography variant={'h5'}>
                Black Patterns
              </Typography>
              <PatternList ref={refBlackRules} list={proxy.blackPatterns}/>
              <Box my={2} className={classes.center}>
                Add black patterns to prevent this proxy being used for localhost & intranet/private IP addresses
                <Button
                  onClick={handleBlacklistLocalhost}
                  variant="contained"
                  size={'small'}
                  className={classes.button}
                  color={"secondary"}
                >
                  Add
                </Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box mx={2} mb={2} className={classes.actionBox}>
              <Button
                component={Link}
                to={'/'}
                variant="contained"
                className={classes.button}
              >
                Cancel
              </Button>
              <Button onClick={handleNewWhite} variant="contained" className={classes.button} color="secondary">
                New White
              </Button>
              <Button onClick={handleNewBlack} variant="contained" className={classes.button} color="secondary">
                New Black
              </Button>
              <Button onClick={handleSave} variant="contained" className={classes.button} color="primary">
                Save
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
});

const PatternList = React.memo(React.forwardRef(({list}, ref) => {
  const classes = useStyles();
  const [scope] = React.useState({});
  const [patterns, setPatterns] = React.useState(list);

  scope.patterns = patterns;

  React.useImperativeHandle(ref, () => {
    return {
      addRule(name = '', pattern = '', type = 'wildcard') {
        const {patterns} = scope;
        patterns.push({
          id: getId(),
          enabled: true,
          name,
          type,
          pattern,
        });
        setPatterns(patterns.slice(0));
      },
      getPatterns() {
        return scope.patterns;
      }
    };
  }, []);

  const handlePatternDelete = React.useCallback((pattern) => {
    const {patterns} = scope;
    const pos = patterns.indexOf(pattern);
    if (pos === -1) return;
    patterns.splice(pos, 1);
    setPatterns(patterns.slice(0));
  }, []);

  const handlePatternCopy = React.useCallback((pattern) => {
    const {patterns} = scope;
    const pos = patterns.indexOf(pattern);
    if (pos === -1) return;
    const clone = JSON.parse(JSON.stringify(pattern));
    clone.id = getId();
    patterns.splice(pos + 1, 0, clone);
    setPatterns(patterns.slice(0));
  }, []);

  const handlePatternMove = React.useCallback((pattern, offset) => {
    const {patterns} = scope;
    const pos = patterns.indexOf(pattern);
    if (pos === -1) return;
    patterns.splice(pos, 1);

    patterns.splice(pos + offset, 0, pattern);
    setPatterns(patterns.slice(0));
  }, []);

  const helpTooltip = React.useMemo(() => {
    return (
      <Box>
        <Typography variant="h6">Wildcard</Typography>
        <Typography variant="body2">
          <b>*</b> - all domains <br/>
          <b>*.bbc.co.uk</b> - exact domain and all subdomains <br/>
          <b>**.bbc.co.uk</b> - subdomains only (not bbc.co.uk) <br/>
          <b>bbc.co.uk</b> - exact domain only <br/>
          <b>http://bbc.co.uk</b> - exact http protocol <br/>
        </Typography>
        <Typography variant="h6">RegExp</Typography>
        <Typography variant="body2">
          Input url looks like <b>scheme://host:port</b> credentials, path, query are ignored
        </Typography>
      </Box>
    );
  }, []);

  return (
    <TableContainer className={classes.micro}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell className="name-cell">Name</TableCell>
            <TableCell className="pattern-cell">Pattern</TableCell>
            <TableCell className="type-cell">
              <Grid container alignItems={'center'}>
                <Grid item xs>
                  Type
                </Grid>
                <Grid item>
                  <Tooltip interactive placement={'left-start'} title={helpTooltip} className={classes.vCenter}>
                    <InfoIcon color="primary"/>
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
                key={pattern.id}
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
    </TableContainer>
  );
}));
PatternList.propTypes = {
  list: PropTypes.array,
};

const selectInputProps = {
  underline: 'none',
};
const Pattern = React.memo(({pattern, isFirst, isLast, onDelete, onCopy, onMove}) => {
  const [isValid, setValid] = React.useState(true);
  const origPattern = React.useMemo(() => Object.assign({}, pattern), []);

  React.useEffect(() => {
    setValid(isValidPattern(pattern.pattern, pattern.type));
  }, []);

  const handleDelete = React.useCallback((e) => {
    e.preventDefault();
    onDelete(pattern);
  }, []);

  const handleCopy = React.useCallback((e) => {
    e.preventDefault();
    onCopy(pattern);
  }, []);

  const handleMoveUp = React.useCallback((e) => {
    e.preventDefault();
    onMove(pattern, -1);
  }, []);

  const handleMoveDown = React.useCallback((e) => {
    e.preventDefault();
    onMove(pattern, 1);
  }, []);

  const handleEnabledChange = React.useCallback((e) => {
    pattern.enabled = e.target.checked;
  }, []);

  const handleNameChange = React.useCallback((e) => {
    pattern.name = e.target.value;
  }, []);

  const handlePatternChange = React.useCallback((e) => {
    pattern.pattern = e.target.value;
    setValid(isValidPattern(pattern.pattern, pattern.type));
  }, []);

  const handleTypeChange = React.useCallback((e) => {
    pattern.type = e.target.value;
    setValid(isValidPattern(pattern.pattern, pattern.type));
  }, []);

  return (
    <TableRow>
      <TableCell padding="none" className="name-cell">
        <InputBase
          size="small"
          onChange={handleNameChange}
          defaultValue={origPattern.name}
          fullWidth
          autoComplete={'off'}
        />
      </TableCell>
      <TableCell padding="none" className="pattern-cell">
        <InputBase
          size="small"
          onChange={handlePatternChange}
          defaultValue={origPattern.pattern}
          fullWidth
          autoComplete={'off'}
          error={!isValid}
        />
      </TableCell>
      <TableCell padding="none" className="type-cell">
        <Select
          onChange={handleTypeChange}
          defaultValue={origPattern.type}
          fullWidth
          input={<InputBase size="small" />}
          inputProps={selectInputProps}
        >
          <MenuItem value={'wildcard'}>Wildcard</MenuItem>
          <MenuItem value={'regexp'}>RegExp</MenuItem>
        </Select>
      </TableCell>
      <TableCell padding="none" className="enabled-cell">
        <Grid container alignItems={'center'}>
          <Grid item>
            <Checkbox className="small-checkbox" onChange={handleEnabledChange} defaultChecked={origPattern.enabled} />
          </Grid>
          <Grid item>
            <IconButton onClick={handleMoveUp} disabled={isFirst} size={'small'}>
              <ArrowUpwardIcon fontSize="small"/>
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={handleMoveDown} disabled={isLast} size={'small'}>
              <ArrowDownwardIcon fontSize="small"/>
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={handleCopy} size={'small'}>
              <CopyIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid item>
            <IconButton onClick={handleDelete} size={'small'}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </TableCell>
    </TableRow>
  );
});
Pattern.propTypes = {
  pattern: PropTypes.object,
};

function isValidPattern(value, type) {
  if (type === 'wildcard') return true;
  let result = true;
  try {
    new RegExp(`(?:${value})`);
  } catch (err) {
    result = false;
  }
  return result;
}

export default Patterns;
