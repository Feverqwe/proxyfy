import * as React from "react";
import {useEffect} from "react";
import {Box, List, ListItem, ListItemText, makeStyles, Paper} from "@material-ui/core";
import getConfig from "../../tools/getConfig";

const useStyles = makeStyles(() => {
  return {
    box: {
      minWidth: '400px',
    }
  };
});

const defaultItems = [
  {title: 'Use enabled proxies by patterns and order', mode: 'pac_script'},
  {title: 'Off (use auto detect)', mode: 'auto_detect'},
  {title: 'Off (use system settings)', mode: 'system'},
];

const Popup = React.memo(() => {
  const classes = useStyles();

  const [proxies, setProxies] = React.useState([]);

  useEffect(() => {
    let isMounted = true;
    getConfig().then(({proxies}) => {
      if (!isMounted) return;
      setProxies(proxies.map((proxy) => {
        return {
          id: proxy.id,
          title: proxy.title,
        };
      }));
    }, (err) => {
      console.error('getConfig error: %O', err);
    });
    return () => {
      isMounted = false;
    }
  }, []);

  return (
    <Box component={Paper} m={1} className={classes.box}>
      <List component="nav" disablePadding>
        {defaultItems.map((item, index) => {
          return (
            <ProxyItem key={index} item={item} mode={item.mode}/>
          )
        })}
        {proxies.map((item) => {
          return (
            <ProxyItem key={'_' + item.id} item={item} mode={'fixed_servers'}/>
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

const ProxyItem = React.memo(({item, mode}) => {
  const handleClick = React.useCallback((e) => {
    e.preventDefault();
    const id = item.id;
    chrome.runtime.sendMessage({
      action: 'set',
      mode, id,
    });
  }, [item, mode]);

  return (
    <ListItem onClick={handleClick} button>
      <ListItemText primary={item.title}/>
    </ListItem>
  );
});

export default Popup;
