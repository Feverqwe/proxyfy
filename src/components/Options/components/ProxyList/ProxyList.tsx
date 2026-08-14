import React, {FC, useCallback, useState} from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DragIndicatorRoundedIcon from '@mui/icons-material/DragIndicatorRounded';
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

import {getProxyDropOffset} from './proxyListState';

const ProxyList: FC = () => {
  const proxies = useActualProxies();
  const [deleteTarget, setDeleteTarget] = useState<ConfigProxy | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draggedProxyId, setDraggedProxyId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    proxyId: string;
    position: ProxyDropPosition;
  } | null>(null);
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
    (proxy: ConfigProxy, offset: number) => {
      return runCommand(proxy.id, () => moveProxyConfig(proxy.id, offset));
    },
    [runCommand],
  );

  const resetDragState = useCallback(() => {
    setDraggedProxyId(null);
    setDropTarget(null);
  }, []);

  const handleDragStart = useCallback((proxy: ConfigProxy, event: React.DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', proxy.id);
    const row = event.currentTarget.closest('article') as HTMLElement | null;
    if (row) {
      const bounds = row.getBoundingClientRect();
      event.dataTransfer.setDragImage(
        row,
        Math.max(0, event.clientX - bounds.left),
        Math.max(0, event.clientY - bounds.top),
      );
    }
    setDraggedProxyId(proxy.id);
  }, []);

  const handleDragOver = useCallback(
    (proxy: ConfigProxy, event: React.DragEvent<HTMLElement>) => {
      if (!draggedProxyId || proxy.id === draggedProxyId) return;

      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const bounds = event.currentTarget.getBoundingClientRect();
      const position =
        event.clientY < bounds.top + bounds.height / 2 ? ('before' as const) : ('after' as const);
      setDropTarget((current) => {
        if (current?.proxyId === proxy.id && current?.position === position) return current;
        return {proxyId: proxy.id, position};
      });
    },
    [draggedProxyId],
  );

  const handleDrop = useCallback(
    async (proxy: ConfigProxy, event: React.DragEvent<HTMLElement>) => {
      if (!proxies || !draggedProxyId || proxy.id === draggedProxyId) return;

      event.preventDefault();
      const bounds = event.currentTarget.getBoundingClientRect();
      const position = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';
      const source = proxies.find(({id}) => id === draggedProxyId);
      const offset = getProxyDropOffset(proxies, draggedProxyId, proxy.id, position);
      resetDragState();
      if (source && offset !== 0) await handleMove(source, offset);
    },
    [draggedProxyId, handleMove, proxies, resetDragState],
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
                  isDragging={proxy.id === draggedProxyId}
                  dropPosition={dropTarget?.proxyId === proxy.id ? dropTarget?.position : undefined}
                  onDragStart={handleDragStart}
                  onDragEnd={resetDragState}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
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
  isDragging: boolean;
  dropPosition?: ProxyDropPosition;
  onDelete: (proxy: ConfigProxy) => unknown;
  onDragStart: (proxy: ConfigProxy, event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
  onDragOver: (proxy: ConfigProxy, event: React.DragEvent<HTMLElement>) => void;
  onDrop: (proxy: ConfigProxy, event: React.DragEvent<HTMLElement>) => void;
  onEnabledChange: (state: boolean, proxy: ConfigProxy) => unknown;
  onClone: (proxy: ConfigProxy) => unknown;
}

const ProxyItem: FC<ProxyItemProps> = ({
  proxy,
  position,
  isFirst,
  isLast,
  busy,
  isDragging,
  dropPosition,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onEnabledChange,
  onClone,
}) => {
  const address = proxy.type === 'direct' ? 'No proxy server' : `${proxy.host}:${proxy.port}`;

  return (
    <Box
      component="article"
      data-proxy-id={proxy.id}
      data-dragging={isDragging || undefined}
      data-drop-position={dropPosition}
      onDragOver={(event) => onDragOver(proxy, event)}
      onDrop={(event) => onDrop(proxy, event)}
      sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: {xs: 'minmax(0, 1fr)', sm: 'minmax(0, 1fr) auto'},
        alignItems: 'center',
        gap: 1,
        py: 0.75,
        px: 0.5,
        borderBottom: '1px solid',
        borderColor: 'divider',
        opacity: busy ? 0.6 : proxy.enabled ? 1 : 0.68,
        '&[data-dragging="true"]': {opacity: 0.45},
        '&[data-drop-position]::after': {
          content: '""',
          position: 'absolute',
          zIndex: 1,
          right: 4,
          left: 4,
          height: 2,
          borderRadius: 1,
          bgcolor: 'primary.main',
          pointerEvents: 'none',
        },
        '&[data-drop-position="before"]::after': {top: -1},
        '&[data-drop-position="after"]::after': {bottom: -1},
        '&:last-child': {borderBottom: 0},
        '&:hover': {bgcolor: 'action.hover'},
      }}
    >
      <Stack direction="row" spacing={1} sx={{minWidth: 0, alignItems: 'center'}}>
        <IconButton
          aria-hidden="true"
          draggable={!busy}
          disabled={busy || (isFirst && isLast)}
          size="small"
          tabIndex={-1}
          title="Drag to reorder"
          onDragStart={(event) => onDragStart(proxy, event)}
          onDragEnd={onDragEnd}
          sx={{
            flex: '0 0 auto',
            p: 0.5,
            cursor: busy ? 'default' : 'grab',
            color: 'text.disabled',
            '&:active': {cursor: busy ? 'default' : 'grabbing'},
          }}
        >
          <DragIndicatorRoundedIcon fontSize="small" />
        </IconButton>
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

type ProxyDropPosition = 'before' | 'after';

export default ProxyList;
