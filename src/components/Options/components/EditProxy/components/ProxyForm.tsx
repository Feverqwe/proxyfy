import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import {Alert, Box, Button, Menu, MenuItem, Paper, Stack} from '@mui/material';
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
  const [saveMenuAnchor, setSaveMenuAnchor] = useState<HTMLElement | null>(null);
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

  const submitFromMenu = useCallback(
    (action: Extract<SubmitAction, 'save-and-add' | 'save-and-edit-patterns'>) => {
      setSaveMenuAnchor(null);
      submit(action);
    },
    [submit],
  );

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
      <Header title={isNew ? 'Add proxy' : 'Edit proxy'} />
      <Box component="main" sx={{maxWidth: 1040, mx: 'auto', p: 2}}>
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
                <Paper variant="outlined" sx={{overflow: 'hidden'}}>
                  <Box sx={{p: {xs: 1.5, sm: 2}}}>
                    <ProxySettingsFields type={values.type} />
                    <BasicInfoFields isNew={isNew} />
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid',
                      borderColor: 'divider',
                      p: 1,
                    }}
                  >
                    <Button component={Link} to="/" color="inherit">
                      Cancel
                    </Button>
                    <ActionBox>
                      <Button
                        type="button"
                        color="inherit"
                        disabled={submitting}
                        endIcon={<KeyboardArrowDownRoundedIcon />}
                        onClick={(event) => setSaveMenuAnchor(event.currentTarget)}
                        aria-controls={saveMenuAnchor ? 'save-options-menu' : undefined}
                        aria-haspopup="menu"
                        aria-expanded={saveMenuAnchor ? 'true' : undefined}
                      >
                        More
                      </Button>
                      <Menu
                        id="save-options-menu"
                        anchorEl={saveMenuAnchor}
                        open={Boolean(saveMenuAnchor)}
                        onClose={() => setSaveMenuAnchor(null)}
                      >
                        <MenuItem onClick={() => submitFromMenu('save-and-add')}>
                          Save and add another
                        </MenuItem>
                        <MenuItem onClick={() => submitFromMenu('save-and-edit-patterns')}>
                          Save and edit rules
                        </MenuItem>
                      </Menu>
                      <MyButtonM type="submit" disabled={submitting} variant="contained">
                        {submitting ? 'Saving…' : 'Save'}
                      </MyButtonM>
                    </ActionBox>
                  </Stack>
                </Paper>
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
