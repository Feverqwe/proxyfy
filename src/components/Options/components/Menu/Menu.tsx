import React, {FC, useCallback, useEffect, useRef} from 'react';

import AddIcon from '@mui/icons-material/Add';
import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import {Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography} from '@mui/material';
import {Link} from 'react-router';

import {getExportConfig, replaceConfig} from '../../../../services/runtime/runtimeClient';
import {downloadBlob, parseConfig, readBlobAsText} from '../../../../tools/index';

const Menu: FC = () => {
  const refFileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const input = refFileInput.current;
    if (!input) return;
    input.addEventListener('change', async (e) => {
      const target = e.currentTarget as HTMLInputElement;
      const files = target.files || [];
      if (!files.length) return;
      const file = files[0];

      try {
        const data = await readBlobAsText(file);
        const config = parseConfig(JSON.parse(data as string));
        await replaceConfig(config);
        location.reload();
      } catch (err) {
        console.error('Import settings error: %O', err);
      } finally {
        target.value = '';
      }
    });
  }, []);

  const handleExportSettings = useCallback(async (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      const config = await getExportConfig();
      const blob = new Blob([JSON.stringify(config, null, 2)]);
      downloadBlob(blob, 'proxyfy.json');
    } catch (err) {
      console.error('Export settings error: %O', err);
    }
  }, []);

  const handleImportSettings = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault();
    const input = refFileInput.current;
    if (!input) return;
    input.dispatchEvent(new MouseEvent('click'));
  }, []);

  return (
    <List component="nav" aria-label="Connection settings" disablePadding sx={{mt: 0.75}}>
      <ListItemButton component={Link} to="/proxy" sx={{borderRadius: 2}}>
        <ListItemIcon>
          <AddIcon />
        </ListItemIcon>
        <ListItemText primary="New connection" />
      </ListItemButton>
      <ListItemButton component={Link} to="/storage" sx={{borderRadius: 2}}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        <ListItemText primary="Storage & icon" />
      </ListItemButton>
      <Divider sx={{my: 1.5}} />
      <Typography variant="overline" color="text.secondary" sx={{px: 1}}>
        Configuration
      </Typography>
      <ListItemButton onClick={handleExportSettings} sx={{borderRadius: 2, mt: 0.75}}>
        <ListItemIcon>
          <CloudDownloadOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary="Export" secondary="Save a JSON backup" />
      </ListItemButton>
      <ListItemButton onClick={handleImportSettings} sx={{borderRadius: 2}}>
        <ListItemIcon>
          <CloudUploadOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary="Import" secondary="Replace from JSON" />
        <input ref={refFileInput} type="file" accept="application/json,.json" hidden />
      </ListItemButton>
    </List>
  );
};

export default Menu;
