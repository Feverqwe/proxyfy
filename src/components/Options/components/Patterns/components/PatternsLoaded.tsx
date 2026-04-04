import React, {FC, useCallback, useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router';
import {Alert, Box, Paper, Typography} from '@mui/material';
import {ConfigProxy, ConfigStruct, getConfig} from '../../../../../tools/index';
import {StorageFactory} from '../../../../../storage/index';
import {ActionBox, MyButtonM, Notification} from '../../../../index';
import {PatternList, PatternListHandler} from './PatternList';
import {localhostPresets, matchAllPresets} from '../presets';

interface PatternsLoadedProps {
  proxy: ConfigProxy;
}

const PatternsLoaded: FC<PatternsLoadedProps> = ({proxy}) => {
  const navigate = useNavigate();
  const refWhiteRules = useRef<PatternListHandler | null>(null);
  const refBlackRules = useRef<PatternListHandler | null>(null);
  const [notify, setNotify] = useState<{text: string} | null>(null);

  const handleNewWhite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    refWhiteRules.current?.addRule();
  }, []);

  const handleNewBlack = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    refBlackRules.current?.addRule();
  }, []);

  const handleSave = useCallback(
    async (e?: React.MouseEvent, noRedirect = false) => {
      e?.preventDefault();
      const whitePatterns = refWhiteRules.current?.getPatterns() || [];
      const blackPatterns = refBlackRules.current?.getPatterns() || [];

      try {
        const config = await getConfig();
        const existsProxy = config.proxies.find((p) => p.id === proxy.id);
        if (!existsProxy) {
          throw new Error('Proxy is not found');
        }

        existsProxy.whitePatterns = whitePatterns;
        existsProxy.blackPatterns = blackPatterns;
        const _ = ConfigStruct.assert(config);
        const storageFactory = StorageFactory.getInstance();
        await storageFactory.initialize();
        const storageService = storageFactory.getStorageService();
        await storageService.set(config);

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
    [proxy.id, navigate],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave(undefined, true).then((isSaved) => {
          isSaved && setNotify({text: 'Patterns saved'});
        });
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleSave]);

  const handleWhitelistMatchAll = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    matchAllPresets.forEach(({name, pattern, type}) => {
      refWhiteRules.current?.addRule(name, pattern, type);
    });
  }, []);

  const handleBlacklistLocalhost = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    localhostPresets.forEach(({name, pattern, type}) => {
      refBlackRules.current?.addRule(name, pattern, type);
    });
  }, []);

  return (
    <Box>
      {notify && <Notification notify={notify} />}
      <Box component={Paper} m={2} p={2}>
        <Alert severity="info" sx={{mb: 2}}>
          Proxyfy ignores everything on this page unless set to "Use enabled proxies by patterns and
          order"
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
            Add black patterns to prevent this proxy being used for localhost & intranet/private
            IP addresses
          </MyButtonM>
        </ActionBox>

        <Typography variant="h5">White Patterns</Typography>
        <PatternList ref={refWhiteRules} list={proxy.whitePatterns} />

        <Typography variant="h5" sx={{mt: 4}}>
          Black Patterns
        </Typography>
        <PatternList ref={refBlackRules} list={proxy.blackPatterns} />

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

export {PatternsLoaded};
