import React, {FC, useCallback, useEffect, useRef} from 'react';

import CloudDownloadOutlinedIcon from '@mui/icons-material/CloudDownloadOutlined';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import {List, ListItemButton, ListItemIcon, ListItemText} from '@mui/material';
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
    <List
      component="nav"
      aria-label="Connection settings"
      disablePadding
      sx={{
        display: 'flex',
        width: 'auto',
        flexWrap: 'wrap',
        gap: 0.25,
        '& .MuiListItemButton-root': {px: 1, py: 0.5},
        '& .MuiListItemIcon-root': {minWidth: 28},
        '& .MuiListItemText-primary': {fontSize: '0.82rem'},
        '& .MuiSvgIcon-root': {fontSize: 18},
      }}
    >
      <ListItemButton component={Link} to="/storage" sx={{borderRadius: 1, flex: '0 0 auto'}}>
        <ListItemIcon>
          <SettingsIcon />
        </ListItemIcon>
        <ListItemText primary="Settings" />
      </ListItemButton>
      <ListItemButton onClick={handleExportSettings} sx={{borderRadius: 1, flex: '0 0 auto'}}>
        <ListItemIcon>
          <CloudDownloadOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary="Export" />
      </ListItemButton>
      <ListItemButton onClick={handleImportSettings} sx={{borderRadius: 1, flex: '0 0 auto'}}>
        <ListItemIcon>
          <CloudUploadOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary="Import" />
        <input ref={refFileInput} type="file" accept="application/json,.json" hidden />
      </ListItemButton>
    </List>
  );
};

export default Menu;
