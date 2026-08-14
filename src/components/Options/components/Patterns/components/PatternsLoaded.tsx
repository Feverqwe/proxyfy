import React, {FC, useCallback, useEffect, useState} from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import {Alert, Box, Button, Paper, Stack, Typography} from '@mui/material';
import {useNavigate} from 'react-router';

import {replaceProxyPatterns as replaceProxyPatternsConfig} from '../../../../../services/runtime/runtimeClient';
import {ConfigProxy, ProxyPattern} from '../../../../../tools/index';
import {ActionBox, MyButtonM, Notification} from '../../../../index';
import {localhostPresets, matchAllPresets} from '../presets';
import {addPattern, initializePatterns} from '../utils/patternListState';
import {arePatternsValid} from '../utils/validation';

import {PatternList} from './PatternList';

interface PatternsLoadedProps {
  proxy: ConfigProxy;
}

const PatternsLoaded: FC<PatternsLoadedProps> = ({proxy}) => {
  const navigate = useNavigate();
  const [whitePatterns, setWhitePatterns] = useState(() => initializePatterns(proxy.whitePatterns));
  const [blackPatterns, setBlackPatterns] = useState(() => initializePatterns(proxy.blackPatterns));
  const [notify, setNotify] = useState<{
    text: string;
    severity?: 'success' | 'error';
  } | null>(null);

  const handleNewWhite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setWhitePatterns((patterns) => addPattern(patterns));
  }, []);

  const handleNewBlack = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setBlackPatterns((patterns) => addPattern(patterns));
  }, []);

  const handleSave = useCallback(
    async (e?: React.MouseEvent, noRedirect = false) => {
      e?.preventDefault();
      if (!arePatternsValid([...whitePatterns, ...blackPatterns])) {
        setNotify({text: 'Fix invalid regular expressions before saving', severity: 'error'});
        return false;
      }

      try {
        await replaceProxyPatternsConfig(proxy.id, whitePatterns, blackPatterns);

        if (!noRedirect) {
          navigate('/');
        }
        return true;
      } catch (err) {
        console.error('Save proxy error: %O', err);
        setNotify({text: 'Failed to save patterns', severity: 'error'});
        return false;
      }
    },
    [blackPatterns, navigate, proxy.id, whitePatterns],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave(undefined, true).then((isSaved) => {
          if (isSaved) {
            setNotify({text: 'Patterns saved'});
          }
        });
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  const handleWhitelistMatchAll = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setWhitePatterns((patterns) => addPresets(patterns, matchAllPresets));
  }, []);

  const handleBlacklistLocalhost = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setBlackPatterns((patterns) => addPresets(patterns, localhostPresets));
  }, []);

  return (
    <Box component="main" sx={{maxWidth: 1040, mx: 'auto', p: 2}}>
      {notify && <Notification notify={notify} />}
      <Alert severity="info" sx={{mb: 1.5, py: 0}}>
        Used only in <b>Automatic routing</b>. Rules run from top to bottom.
      </Alert>

      <Paper variant="outlined" sx={{p: 2, mb: 1.5}}>
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
              Use this connection when…
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
              Matching URLs use “{proxy.title}”.
            </Typography>
          </Box>
          <Button
            onClick={handleWhitelistMatchAll}
            variant="outlined"
            startIcon={<AutoFixHighRoundedIcon />}
          >
            Match all URLs
          </Button>
        </Stack>
        <PatternList patterns={whitePatterns} onChange={setWhitePatterns} />
        <Button onClick={handleNewWhite} startIcon={<AddRoundedIcon />} sx={{mt: 1.5}}>
          Add “use” rule
        </Button>
      </Paper>

      <Paper variant="outlined" sx={{p: 2, mb: 1.5}}>
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
              Except when…
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
              Matching URLs skip this connection.
            </Typography>
          </Box>
          <Button
            onClick={handleBlacklistLocalhost}
            variant="outlined"
            startIcon={<AutoFixHighRoundedIcon />}
          >
            Exclude local addresses
          </Button>
        </Stack>
        <PatternList patterns={blackPatterns} onChange={setBlackPatterns} />
        <Button onClick={handleNewBlack} startIcon={<AddRoundedIcon />} sx={{mt: 1.5}}>
          Add exception
        </Button>
      </Paper>

      <Paper variant="outlined" sx={{p: 1}}>
        <ActionBox>
          <MyButtonM onClick={() => navigate('/')} color="inherit">
            Cancel
          </MyButtonM>
          <MyButtonM onClick={handleSave} variant="contained">
            Save rules
          </MyButtonM>
        </ActionBox>
      </Paper>
    </Box>
  );
};

function addPresets(
  patterns: ProxyPattern[],
  presets: Pick<ProxyPattern, 'name' | 'pattern' | 'type'>[],
): ProxyPattern[] {
  return presets.reduce((result, preset) => addPattern(result, preset), patterns);
}

export {PatternsLoaded};
