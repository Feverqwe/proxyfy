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
import {StorageFactory} from '../../../../storage/StorageFactory';
import {
  StorageSettings as StorageSettingsManager,
  StorageType,
} from '../../../../storage/StorageSettings';
import Header from '../../../Header';
import MyColorInput from '../../MyColorInput';

const StorageSettings: FC = () => {
  const [storageType, setStorageType] = useState<StorageType>(StorageType.SYNC);
  const [defaultIconColor, setDefaultIconColor] = useState<string>('#0a77e5');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const storageFactory = StorageFactory.getInstance();
      await storageFactory.initialize();
      const currentType = storageFactory.getCurrentStorageType();
      setStorageType(currentType);

      const storageSettings = StorageSettingsManager.getInstance();

      const currentDefaultIconColor = storageSettings.getDefaultIconColor();
      setDefaultIconColor(currentDefaultIconColor);

      setIsInitialized(true);
    };

    initialize();
  }, []);

  const handleStorageTypeChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newStorageType = event.target.value as StorageType;
      setStorageType(newStorageType);

      const storageFactory = StorageFactory.getInstance();
      await storageFactory.switchStorageType(newStorageType);
    },
    [],
  );

  const handleDefaultIconColorChange = useCallback(async (color: string) => {
    setDefaultIconColor(color);

    const storageSettings = StorageSettingsManager.getInstance();
    await storageSettings.setDefaultIconColor(color);
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

  return (
    <>
      <Header title="Storage Settings" />
      <Box component={Paper} m={2} p={4}>
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
                  value={StorageType.SYNC}
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
                  value={StorageType.LOCAL}
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
