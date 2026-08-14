import React, {FC, useCallback, useEffect, useRef} from 'react';

import {Box, Grid, Paper} from '@mui/material';
import {Link, useNavigate} from 'react-router-dom';

import {getObjectId} from '../../../../../tools/index';
import {ActionBox, Header, MyButtonM, Notification} from '../../../../index';
import {useProxyForm} from '../hooks/useProxyForm';
import {ProxyFormProps} from '../types';

import BasicInfoFields from './BasicInfoFields';
import ProxySettingsFields from './ProxySettingsFields';

const ProxyForm: FC<ProxyFormProps> = ({proxy, onReset}) => {
  const navigate = useNavigate();
  const isNew = !proxy.id;
  const refForm = useRef<(HTMLFormElement & {elements: Record<string, HTMLInputElement>}) | null>(
    null,
  );

  const {
    type,
    isValidHost,
    isValidPort,
    notify,
    setNotify,
    addField,
    handleChangeType,
    handleSave,
    handleSaveAndEditPatterns,
    saveForm,
  } = useProxyForm({proxy, isNew, refForm});

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const {keyCode} = e;
        switch (keyCode) {
          case 83: // Ctrl+S
            e.preventDefault();
            try {
              const id = await saveForm();
              if (isNew) {
                navigate(`/proxy?${new URLSearchParams({id}).toString()}`);
              } else {
                setNotify({text: 'Saved'});
              }
            } catch (err) {
              console.error('Save error: %O', err);
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveForm, isNew, navigate, setNotify]);

  const handleSaveAndAddAnotherWithReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        await saveForm();
        if (isNew) {
          onReset();
        } else {
          navigate('/proxy');
        }
      } catch (err) {
        console.error('Save error: %O', err);
      }
    },
    [saveForm, isNew, onReset, navigate],
  );

  return (
    <>
      <Header title={isNew ? 'Add Proxy' : 'Edit proxy'} />
      <Box component={Paper} sx={{m: 2}}>
        <form ref={refForm} onSubmit={handleSubmit}>
          <Grid container>
            <Grid size={{xs: 6}}>
              <Box sx={{m: 2}}>
                <BasicInfoFields isNew={isNew} addField={addField} />
              </Box>
            </Grid>
            <Grid size={{xs: 6}}>
              <Box sx={{m: 2}}>
                <ProxySettingsFields
                  type={type}
                  isValidHost={isValidHost}
                  isValidPort={isValidPort}
                  addField={addField}
                  handleChangeType={handleChangeType}
                />
              </Box>
            </Grid>
            <Grid size={{xs: 12}}>
              <ActionBox sx={{mx: 2, mb: 2}}>
                <MyButtonM component={Link} to="/" variant="contained" color="inherit">
                  Cancel
                </MyButtonM>
                <MyButtonM
                  onClick={handleSaveAndAddAnotherWithReset}
                  variant="contained"
                  color="secondary"
                >
                  Save & Add another
                </MyButtonM>
                <MyButtonM
                  onClick={handleSaveAndEditPatterns}
                  variant="contained"
                  color="secondary"
                >
                  Save & Edit patterns
                </MyButtonM>
                <MyButtonM onClick={handleSave} variant="contained" color="primary">
                  Save
                </MyButtonM>
              </ActionBox>
            </Grid>
          </Grid>
        </form>
      </Box>
      {notify && <Notification key={getObjectId(notify)} notify={notify} />}
    </>
  );
};

export default ProxyForm;
