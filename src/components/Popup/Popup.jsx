import * as React from "react";
import {Box, List, ListItem, ListItemText, makeStyles} from "@material-ui/core";
import {useEffect} from "react";
import getConfig from "../../tools/getConfig";

const useStyles = makeStyles(() => {
  return {
    box: {
      minWidth: '400px',
    }
  };
});

const defaultItems = [
  {title: 'Use enabled proxies by patterns and order', mode: 'auto_detect', id: 'auto_detect'},
  {title: 'Off (use system settings)', mode: 'system', id: 'system'},
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
    <Box className={classes.box}>
      <List className="list" component="nav" disablePadding>
        {proxies.map((item) => {
          return (
            <ProxyItem key={'_' + item.id} item={item} isProxy={true}/>
          )
        })}
        {defaultItems.map((item) => {
          return (
            <ProxyItem key={item.id} item={item}/>
          )
        })}
        <ListItem
          className="list-item"
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

const ProxyItem = React.memo(({item, isProxy = false}) => {
  return (
    <ListItem className="list-item" button>
      <ListItemText primary={item.title}/>
    </ListItem>
  );
});

export default Popup;
