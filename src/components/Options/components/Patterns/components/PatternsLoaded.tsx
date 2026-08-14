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
  <Box sx={{fontSize: '0.75rem'}}>
    <Box sx={{fontWeight: 600, mb: 0.5}}>Wildcard examples</Box>
    <Box
      component="dl"
      sx={{display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '2px 10px', m: 0}}
    >
      <Box component="dt">
        <code>*</code>
      </Box>
      <Box component="dd" sx={{m: 0}}>
        Any URL
      </Box>
      <Box component="dt">
        <code>example.com</code>
      </Box>
      <Box component="dd" sx={{m: 0}}>
        Exact host
      </Box>
      <Box component="dt">
        <code>*.example.com</code>
      </Box>
      <Box component="dd" sx={{m: 0}}>
        Host and subdomains
      </Box>
      <Box component="dt">
        <code>**.example.com</code>
      </Box>
      <Box component="dd" sx={{m: 0}}>
        Subdomains only
      </Box>
      <Box component="dt">
        <code>https://*.example.com</code>
      </Box>
      <Box component="dd" sx={{m: 0}}>
        HTTPS only
      </Box>
      <Box component="dt">
        <code>?</code>
      </Box>
      <Box component="dd" sx={{m: 0}}>
        Exactly one character
      </Box>
    </Box>
    <Box sx={{mt: 1}}>
      <b>Regular expression:</b> JavaScript syntax, for example{' '}
      <code>{String.raw`^https://example\.com(?::\d+)?$`}</code>.
    </Box>
    <Box sx={{mt: 1}}>
      Separate patterns with commas or new lines. Lines starting with <code>#</code> are ignored.
    </Box>
    <Box sx={{mt: 1}}>
      Matching uses <b>scheme://host[:port]</b>. Credentials, paths, and query strings are ignored.
    </Box>
  </Box>
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
            <Tooltip
              placement="bottom-end"
              title={patternHelp}
              slotProps={{tooltip: {sx: {maxWidth: 400}}}}
            >
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
