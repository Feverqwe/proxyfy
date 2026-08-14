import React, {FC, useCallback, useState} from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RuleRoundedIcon from '@mui/icons-material/RuleRounded';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import {Link} from 'react-router';

import {
  cloneProxyConfig,
  moveProxyConfig,
  removeProxyConfig,
  setProxyConfigEnabled,
} from '../../../../services/runtime/runtimeClient';
import {ConfigProxy, getId, getObjectId} from '../../../../tools/index';
import {CopyIcon, Header, Notification, ProxySelect, useActualProxies} from '../../../index';
import Menu from '../Menu/Menu';

const ProxyList: FC = () => {
  const proxies = useActualProxies();
  const [deleteTarget, setDeleteTarget] = useState<ConfigProxy | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notify, setNotify] = useState<{
    text: string;
    severity?: 'success' | 'error';
  } | null>(null);

  const runCommand = useCallback(async (id: string, command: () => Promise<void>) => {
    setBusyId(id);
    try {
      await command();
    } catch (err) {
      console.error('Update proxy config error: %O', err);
      setNotify({text: 'Could not update the connection. Try again.', severity: 'error'});
    } finally {
      setBusyId(null);
    }
  }, []);

  const handleProxyDelete = useCallback(async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    await runCommand(target.id, () => removeProxyConfig(target.id));
    setNotify({text: `“${target.title}” deleted`});
  }, [deleteTarget, runCommand]);

  const handleMove = useCallback(
    (proxy: ConfigProxy, offset: -1 | 1) => {
      return runCommand(proxy.id, () => moveProxyConfig(proxy.id, offset));
    },
    [runCommand],
  );

  const handleEnabledChange = useCallback(
    (isEnabled: boolean, proxy: ConfigProxy) => {
      return runCommand(proxy.id, () => setProxyConfigEnabled(proxy.id, isEnabled));
    },
    [runCommand],
  );

  const handleClone = useCallback(
    async (proxy: ConfigProxy) => {
      await runCommand(proxy.id, () => cloneProxyConfig(proxy.id, getId()));
      setNotify({text: `“${proxy.title}” duplicated`});
    },
    [runCommand],
  );

  return (
    <>
      <Header title="Connections" />
      <Box component="main" sx={{maxWidth: 1040, mx: 'auto', p: 2}}>
        <Paper variant="outlined" sx={{p: {xs: 1.5, sm: 2}, minWidth: 0}}>
          <Stack
            direction={{xs: 'column', md: 'row'}}
            spacing={1}
            sx={{justifyContent: 'space-between', alignItems: {xs: 'stretch', md: 'center'}}}
          >
            <Stack
              direction={{xs: 'column', sm: 'row'}}
              spacing={0.5}
              sx={{alignItems: {xs: 'stretch', sm: 'center'}, flex: 1, minWidth: 0}}
            >
              <Typography variant="body2" sx={{fontWeight: 600, flex: '0 0 auto'}}>
                Active:
              </Typography>
              <Box sx={{width: {xs: '100%', sm: 260}, minWidth: 0}}>
                <ProxySelect />
              </Box>
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{alignItems: 'center', flexWrap: 'wrap'}}>
              <Menu />
              <Button
                component={Link}
                to="/proxy"
                variant="contained"
                startIcon={<AddRoundedIcon />}
              >
                Add
              </Button>
            </Stack>
          </Stack>

          <Divider sx={{my: 1.5}} />

          {proxies === null ? (
            <Stack spacing={0.5} aria-label="Loading connections">
              {Array.from({length: 3}).map((_, index) => (
                <Skeleton key={index} variant="rounded" height={54} />
              ))}
            </Stack>
          ) : proxies.length === 0 ? (
            <Box sx={{py: 4, textAlign: 'center'}}>
              <Typography variant="body2" color="text.secondary">
                No connections. Click Add to create one.
              </Typography>
            </Box>
          ) : (
            <Box>
              {proxies.map((proxy, index) => (
                <ProxyItem
                  key={proxy.id}
                  proxy={proxy}
                  position={index + 1}
                  isFirst={index === 0}
                  isLast={index === proxies.length - 1}
                  busy={busyId === proxy.id}
                  onDelete={setDeleteTarget}
                  onMove={handleMove}
                  onEnabledChange={handleEnabledChange}
                  onClone={handleClone}
                />
              ))}
            </Box>
          )}
        </Paper>
      </Box>

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete connection?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            “{deleteTarget?.title}” and all of its routing patterns will be removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{p: 2}}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit">
            Keep connection
          </Button>
          <Button onClick={handleProxyDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {notify && <Notification key={getObjectId(notify)} notify={notify} />}
    </>
  );
};

