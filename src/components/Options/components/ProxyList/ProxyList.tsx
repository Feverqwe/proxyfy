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
  Chip,
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
      <Box component="main" sx={{maxWidth: 1180, mx: 'auto', px: {xs: 2, sm: 3}, pb: 5}}>
        <Paper variant="outlined" sx={{display: {md: 'grid'}, gridTemplateColumns: '230px 1fr'}}>
          <Box
            component="aside"
            sx={{
              p: 2,
              borderRight: {md: '1px solid'},
              borderBottom: {xs: '1px solid', md: 0},
              borderColor: 'divider',
              '& nav': {
                display: {xs: 'grid', md: 'block'},
                gridTemplateColumns: {xs: 'repeat(2, minmax(0, 1fr))'},
                gap: {xs: 0.5, md: 0},
              },
              '& nav > .MuiDivider-root, & nav > .MuiTypography-root': {
                display: {xs: 'none', md: 'block'},
              },
              '& nav .MuiListItemIcon-root': {minWidth: {xs: 36, md: 56}},
              '& nav .MuiListItemText-secondary': {display: {xs: 'none', md: 'block'}},
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{px: 1, display: {xs: 'none', md: 'block'}}}
            >
              Workspace
            </Typography>
            <Menu />
          </Box>

          <Box sx={{p: {xs: 2, sm: 3}, minWidth: 0}}>
            <Stack
              direction={{xs: 'column', sm: 'row'}}
              spacing={2}
              sx={{
                justifyContent: 'space-between',
                alignItems: {xs: 'stretch', sm: 'flex-start'},
              }}
            >
              <Box>
                <Typography component="h2" variant="h5">
                  Proxy routes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                  Choose the active route, then enable and order connections for automatic routing.
                </Typography>
              </Box>
              <Button
                component={Link}
                to="/proxy"
                variant="contained"
                startIcon={<AddRoundedIcon />}
              >
                Add connection
              </Button>
            </Stack>

            <Box sx={{mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2.5}}>
              <Typography variant="overline" color="text.secondary">
                Active route
              </Typography>
              <Box sx={{mt: 0.5}}>
                <ProxySelect />
              </Box>
            </Box>

            <Divider sx={{my: 3}} />

            {proxies === null ? (
              <Stack spacing={1.25} aria-label="Loading connections">
                {Array.from({length: 3}).map((_, index) => (
                  <Skeleton key={index} variant="rounded" height={86} />
                ))}
              </Stack>
            ) : proxies.length === 0 ? (
              <Box sx={{py: 7, textAlign: 'center'}}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    mx: 'auto',
                    mb: 2,
                  }}
                />
                <Typography variant="h6">No connections yet</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mt: 0.75, mb: 2.5}}>
                  Add a proxy server or a direct route to get started.
                </Typography>
                <Button component={Link} to="/proxy" variant="contained">
                  Add your first connection
                </Button>
              </Box>
            ) : (
              <Stack spacing={1.25}>
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
              </Stack>
            )}
          </Box>
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
    <Paper
      component="article"
      variant="outlined"
      sx={{
        display: 'grid',
        gridTemplateColumns: {xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) auto'},
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        opacity: busy ? 0.6 : proxy.enabled ? 1 : 0.68,
        transition: 'border-color 150ms ease, opacity 150ms ease',
        '&:hover': {borderColor: 'primary.main'},
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{minWidth: 0, alignItems: 'center'}}>
        <Box sx={{position: 'relative', flex: '0 0 auto'}}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: proxy.color,
              boxShadow: 'inset 0 0 0 11px rgba(255,255,255,0.78)',
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
          <Stack direction="row" spacing={1} sx={{alignItems: 'center'}}>
            <Typography noWrap sx={{fontWeight: 700}}>
              {proxy.title}
            </Typography>
            <Chip
              label={proxy.type.toUpperCase()}
              size="small"
              variant="outlined"
              sx={{height: 22, fontSize: '0.65rem'}}
            />
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            sx={{
              mt: 0.25,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '0.76rem',
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
    </Paper>
  );
};

export default ProxyList;
