import React from 'react';

import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  Paper,
  Typography,
} from '@mui/material';

import {MyColorInput, MyInput} from '../../../../index';
import {FieldType} from '../types';

interface BasicInfoFieldsProps {
  isNew: boolean;
  addField: (name: string, options?: {type?: FieldType}) => {name: string; defaultValue?: string};
}

const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({isNew, addField}) => {
  return (
    <>
      <MyInput label="Title (optional)" placeholder="title" {...addField('title')} />
      <MyColorInput label="Icon color" iconType="logo" {...addField('color')} />
      <MyInput label="Badge text" {...addField('badgeText')} />
      <MyColorInput label="Badge color" format="rgba" {...addField('badgeColor')} />
      {isNew && (
        <FormControl fullWidth margin="dense">
          <Typography variant="subtitle1">Pattern Shortcuts</Typography>
          <Box component={Paper} variant="outlined" sx={{p: 1}}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked={true}
                    {...addField('enabled', {type: FieldType.Checkbox})}
                  />
                }
                label="Enabled"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked={true}
                    {...addField('useMatchAllPreset', {type: FieldType.Checkbox})}
                  />
                }
                label="Add whitelist pattern to match all URLs"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    defaultChecked={false}
                    {...addField('useLocalhostPreset', {type: FieldType.Checkbox})}
                  />
                }
                label="Do not use for localhost and intranet/private IP addresses"
              />
            </FormGroup>
          </Box>
        </FormControl>
      )}
    </>
  );
};

export default BasicInfoFields;
