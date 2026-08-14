import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Alert, Box, Button, Grid, Paper, Stack, Typography} from '@mui/material';
import {FORM_ERROR, FormApi} from 'final-form';
import {Form} from 'react-final-form';
import {Link, useNavigate} from 'react-router';

import {saveProxyConfig} from '../../../../../services/runtime/runtimeClient';
import {getObjectId} from '../../../../../tools/index';
import {ActionBox, Header, MyButtonM, Notification} from '../../../../index';
import {createProxyFormValues, createProxyFromForm, validateProxyForm} from '../proxyForm';
import {ProxyFormProps, ProxyFormValues} from '../types';

import BasicInfoFields from './BasicInfoFields';
import ProxySettingsFields from './ProxySettingsFields';

type SubmitAction = 'save' | 'save-and-add' | 'save-and-edit-patterns' | 'shortcut';

const ProxyForm: FC<ProxyFormProps> = ({proxy, onReset}) => {
  const navigate = useNavigate();
  const isNew = !proxy.id;
  const formRef = useRef<FormApi<ProxyFormValues> | null>(null);
  const submitActionRef = useRef<SubmitAction>('save');
  const [notify, setNotify] = useState<{text: string} | null>(null);
  const initialValues = useMemo(() => createProxyFormValues(proxy), [proxy]);

  const handleFormSubmit = useCallback(
    async (values: ProxyFormValues) => {
      try {
        const changedProxy = createProxyFromForm(proxy, values, isNew);
        await saveProxyConfig(changedProxy, isNew);

        switch (submitActionRef.current) {
          case 'save-and-edit-patterns':
            navigate(`/patterns?${new URLSearchParams({id: changedProxy.id}).toString()}`);
            break;
          case 'save-and-add':
            if (isNew) onReset();
            else navigate('/proxy');
            break;
          case 'shortcut':
            if (isNew) {
              navigate(`/proxy?${new URLSearchParams({id: changedProxy.id}).toString()}`);
            } else {
              setNotify({text: 'Saved'});
            }
            break;
          case 'save':
            navigate('/');
            break;
        }
      } catch (err) {
        console.error('Save error: %O', err);
        return {[FORM_ERROR]: 'Failed to save proxy'};
      }
    },
    [isNew, navigate, onReset, proxy],
  );

  const submit = useCallback((action: SubmitAction) => {
    submitActionRef.current = action;
    formRef.current?.submit();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's') return;

      event.preventDefault();
      submit('shortcut');
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [submit]);

  return (
    <>
      <Header title={isNew ? 'Add Proxy' : 'Edit proxy'} />
      <Box component="main" sx={{maxWidth: 980, mx: 'auto', px: {xs: 2, sm: 3}, pb: 5}}>
        <Form<ProxyFormValues>
          initialValues={initialValues}
          onSubmit={handleFormSubmit}
          validate={validateProxyForm}
        >
          {({form, handleSubmit, submitError, submitting, values}) => {
            formRef.current = form;
            return (
              <form
                onSubmit={(event) => {
                  submitActionRef.current = 'save';
                  return handleSubmit(event);
                }}
              >
                {submitError && (
                  <Alert severity="error" sx={{mb: 2}}>
                    {submitError}. Check your connection and try again.
                  </Alert>
                )}
                <Grid container spacing={2.5}>
                  <Grid size={{xs: 12, md: 6}}>
                    <Paper variant="outlined" sx={{p: {xs: 2, sm: 3}, height: '100%'}}>
                      <Typography component="h2" variant="h5">
                        Identity
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{mt: 0.5, mb: 1}}>
                        Name the connection and choose how it appears in the toolbar.
                      </Typography>
                      <BasicInfoFields isNew={isNew} />
                    </Paper>
                  </Grid>
                  <Grid size={{xs: 12, md: 6}}>
                    <Paper variant="outlined" sx={{p: {xs: 2, sm: 3}, height: '100%'}}>
                      <Typography component="h2" variant="h5">
                        Connection
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{mt: 0.5, mb: 1}}>
                        Enter the server details used when this route is active.
                      </Typography>
                      <ProxySettingsFields type={values.type} />
                    </Paper>
                  </Grid>
                  <Grid size={{xs: 12}}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        position: 'sticky',
                        bottom: 12,
                        zIndex: 2,
                        boxShadow: '0 8px 30px rgba(21,38,58,0.08)',
                      }}
                    >
                      <Stack
                        direction={{xs: 'column', sm: 'row'}}
                        spacing={1.5}
                        sx={{justifyContent: 'space-between'}}
                      >
                        <Button component={Link} to="/" color="inherit">
                          Cancel
                        </Button>
                        <ActionBox>
                          <MyButtonM
                            type="button"
                            disabled={submitting}
                            onClick={() => submit('save-and-add')}
                            variant="outlined"
                          >
                            Save & add another
                          </MyButtonM>
                          <MyButtonM
                            type="button"
                            disabled={submitting}
                            onClick={() => submit('save-and-edit-patterns')}
                            variant="outlined"
                          >
                            Save & edit patterns
                          </MyButtonM>
                          <MyButtonM
                            type="button"
                            disabled={submitting}
                            onClick={() => submit('save')}
                            variant="contained"
                          >
                            {submitting ? 'Saving…' : 'Save connection'}
                          </MyButtonM>
                        </ActionBox>
                      </Stack>
                    </Paper>
                    {/* Keep form submission accessible to keyboard and assistive technology. */}
                    <Box sx={{display: 'none'}}>
                      <MyButtonM type="submit">Save</MyButtonM>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            );
          }}
        </Form>
      </Box>
      {notify && <Notification key={getObjectId(notify)} notify={notify} />}
    </>
  );
};

export default ProxyForm;
