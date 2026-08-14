import React, {FC, useCallback, useEffect, useState} from 'react';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import {Box, Button, Checkbox, Grid, Paper, Stack} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import {Link} from 'react-router';

import {
  cloneProxy,
  moveProxy,
  removeProxy,
  setProxyEnabled,
} from '../../../../domain/proxy/configMutations';
import {updateConfig} from '../../../../services/config/configService';
import {ConfigProxy, getConfig, getId} from '../../../../tools/index';
import {ColorIcon, CopyIcon, Header, ProxySelect} from '../../../index';
import Menu from '../Menu/Menu';

const STYLE = {
  mainBox: {
    minHeight: '400px',
  },
  menu: {
    width: '250px',
  },
  colorCell: {
    width: '32px',
  },
  enabledCell: {
    width: '350px',
  },
};

const ProxyList: FC = () => {
  const [proxies, setProxies] = useState<ConfigProxy[]>([]);

  const fetchProxies = useCallback(async () => {
    try {
      const {proxies} = await getConfig();

      setProxies(proxies);
    } catch (err) {
      console.error('getConfig error: %O', err);
    }
  }, []);

  useEffect(() => {
    fetchProxies();
  }, [fetchProxies]);

  const saveChange = useCallback(
    async (change: Parameters<typeof updateConfig>[0]) => {
      await updateConfig(change);
      await fetchProxies();
    },
    [fetchProxies],
  );

  const handleProxyDelete = useCallback(
    async (proxy: ConfigProxy) => {
      await saveChange((config) => removeProxy(config, proxy.id));
    },
    [saveChange],
  );

  const handleMove = useCallback(
    async (proxy: ConfigProxy, offset: number) => {
      await saveChange((config) => moveProxy(config, proxy.id, offset));
    },
    [saveChange],
  );

  const handleEnabledChange = useCallback(
    async (isEnabled: boolean, proxy: ConfigProxy) => {
      await saveChange((config) => setProxyEnabled(config, proxy.id, isEnabled));
    },
    [saveChange],
  );

  const handleClone = useCallback(
    async (proxy: ConfigProxy) => {
      await saveChange((config) => cloneProxy(config, proxy.id, getId()));
    },
    [saveChange],
  );

  return (
    <>
      <Header title="Options" />
      <Box component={Paper} sx={{m: 2}}>
        <Grid container>
          <Grid>
            <Box sx={{m: 2}}>
              <Menu />
            </Box>
          </Grid>
          <Grid sx={{flexGrow: 1}}>
            <Box sx={{m: 2, minHeight: STYLE.mainBox.minHeight}}>
              <ProxySelect />
              <Stack>
                {proxies.map((proxy, index) => {
                  const isFirst = index === 0;
                  const isLast = index === proxies.length - 1;
                  return (
                    <ProxyItem
                      key={proxy.id}
                      proxy={proxy}
                      isFirst={isFirst}
                      isLast={isLast}
                      onDelete={handleProxyDelete}
                      onMove={handleMove}
                      onEnabledChange={handleEnabledChange}
                      onClone={handleClone}
                    />
                  );
                })}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

interface ProxyItemProps {
  proxy: ConfigProxy;
  isFirst: boolean;
  isLast: boolean;
  onDelete: (proxy: ConfigProxy) => unknown;
  onMove: (proxy: ConfigProxy, pos: number) => unknown;
  onEnabledChange: (state: boolean, proxy: ConfigProxy) => unknown;
  onClone: (proxy: ConfigProxy) => unknown;
}

const ProxyItem: FC<ProxyItemProps> = ({
  proxy,
  isFirst,
  isLast,
  onDelete,
  onMove,
  onEnabledChange,
  onClone,
}) => {
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onDelete(proxy);
    },
    [proxy, onDelete],
  );

  const handleMoveUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onMove(proxy, -1);
    },
    [proxy, onMove],
  );

  const handleMoveDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onMove(proxy, 1);
    },
    [proxy, onMove],
  );

  const handleEnabledChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onEnabledChange(e.target.checked, proxy);
    },
    [proxy, onEnabledChange],
  );

  const handleClone = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onClone(proxy);
    },
    [proxy, onClone],
  );

  return (
    <Grid container spacing={1} sx={{justifyContent: 'space-between', alignItems: 'center'}}>
      <Grid>
        <ColorIcon color={proxy.color} />
      </Grid>
      <Grid sx={{flexGrow: 1}}>{proxy.title}</Grid>
      <Grid sx={{flexGrow: 1}}>{'host' in proxy ? proxy.host : ''}</Grid>
      <Grid>
        <Grid container spacing={1} sx={{alignItems: 'center', justifyContent: 'space-around'}}>
          <Grid>
            <Checkbox
              color="primary"
              defaultChecked={proxy.enabled}
              onChange={handleEnabledChange}
            />
          </Grid>
          <Grid>
            <Button
              component={Link}
              to={`/proxy?${new URLSearchParams({
                id: proxy.id,
              }).toString()}`}
              variant="outlined"
              size="small"
              color="primary"
            >
              Edit
            </Button>
          </Grid>
          <Grid>
            <Button
              component={Link}
              to={`/patterns?${new URLSearchParams({
                id: proxy.id,
              }).toString()}`}
              variant="outlined"
              size="small"
              color="primary"
            >
              Patterns
            </Button>
          </Grid>
          <Grid>
            <IconButton onClick={handleClone} size="small">
              <CopyIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={handleDelete} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={handleMoveUp} disabled={isFirst} size="small">
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          </Grid>
          <Grid>
            <IconButton onClick={handleMoveDown} disabled={isLast} size="small">
              <ArrowDownwardIcon fontSize="small" />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProxyList;
