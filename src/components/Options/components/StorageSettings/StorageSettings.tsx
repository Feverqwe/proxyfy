import React, {FC, useCallback, useEffect, useState} from 'react';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import {Link} from 'react-router';

import type {ConfigStorageSettings} from '../../../../services/runtime/runtimeClient';
import {
  getConfigStorageSettings,
  setDefaultIconColor as persistDefaultIconColor,
  switchConfigStorage,
} from '../../../../services/runtime/runtimeClient';
import {Header, MyColorInput} from '../../../index';

const StorageSettings: FC = () => {
  const [storageType, setStorageType] = useState<ConfigStorageSettings['storageType']>('sync');
  const [defaultIconColor, setDefaultIconColor] = useState<string>('#0a77e5');
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const settings = await getConfigStorageSettings();
        setStorageType(settings.storageType);
        setDefaultIconColor(settings.defaultIconColor);
      } catch (err) {
        console.error('Load storage settings error: %O', err);
        setInitializationError(true);
      } finally {
        setIsInitialized(true);
      }
    };

    initialize();
  }, []);

  const handleStorageTypeChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newStorageType = event.target.value as ConfigStorageSettings['storageType'];
      setIsSaving(true);
      setSaveError(null);
      try {
        await switchConfigStorage(newStorageType);
        setStorageType(newStorageType);
      } catch (err) {
        console.error('Switch storage type error: %O', err);
        setSaveError('Could not change storage. Your previous setting is still active.');
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const handleDefaultIconColorChange = useCallback(async (color: string) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await persistDefaultIconColor(color);
      setDefaultIconColor(color);
    } catch (err) {
      console.error('Set default icon color error: %O', err);
      setSaveError('Could not save the icon color. Try again.');
    } finally {
      setIsSaving(false);
    }
  }, []);

  if (!isInitialized) {
    return (
      <Box>
        <Header title="Settings" />
        <Box sx={{display: 'grid', placeItems: 'center', py: 8}}>
          <CircularProgress size={28} aria-label="Loading preferences" />
        </Box>
      </Box>
    );
  }

  if (initializationError) {
    return (
      <Box>
        <Header title="Settings" />
        <Box sx={{maxWidth: 1040, mx: 'auto', p: 2}}>
          <Alert severity="error">Unable to load preferences. Reload the page to try again.</Alert>
        </Box>
      </Box>
    );
  }

  return (
    <>
      <Header title="Settings" />
      <Box component="main" sx={{maxWidth: 1040, mx: 'auto', p: 2}}>
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackRoundedIcon />}
          color="inherit"
          sx={{mb: 2}}
        >
          Back to connections
        </Button>
        {saveError && (
          <Alert severity="error" onClose={() => setSaveError(null)} sx={{mb: 2}}>
            {saveError}
          </Alert>
        )}
        <Paper variant="outlined" sx={{p: 2}}>
          <Grid container spacing={2.5}>
            <Grid size={{xs: 12}}>
              <FormControl component="fieldset">
                <Typography component="h2" variant="h5">
                  Storage
                </Typography>
                <FormHelperText sx={{mt: 0.75, mb: 2, ml: 0}}>
                  Credentials always stay on this device.
                </FormHelperText>
                <RadioGroup value={storageType} onChange={handleStorageTypeChange} sx={{gap: 1}}>
                  <FormControlLabel
                    value="sync"
                    disabled={isSaving}
                    control={<Radio sx={{ml: 0.5}} />}
                    sx={{
                      m: 0,
                      py: 0.25,
                      alignItems: 'flex-start',
                    }}
                    label={
                      <Box>
                        <Typography sx={{fontWeight: 700}}>Sync across Chrome</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Sync connection settings through Chrome.
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="local"
                    disabled={isSaving}
                    control={<Radio sx={{ml: 0.5}} />}
                    sx={{
                      m: 0,
                      py: 0.25,
                      alignItems: 'flex-start',
                    }}
                    label={
                      <Box>
                        <Typography sx={{fontWeight: 700}}>This device only</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Keep all connection settings in this browser profile.
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid size={{xs: 12}}>
              <Box>
                <Typography component="h2" variant="h5">
                  Icon
                </Typography>
                <FormHelperText sx={{mt: 0.75, mb: 1, ml: 0}}>
                  Used when the active route does not have its own color.
                </FormHelperText>
                <MyColorInput
                  label="Icon color"
                  defaultValue={defaultIconColor}
                  onChange={handleDefaultIconColorChange}
                  name="defaultIconColor"
                />
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </>
  );
};

export default StorageSettings;
