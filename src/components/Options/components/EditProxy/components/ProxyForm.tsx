import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {Box, Grid, Paper} from '@mui/material';
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
      <Box component={Paper} sx={{m: 2}}>
        <Form<ProxyFormValues>
          initialValues={initialValues}
          onSubmit={handleFormSubmit}
          validate={validateProxyForm}
        >
          {({form, handleSubmit, submitting, values}) => {
            formRef.current = form;
            return (
              <form
                onSubmit={(event) => {
                  submitActionRef.current = 'save';
                  return handleSubmit(event);
                }}
              >
                <Grid container>
                  <Grid size={{xs: 6}}>
                    <Box sx={{m: 2}}>
                      <BasicInfoFields isNew={isNew} />
                    </Box>
                  </Grid>
                  <Grid size={{xs: 6}}>
                    <Box sx={{m: 2}}>
                      <ProxySettingsFields type={values.type} />
                    </Box>
                  </Grid>
                  <Grid size={{xs: 12}}>
                    <ActionBox sx={{mx: 2, mb: 2}}>
                      <MyButtonM component={Link} to="/" variant="contained" color="inherit">
                        Cancel
                      </MyButtonM>
                      <MyButtonM
                        type="button"
                        disabled={submitting}
                        onClick={() => submit('save-and-add')}
                        variant="contained"
                        color="secondary"
                      >
                        Save & Add another
                      </MyButtonM>
                      <MyButtonM
                        type="button"
                        disabled={submitting}
                        onClick={() => submit('save-and-edit-patterns')}
                        variant="contained"
                        color="secondary"
                      >
                        Save & Edit patterns
                      </MyButtonM>
                      <MyButtonM
                        type="button"
                        disabled={submitting}
                        onClick={() => submit('save')}
                        variant="contained"
                        color="primary"
                      >
                        Save
                      </MyButtonM>
                    </ActionBox>
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
