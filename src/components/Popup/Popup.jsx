import * as React from "react";
import {useEffect} from "react";
import {Box, List, ListItem, ListItemText, makeStyles, Paper} from "@material-ui/core";
import getConfig from "../../tools/getConfig";
import promiseTry from "../../tools/promiseTry";
import promisifyApi from "../../tools/promisifyApi";

const useStyles = makeStyles(() => {
  return {
    box: {
      minWidth: '350px',
      borderRadius: 0,
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

  const [proxies, setProxies] = React.useState(null);
  const [state, setState] = React.useState({});

  useEffect(() => {
    promiseTry(async () => {
      const [state, {proxies}] = await Promise.all([
        getState(),
        getConfig(),
      ]);
      setState(state);
      setProxies(proxies);
    }).catch((err) => {
      console.error('getConfig error: %O', err);
    });
  }, []);

  const handleClick = React.useCallback((mode, id) => {
    return promiseTry(async () => {
      await promisifyApi('chrome.runtime.sendMessage')({
        action: 'set', mode, id
      });

      const state = await getState();

      setState(state);
    });
  }, []);

  if (!proxies) return null;

  return (
    <Box component={Paper} className={classes.box}>
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

/**
 * @return {Promise<null | {mode: string, id?: string}>}
 */
function getState() {
  return promisifyApi('chrome.runtime.sendMessage')({
    action: 'get'
  });
}

export default Popup;
