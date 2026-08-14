import React, {FC, useCallback, useEffect, useState} from 'react';

import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';

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
      try {
        await switchConfigStorage(newStorageType);
        setStorageType(newStorageType);
      } catch (err) {
        console.error('Switch storage type error: %O', err);
      }
    },
    [],
  );

  const handleDefaultIconColorChange = useCallback(async (color: string) => {
    try {
      await persistDefaultIconColor(color);
      setDefaultIconColor(color);
    } catch (err) {
      console.error('Set default icon color error: %O', err);
    }
  }, []);

  if (!isInitialized) {
    return (
      <Box>
        <Header title="Storage Settings" />
        <Paper sx={{p: 2}}>
          <Typography>Loading...</Typography>
        </Paper>
      </Box>
    );
  }

  if (initializationError) {
    return (
      <Box>
        <Header title="Storage Settings" />
        <Paper sx={{p: 2}}>
          <Typography color="error">Unable to load storage settings</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <>
      <Header title="Storage Settings" />
      <Box component={Paper} sx={{m: 2, p: 4}}>
        <Grid container>
          <Grid component="div">
            <FormControl component="fieldset">
              <Typography variant="h6" gutterBottom>
                Storage Type
              </Typography>
              <FormHelperText sx={{mb: 2}}>
                Choose where to store your proxy configurations
              </FormHelperText>
              <RadioGroup value={storageType} onChange={handleStorageTypeChange}>
                <FormControlLabel
                  value="sync"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Sync Storage</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Settings will be synchronized across your Chrome browsers
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="local"
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">Local Storage</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Settings will be stored only on this device
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>

              <Box sx={{mt: 3}}>
                <Typography variant="h6" gutterBottom>
                  Default Icon Color
                </Typography>
                <FormHelperText sx={{mb: 2}}>
                  Choose the default color for extension icons when no proxy-specific color is set
                </FormHelperText>
                <MyColorInput
                  label=""
                  defaultValue={defaultIconColor}
                  onChange={handleDefaultIconColorChange}
                  name="defaultIconColor"
                />
              </Box>
            </FormControl>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default StorageSettings;
