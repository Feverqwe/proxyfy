import React from 'react';

import {
  Box,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
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
      <Divider sx={{my: 1.5}} />
      <Typography component="h2" variant="h6" sx={{mb: 0.5}}>
        Display
      </Typography>
      <Grid container columnSpacing={1.5}>
        <Grid size={{xs: 12, sm: 4}}>
          <Field<string, HTMLInputElement, ProxyFormValues> name="title">
            {({input}) => (
              <MyInput
                label="Name (optional)"
                placeholder="Office"
                helperText="Generated if left blank"
                name={input.name}
                value={input.value}
                onBlur={() => input.onBlur()}
                onFocus={() => input.onFocus()}
                onChange={(event) => input.onChange(event.target.value)}
              />
            )}
          </Field>
        </Grid>
        <Grid size={{xs: 12, sm: 3}}>
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
        </Grid>
        <Grid size={{xs: 12, sm: 2}}>
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
        </Grid>
        <Grid size={{xs: 12, sm: 3}}>
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
        </Grid>
      </Grid>
      {isNew && (
        <>
          <Divider sx={{my: 1.5}} />
          <FormControl fullWidth>
            <Typography component="h2" variant="h6" sx={{mb: 0.5}}>
              Automatic routing
            </Typography>
            <Box component={Paper} variant="outlined" sx={{px: 1, py: 0.25}}>
              <FormGroup row sx={{columnGap: 1}}>
                <FormControlLabel
                  control={
                    <Field<boolean, HTMLInputElement, ProxyFormValues>
                      name="enabled"
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
                  label="Enable"
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
                  label="All URLs"
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
                  label="Exclude local addresses"
                />
              </FormGroup>
            </Box>
          </FormControl>
        </>
      )}
    </>
  );
};

export default BasicInfoFields;
