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
import {Field} from 'react-final-form';

import {MyColorInput, MyInput} from '../../../../index';
import type {ProxyFormValues} from '../types';

interface BasicInfoFieldsProps {
  isNew: boolean;
}

const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({isNew}) => {
  return (
    <>
      <Field<string, HTMLInputElement, ProxyFormValues> name="title">
        {({input}) => (
          <MyInput
            label="Title (optional)"
            placeholder="title"
            name={input.name}
            value={input.value}
            onBlur={() => input.onBlur()}
            onFocus={() => input.onFocus()}
            onChange={(event) => input.onChange(event.target.value)}
          />
        )}
      </Field>
      <Field<string, HTMLInputElement, ProxyFormValues> name="color">
        {({input}) => (
          <MyColorInput
            label="Icon color"
            iconType="logo"
            name={input.name}
            value={input.value}
            onChange={input.onChange}
          />
        )}
      </Field>
      <Field<string, HTMLInputElement, ProxyFormValues> name="badgeText">
        {({input}) => (
          <MyInput
            label="Badge text"
            name={input.name}
            value={input.value}
            onBlur={() => input.onBlur()}
            onFocus={() => input.onFocus()}
            onChange={(event) => input.onChange(event.target.value)}
          />
        )}
      </Field>
      <Field<string, HTMLInputElement, ProxyFormValues> name="badgeColor">
        {({input}) => (
          <MyColorInput
            label="Badge color"
            format="rgba"
            name={input.name}
            value={input.value}
            onChange={input.onChange}
          />
        )}
      </Field>
      {isNew && (
        <FormControl fullWidth margin="dense">
          <Typography variant="subtitle1">Pattern Shortcuts</Typography>
          <Box component={Paper} variant="outlined" sx={{p: 1}}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Field<boolean, HTMLInputElement, ProxyFormValues> name="enabled" type="checkbox">
                    {({input}) => (
                      <Checkbox
                        name={input.name}
                        checked={input.checked}
                        onChange={(event) => input.onChange(event.target.checked)}
                      />
                    )}
                  </Field>
                }
                label="Enabled"
              />
              <FormControlLabel
                control={
                  <Field<boolean, HTMLInputElement, ProxyFormValues>
                    name="useMatchAllPreset"
                    type="checkbox"
                  >
                    {({input}) => (
                      <Checkbox
                        name={input.name}
                        checked={input.checked}
                        onChange={(event) => input.onChange(event.target.checked)}
                      />
                    )}
                  </Field>
                }
                label="Add whitelist pattern to match all URLs"
              />
              <FormControlLabel
                control={
                  <Field<boolean, HTMLInputElement, ProxyFormValues>
                    name="useLocalhostPreset"
                    type="checkbox"
                  >
                    {({input}) => (
                      <Checkbox
                        name={input.name}
                        checked={input.checked}
                        onChange={(event) => input.onChange(event.target.checked)}
                      />
                    )}
                  </Field>
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
