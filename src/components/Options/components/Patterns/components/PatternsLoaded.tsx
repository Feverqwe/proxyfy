import React, {FC, useCallback, useEffect, useState} from 'react';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {Box, Button, Divider, IconButton, Paper, Stack, Tooltip, Typography} from '@mui/material';
import {useNavigate} from 'react-router';

import {replaceProxyPatterns as replaceProxyPatternsConfig} from '../../../../../services/runtime/runtimeClient';
import {ConfigProxy, ProxyPattern} from '../../../../../tools/index';
import {MyButtonM, Notification} from '../../../../index';
import {localhostPresets, matchAllPresets} from '../presets';
import {addPattern, initializePatterns} from '../utils/patternListState';
import {arePatternsValid} from '../utils/validation';

import {PatternList} from './PatternList';

interface PatternsLoadedProps {
  proxy: ConfigProxy;
}

const patternHelp = (
  <div>
    <div>Separate patterns with commas or new lines. Lines starting with # are ignored.</div>
    <div style={{marginTop: '6px'}}>
      Matching uses <b>scheme://host:port</b>. Credentials, paths, and query strings are ignored.
    </div>
  </div>
);

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
      <Paper variant="outlined" sx={{overflow: 'hidden'}}>
        <Box sx={{px: {xs: 1.5, sm: 2}, py: 1, bgcolor: 'action.hover'}}>
          <Stack direction="row" spacing={1} sx={{alignItems: 'flex-start'}}>
            <Typography variant="body2" color="text.secondary" sx={{flex: 1}}>
              Used only in <b>Automatic routing</b>. Rules are checked from top to bottom.
            </Typography>
            <Tooltip placement="bottom-end" title={patternHelp}>
              <IconButton aria-label="Pattern format help" size="small" sx={{p: 0.25}}>
                <InfoOutlinedIcon sx={{fontSize: 18}} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <RuleSection
          title={`Use “${proxy.title}” when`}
          description="A URL matches any of these rules."
          presetLabel="All URLs"
          addLabel="Add rule"
          onPreset={handleWhitelistMatchAll}
          onAdd={handleNewWhite}
        >
          <PatternList patterns={whitePatterns} onChange={setWhitePatterns} />
        </RuleSection>

        <Divider />

        <RuleSection
          title="Except when"
          description={`A matching URL skips “${proxy.title}”.`}
          presetLabel="Local addresses"
          addLabel="Add exception"
          onPreset={handleBlacklistLocalhost}
          onAdd={handleNewBlack}
        >
          <PatternList patterns={blackPatterns} onChange={setBlackPatterns} />
        </RuleSection>

        <Divider />

        <Stack
          direction="row"
          spacing={1}
          sx={{justifyContent: 'space-between', alignItems: 'center', p: 1}}
        >
          <MyButtonM onClick={() => navigate('/')} color="inherit">
            Cancel
          </MyButtonM>
          <MyButtonM onClick={handleSave} variant="contained">
            Save rules
          </MyButtonM>
        </Stack>
      </Paper>
    </Box>
  );
};

interface RuleSectionProps {
  title: string;
  description: string;
  presetLabel: string;
  addLabel: string;
  onPreset: (event: React.MouseEvent) => void;
  onAdd: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}

const RuleSection: FC<RuleSectionProps> = ({
  title,
  description,
  presetLabel,
  addLabel,
  onPreset,
  onAdd,
  children,
}) => (
  <Box component="section" sx={{p: {xs: 1.5, sm: 2}}}>
    <Stack
      direction={{xs: 'column', sm: 'row'}}
      spacing={1}
      sx={{justifyContent: 'space-between', alignItems: {xs: 'stretch', sm: 'center'}}}
    >
      <Box sx={{minWidth: 0}}>
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{mt: 0.25}}>
          {description}
        </Typography>
      </Box>
      <Stack direction="row" spacing={0.5} sx={{flexWrap: 'wrap'}}>
        <Button onClick={onPreset} color="inherit" startIcon={<AutoFixHighRoundedIcon />}>
          {presetLabel}
        </Button>
        <Button onClick={onAdd} variant="outlined" startIcon={<AddRoundedIcon />}>
          {addLabel}
        </Button>
      </Stack>
    </Stack>
    {children}
  </Box>
);

function addPresets(
  patterns: ProxyPattern[],
  presets: Pick<ProxyPattern, 'name' | 'pattern' | 'type'>[],
): ProxyPattern[] {
  return presets.reduce((result, preset) => addPattern(result, preset), patterns);
}

export {PatternsLoaded};
