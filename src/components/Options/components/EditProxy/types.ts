import type {ConfigProxy, DirectProxyType, GenericProxyType} from '../../../../tools/index';

export interface ProxyFormProps {
  proxy: ConfigProxy;
  onReset: () => void;
}

export interface ProxyFormValues {
  type: GenericProxyType | DirectProxyType;
  title: string;
  color: string;
  badgeText: string;
  badgeColor: string;
  host: string;
  port: string;
  username: string;
  password: string;
  enabled: boolean;
  useMatchAllPreset: boolean;
  useLocalhostPreset: boolean;
}
