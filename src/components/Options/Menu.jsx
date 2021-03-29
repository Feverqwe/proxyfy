import {List, ListItem, ListItemIcon, ListItemText} from "@material-ui/core";
import {Link} from "react-router-dom";
import AddIcon from "@material-ui/icons/Add";
import * as React from "react";
import promisifyApi from "../../tools/promisifyApi";
import downloadBlob from "../../tools/downloadBlob";
import fileReaderReady from "../../tools/fileReaderPromise";
import ConfigStruct from "../../tools/ConfigStruct";
import SaveIcon from '@material-ui/icons/Save';
import RestoreIcon from '@material-ui/icons/Restore';

const Menu = React.memo(() => {
  const refFileInput = React.useRef();

  React.useEffect(() => {
    const input = /**@type HTMLInputElement*/refFileInput.current;
    input.addEventListener('change', (e) => {
      const files = e.currentTarget.files;
      if (!files.length) return;
      const file = files[0];
      const reader = new FileReader();
      const promise = fileReaderReady(reader);
      reader.readAsText(file);
      promise.then((json) => {
        const storage = JSON.parse(json);
        ConfigStruct.assert(storage);
        return promisifyApi('chrome.storage.sync.set')(storage);
      }).then(() => {
        location.reload();
      }, (err) => {
        console.error('Import settings error: %O', err);
      });
    });
  }, []);

  const handleExportSettings = React.useCallback((e) => {
    e.preventDefault();
    promisifyApi('chrome.storage.sync.get')().then((storage) => {
      const blob = new Blob([JSON.stringify(storage, null, 2)]);
      downloadBlob(blob, 'proxyfy.json');
    }).catch((err) => {
      console.error('Export settings error: %O', err);
    });
  }, []);

  const handleImportSettings = React.useCallback((e) => {
    e.preventDefault();
    const input = /**@type HTMLInputElement*/refFileInput.current;
    input.dispatchEvent(new MouseEvent('click'));
  }, []);

  return (
    <List component="nav" disablePadding>
      <ListItem button component={Link} to={'/proxy'}>
        <ListItemIcon>
          <AddIcon/>
        </ListItemIcon>
        <ListItemText primary={'Add'}/>
      </ListItem>
      <ListItem button onClick={handleExportSettings}>
        <ListItemIcon>
          <SaveIcon/>
        </ListItemIcon>
        <ListItemText primary={'Export settings'}/>
      </ListItem>
      <ListItem button onClick={handleImportSettings}>
        <ListItemIcon>
          <RestoreIcon/>
        </ListItemIcon>
        <ListItemText primary={'Import settings'}/>
        <input ref={refFileInput} type="file" accept=".json" hidden/>
      </ListItem>
    </List>
  );
});

export default Menu;
