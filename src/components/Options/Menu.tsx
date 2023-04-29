import {List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
import {Link} from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import React, {FC, useCallback, useEffect, useRef} from 'react';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import downloadBlob from '../../tools/downloadBlob';
import fileReaderReady from '../../tools/fileReaderPromise';
import ConfigStruct from '../../tools/ConfigStruct';

const Menu: FC = () => {
  const refFileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const input = refFileInput.current;
    if (!input) return;
    input.addEventListener('change', (e) => {
      const target = e.currentTarget as HTMLInputElement;
      const files = target.files || [];
      if (!files.length) return;
      const file = files[0];

      const reader = new FileReader();
      const promise = fileReaderReady(reader);
      reader.readAsText(file);
      promise
        .then(async (json) => {
          const storage = JSON.parse(json as string);
          const _ = ConfigStruct.assert(storage);
          await chrome.storage.sync.set(storage);
          location.reload();
        })
        .catch((err) => {
          console.error('Import settings error: %O', err);
        });
    });
  }, []);

  const handleExportSettings = useCallback(async (e) => {
    e.preventDefault();
    try {
      const storage = await chrome.storage.sync.get();
      const blob = new Blob([JSON.stringify(storage, null, 2)]);
      downloadBlob(blob, 'proxyfy.json');
    } catch (err) {
      console.error('Export settings error: %O', err);
    }
  }, []);

  const handleImportSettings = useCallback((e) => {
    e.preventDefault();
    const input = refFileInput.current;
    if (!input) return;
    input.dispatchEvent(new MouseEvent('click'));
  }, []);

  return (
    <List component="nav" disablePadding>
      <ListItemButton component={Link} to="/proxy">
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
        <ListItemText primary="Add" />
      </ListItemButton>
      <ListItemButton onClick={handleExportSettings}>
        <ListItemIcon>
          <SaveIcon />
        </ListItemIcon>
        <ListItemText primary="Export settings" />
      </ListItemButton>
      <ListItemButton onClick={handleImportSettings}>
        <ListItemIcon>
          <RestoreIcon />
        </ListItemIcon>
        <ListItemText primary="Import settings" />
        <input ref={refFileInput} type="file" accept=".json" hidden />
      </ListItemButton>
    </List>
  );
};

export default Menu;
