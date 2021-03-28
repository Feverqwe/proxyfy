import {List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {Link} from "react-router-dom";
import AddIcon from "@material-ui/icons/Add";
import * as React from "react";

const Menu = React.memo(() => {
  return (
    <List component="nav" disablePadding>
      <ListItem button component={Link} to={'/proxy'}>
        <ListItemIcon>
          <AddIcon/>
        </ListItemIcon>
        <ListItemText primary={'Add'}/>
      </ListItem>
    </List>
  );
});

export default Menu;
