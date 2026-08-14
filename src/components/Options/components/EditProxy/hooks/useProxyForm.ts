import {RefObject, useCallback, useRef, useState} from 'react';

import {useNavigate} from 'react-router';

import {StorageFactory} from '../../../../../storage/index';
import {
  ConfigProxy,
  DirectProxyType,
  GenericProxyType,
  ProxyPatternType,
  assertConfig,
  getConfig,
  getId,
} from '../../../../../tools/index';
import {localhostPresets, matchAllPresets} from '../../Patterns/index';
import {noProxyTypes} from '../constants';
import {ChangedProxy, FieldType} from '../types';

interface UseProxyFormProps {
  proxy: ConfigProxy;
  isNew: boolean;
  refForm: RefObject<(HTMLFormElement & {elements: Record<string, HTMLInputElement>}) | null>;
}

export const useProxyForm = ({proxy, isNew, refForm}: UseProxyFormProps) => {
  const navigate = useNavigate();
  const [type, setType] = useState<GenericProxyType | DirectProxyType>(proxy.type);
  const [isValidHost, setValidHost] = useState(true);
  const [isValidPort, setValidPort] = useState(true);
  const [notify, setNotify] = useState<{text: string} | null>(null);

  const refFields = useRef<{name: string; type: FieldType}[]>([]);
  refFields.current = [];

  const addField = useCallback(
    (name: string, {type = FieldType.String}: {type?: FieldType} = {}) => {
      refFields.current.push({name, type});
      const props: {name: string; defaultValue?: string} = {name};
      if ([FieldType.Number, FieldType.String].includes(type) && name in proxy) {
        const value = proxy[name as keyof ConfigProxy];
        props.defaultValue = String(value);
      }
      return props;
    },
    [proxy],
  );

  const saveForm = useCallback(async () => {
    const form = refForm.current;
    if (!form) {
      throw new Error('Form is empty');
    }

    const data: Record<string, number | string | boolean> = {};
    refFields.current.forEach(({name, type}) => {
      const el = form.elements[name];
      let value;
      if (type === FieldType.String) {
        value = el.value;
      } else if (type === FieldType.Number) {
        value = parseInt(el.value, 10);
      } else if (type === FieldType.Checkbox) {
        value = el.checked;
      }
      if (value !== undefined) {
        data[name] = value;
      }
    });

    const {useMatchAllPreset, useLocalhostPreset} = data;
    delete data.useMatchAllPreset;
    delete data.useLocalhostPreset;

    if (!noProxyTypes.includes(data.type as DirectProxyType)) {
      let hasErrors = false;
      if (!data.host) {
        hasErrors = true;
        setValidHost(false);
      } else {
        setValidHost(true);
      }
      if (!data.port) {
        hasErrors = true;
        setValidPort(false);
      } else {
        setValidPort(true);
      }
      if (hasErrors) {
        throw new Error('Incorrect data');
      }

      if (!data.username) {
        delete data.password;
        delete data.username;
      }
    }

    if (!data.title) {
      if (data.type === 'direct') {
        data.title = 'Direct';
      } else {
        data.title = [data.host, data.port].join(':');
      }
    }

    const changedProxy: ChangedProxy = {...proxy, ...data};

    if (useMatchAllPreset) {
      matchAllPresets.forEach(
        (patternData: {name: string; pattern: string; type: ProxyPatternType}) => {
          changedProxy.whitePatterns.push({
            id: getId(),
            enabled: true,
            name: patternData.name,
            pattern: patternData.pattern,
            type: patternData.type,
          });
        },
      );
    }

    if (useLocalhostPreset) {
      localhostPresets.forEach(
        (patternData: {name: string; pattern: string; type: ProxyPatternType}) => {
          changedProxy.blackPatterns.push({
            id: getId(),
            enabled: true,
            name: patternData.name,
            pattern: patternData.pattern,
            type: patternData.type,
          });
        },
      );
    }

    const config = await getConfig();
    if (isNew) {
      changedProxy.id = getId();
      config.proxies.push(changedProxy as ConfigProxy);
    } else {
      const existsProxy = config.proxies.find((p) => p.id === proxy.id);
      if (!existsProxy) {
        throw new Error('Proxy is not found');
      }
      const pos = config.proxies.indexOf(existsProxy);
      config.proxies.splice(pos, 1, changedProxy as ConfigProxy);
    }
    assertConfig(config);
    const storageFactory = StorageFactory.getInstance();
    await storageFactory.initialize();
    const storageService = storageFactory.getStorageService();
    await storageService.set(config);

    return changedProxy.id;
  }, [isNew, proxy, refFields, refForm]);

  const handleChangeType = useCallback((value: string) => {
    setType(value as GenericProxyType | DirectProxyType);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await saveForm();
      navigate('/');
    } catch (err) {
      console.error('Save error: %O', err);
    }
  }, [navigate, saveForm]);

  const handleSaveAndEditPatterns = useCallback(async () => {
    try {
      const id = await saveForm();
      navigate(`/patterns?${new URLSearchParams({id}).toString()}`);
    } catch (err) {
      console.error('Save error: %O', err);
    }
  }, [navigate, saveForm]);

  const handleSaveAndAddAnother = useCallback(async () => {
    try {
      await saveForm();
      if (isNew) {
        // Reset will be handled by parent
      } else {
        navigate('/proxy');
      }
    } catch (err) {
      console.error('Save error: %O', err);
    }
  }, [navigate, isNew, saveForm]);

  return {
    type,
    isValidHost,
    isValidPort,
    notify,
    setNotify,
    addField,
    handleChangeType,
    handleSave,
    handleSaveAndEditPatterns,
    handleSaveAndAddAnother,
    saveForm,
  };
};
