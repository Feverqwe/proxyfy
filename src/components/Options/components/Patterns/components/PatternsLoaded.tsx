import React, {FC, useCallback, useEffect, useState} from 'react';

import {Alert, Box, Paper, Typography} from '@mui/material';
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
  const [notify, setNotify] = useState<{text: string} | null>(null);

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
        setNotify({text: 'Fix invalid regular expressions before saving'});
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
        setNotify({text: 'Failed to save patterns'});
        return false;
      }
    },
    [blackPatterns, navigate, proxy.id, whitePatterns],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 's') {
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
    <Box>
      {notify && <Notification notify={notify} />}
      <Box component={Paper} sx={{m: 2, p: 2}}>
        <Alert severity="info" sx={{mb: 2}}>
          Proxyfy ignores everything on this page unless set to &quot;Use enabled proxies by
          patterns and order&quot;
        </Alert>

        <ActionBox>
          <MyButtonM
            onClick={handleWhitelistMatchAll}
            variant="contained"
            size="small"
            color="secondary"
          >
            Add whitelist pattern to match all URLs
          </MyButtonM>
        </ActionBox>

        <ActionBox>
          <MyButtonM
            onClick={handleBlacklistLocalhost}
            variant="contained"
            size="small"
            color="secondary"
          >
            Add black patterns to prevent this proxy being used for localhost & intranet/private IP
            addresses
          </MyButtonM>
        </ActionBox>

        <Typography variant="h5">White Patterns</Typography>
        <PatternList patterns={whitePatterns} onChange={setWhitePatterns} />

        <Typography variant="h5" sx={{mt: 4}}>
          Black Patterns
        </Typography>
        <PatternList patterns={blackPatterns} onChange={setBlackPatterns} />

        <ActionBox>
          <MyButtonM onClick={() => navigate('/')} variant="outlined" size="small">
            Cancel
          </MyButtonM>
          <MyButtonM onClick={handleNewWhite} variant="outlined" size="small">
            New White
          </MyButtonM>
          <MyButtonM onClick={handleNewBlack} variant="outlined" size="small">
            New Black
          </MyButtonM>
          <MyButtonM onClick={handleSave} variant="contained" size="small">
            Save
          </MyButtonM>
        </ActionBox>
      </Box>
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
