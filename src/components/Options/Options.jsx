import * as React from "react";
import {useEffect} from "react";
import {Box, Button, Checkbox, Grid, makeStyles, Paper} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import {Link} from "react-router-dom";
import Header from "../Header";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import qs from "querystring-es3";
import promisifyApi from "../../tools/promisifyApi";
import ConfigStruct from "../../tools/ConfigStruct";
import Menu from "./Menu";
import ProxySelect from "./ProxySelect";

const useStyles = makeStyles(() => {
  return {
    mainBox: {
      minHeight: '400px',
    }
  };
});

const Options = React.memo(() => {
  const classes = useStyles();
  const [scope] = React.useState({});
  const [proxies, setProxies] = React.useState([]);

  scope.proxies = proxies;

  useEffect(() => {
    let isMounted = true;
    getConfig().then(({proxies}) => {
      if (!isMounted) return;
      setProxies(proxies);
    }, (err) => {
      console.error('getConfig error: %O', err);
    });
    return () => {
      isMounted = false;
    }
  }, []);

  const handleProxyDelete = React.useCallback((id) => {
    const {proxies} = scope;
    const proxy = proxies.find(p => p.id === id);
    const pos = proxies.indexOf(proxy);
    if (pos === -1) return;
    proxies.splice(pos, 1);
    ConfigStruct.assert({proxies});
    return promisifyApi('chrome.storage.sync.set')({proxies}).then(() => {
      setProxies(proxies.slice(0));
    });
  }, []);

  const handleMove = React.useCallback((isUp, id) => {
    const {proxies} = scope;
    const proxy = proxies.find(p => p.id === id);
    const pos = proxies.indexOf(proxy);
    if (pos === -1) return;
    proxies.splice(pos, 1);
    if (isUp) {
      proxies.splice(pos - 1, 0, proxy);
    } else {
      proxies.splice(pos + 1, 0, proxy);
    }
    ConfigStruct.assert({proxies});
    return promisifyApi('chrome.storage.sync.set')({proxies}).then(() => {
      setProxies(proxies.slice(0));
    });
  }, []);

  const handleEnabledChange = React.useCallback((isEnabled, id) => {
    const {proxies} = scope;
    const proxy = proxies.find(p => p.id === id);
    if (!proxy) return;
    proxy.enabled = isEnabled;
    ConfigStruct.assert({proxies});
    return promisifyApi('chrome.storage.sync.set')({proxies}).then(() => {
      setProxies(proxies.slice(0));
    });
  }, []);

  return (
    <>
      <Header title={'Options'}/>
      <Box component={Paper} m={2}>
        <Grid container>
          <Grid item xs={3}>
            <Box m={2}>
              <Menu/>
            </Box>
          </Grid>
          <Grid item xs>
            <Box m={2} className={classes.mainBox}>
              <ProxySelect />
              <Grid container direction={'column'}>
                {proxies.map((proxy) => {
                  const isFirst = proxies.indexOf(proxy) === 0;
                  const isLast = proxies.indexOf(proxy) === proxies.length - 1;

                  return (
                    <Grid item key={proxy.id}>
                      <ProxyItem
                        proxy={proxy} isFirst={isFirst} isLast={isLast}
                        onDelete={handleProxyDelete}
                        onMove={handleMove}
                        onEnabledChange={handleEnabledChange}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
});

const ProxyItem = React.memo(({proxy, isFirst, isLast, onDelete, onMove, onEnabledChange}) => {
  const handleDelete = React.useCallback((e) => {
    e.preventDefault();
    onDelete(proxy.id);
  }, [proxy, onDelete]);

  const handleMoveUp = React.useCallback((e) => {
    e.preventDefault();
    onMove(true, proxy.id);
  }, [proxy, onMove]);

  const handleMoveDown = React.useCallback((e) => {
    e.preventDefault();
    onMove(false, proxy.id);
  }, [proxy, onMove]);

  const handleEnabledChange = React.useCallback((e) => {
    onEnabledChange(e.target.checked, proxy.id);
  }, [proxy, onEnabledChange]);

  return (
    <Grid container direction="row" spacing={1} justify={'space-between'} alignItems="center">
      <Grid item>
        <Color color={proxy.color}/>
      </Grid>
      <Grid item xs>
        {proxy.title}
      </Grid>
      <Grid item xs>
        {proxy.host}
      </Grid>
      <Grid item>
        <Checkbox defaultChecked={proxy.enabled} onChange={handleEnabledChange}/>
      </Grid>
      <Grid item>
        <Button component={Link} to={'/proxy?' + qs.stringify({
          id: proxy.id,
        })} variant="outlined" size={'small'} color="primary">
          Edit
        </Button>
      </Grid>
      <Grid item>
        <Button component={Link} to={'/patterns?' + qs.stringify({
          id: proxy.id,
        })} variant="outlined" size={'small'} color="primary">
          Patterns
        </Button>
      </Grid>
      <Grid item>
        <IconButton onClick={handleDelete} size={'small'}>
          <DeleteIcon fontSize="small"/>
        </IconButton>
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
    </Grid>
  );
});

const Color = React.memo(({color}) => {
  return (
    <div style={{
      display: 'inline-block',
      width: '44px',
      height: '22px',
      backgroundColor: color,
      verticalAlign: 'middle',
      borderRadius: '4px',
    }}/>
  );
});

export default Options;
