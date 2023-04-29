import React from "react";
import {Box, Divider, List, ListItem, ListItemText, makeStyles, Paper} from "@material-ui/core";
import promisifyApi from "../../tools/promisifyApi";
import useActualState from "../useActualState";
import useActualProxies from "../useActualProxies";

const useStyles = makeStyles(() => {
  return {
    box: {
      minWidth: '350px',
    },
    active: {
      color: '#fff',
      backgroundColor: '#007bff',
      '&:hover': {
        color: '#fff',
        backgroundColor: '#007bff',
      }
    }
  };
});

const defaultItems = [
  {title: 'Use enabled proxies by patterns and order', mode: 'pac_script'},
  /*{title: 'Off (use auto detect)', mode: 'auto_detect'},*/
  {title: 'Off (use system settings)', mode: 'system'},
];

const Popup = React.memo(() => {
  const classes = useStyles();

  const state = useActualState();
  const proxies = useActualProxies();

  const handleClick = React.useCallback((mode, id) => {
    promisifyApi('chrome.runtime.sendMessage')({
      action: 'set', mode, id
    }).catch((err) => {
      console.error('Set proxy error: %O', err);
    });
  }, []);

  if (!proxies) return null;

  return (
    <Box component={Paper} elevation={0} square className={classes.box}>
      <List component="nav" disablePadding>
        {defaultItems.map((item, index) => {
          const checked = state && state.mode === item.mode;
          return (
            <ProxyItem key={index} item={item} checked={checked} mode={item.mode} onClick={handleClick}/>
          )
        })}
        {proxies.map((item) => {
          const checked = state && state.id === item.id;
          return (
            <ProxyItem key={'_' + item.id} item={item} checked={checked} mode={'fixed_servers'} onClick={handleClick}/>
          )
        })}
        <Divider />
        <ListItem
          button
          component={'a'}
          href={'./options.html'}
          target={'_blank'}
        >
          <ListItemText primary={'Options'}/>
        </ListItem>
      </List>
    </Box>
  );
});

const ProxyItem = React.memo(({item, mode, checked, onClick}) => {
  const classes = useStyles();

  const handleClick = React.useCallback((e) => {
    e.preventDefault();
    const id = item.id;
    onClick(mode, id);
  }, [item, mode]);

  const classNames = [];
  if (checked) {
    classNames.push(classes.active);
  }

  return (
    <ListItem onClick={handleClick} className={classNames.join(' ')} button>
      <ListItemText primary={item.title}/>
    </ListItem>
  );
});

export default Popup;