interface ProxyItemProps {
  proxy: ConfigProxy;
  position: number;
  isFirst: boolean;
  isLast: boolean;
  busy: boolean;
  onDelete: (proxy: ConfigProxy) => unknown;
  onMove: (proxy: ConfigProxy, pos: -1 | 1) => unknown;
  onEnabledChange: (state: boolean, proxy: ConfigProxy) => unknown;
  onClone: (proxy: ConfigProxy) => unknown;
}

const ProxyItem: FC<ProxyItemProps> = ({
  proxy,
  position,
  isFirst,
  isLast,
  busy,
  onDelete,
  onMove,
  onEnabledChange,
  onClone,
}) => {
  const address = proxy.type === 'direct' ? 'No proxy server' : `${proxy.host}:${proxy.port}`;

  return (
    <Box
      component="article"
      sx={{
        display: 'grid',
        gridTemplateColumns: {xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) auto'},
        alignItems: 'center',
        gap: 1,
        py: 0.75,
        px: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        opacity: busy ? 0.6 : proxy.enabled ? 1 : 0.68,
        '&:last-child': {borderBottom: 0},
        '&:hover': {bgcolor: 'action.hover'},
      }}
    >
      <Stack direction="row" spacing={1} sx={{minWidth: 0, alignItems: 'center'}}>
        <Box sx={{position: 'relative', flex: '0 0 auto'}}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: proxy.color,
              boxShadow: 'inset 0 0 0 8px rgba(255,255,255,0.78)',
            }}
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
            }}
          >
            {position}
          </Typography>
        </Box>
        <Box sx={{minWidth: 0}}>
          <Stack direction="row" spacing={0.75} sx={{alignItems: 'baseline'}}>
            <Typography variant="body2" noWrap sx={{fontWeight: 600}}>
              {proxy.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {proxy.type.toUpperCase()}
            </Typography>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.7rem',
            }}
          >
            {address}
          </Typography>
        </Box>
      </Stack>

      <Stack
        direction="row"
        spacing={0.25}
        sx={{alignItems: 'center', justifyContent: 'flex-end', minWidth: 0}}
      >
        <Tooltip
          title={proxy.enabled ? 'Disable in automatic routing' : 'Enable in automatic routing'}
        >
          <Switch
            size="small"
            checked={proxy.enabled}
            disabled={busy}
            onChange={(event) => onEnabledChange(event.target.checked, proxy)}
            slotProps={{
              input: {'aria-label': `${proxy.enabled ? 'Disable' : 'Enable'} ${proxy.title}`},
            }}
          />
        </Tooltip>
        <Tooltip title="Edit connection">
          <IconButton
            component={Link}
            to={`/proxy?${new URLSearchParams({id: proxy.id})}`}
            size="small"
            aria-label={`Edit ${proxy.title}`}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Edit routing patterns">
          <IconButton
            component={Link}
            to={`/patterns?${new URLSearchParams({id: proxy.id})}`}
            size="small"
            aria-label={`Edit patterns for ${proxy.title}`}
          >
            <RuleRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Duplicate">
          <IconButton
            onClick={() => onClone(proxy)}
            disabled={busy}
            size="small"
            aria-label={`Duplicate ${proxy.title}`}
          >
            <CopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Move up">
          <span>
            <IconButton
              onClick={() => onMove(proxy, -1)}
              disabled={isFirst || busy}
              size="small"
              aria-label={`Move ${proxy.title} up`}
            >
              <ArrowUpwardRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Move down">
          <span>
            <IconButton
              onClick={() => onMove(proxy, 1)}
              disabled={isLast || busy}
              size="small"
              aria-label={`Move ${proxy.title} down`}
            >
              <ArrowDownwardRoundedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            onClick={() => onDelete(proxy)}
            disabled={busy}
            size="small"
            color="error"
            aria-label={`Delete ${proxy.title}`}
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Box>
  );
};

export default ProxyList;
