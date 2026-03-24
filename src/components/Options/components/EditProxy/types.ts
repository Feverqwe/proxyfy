import {ConfigProxy, ProxyPattern} from '../../../../tools/index';

export interface ChangedProxy extends Omit<ConfigProxy, 'whitePatterns' | 'blackPatterns'> {
  whitePatterns: (ProxyPattern & {id?: string})[];
  blackPatterns: (ProxyPattern & {id?: string})[];
}

export interface ProxyFormProps {
  proxy: ConfigProxy;
  onReset: () => void;
}

export enum FieldType {
  String = 'string',
  Number = 'number',
  Checkbox = 'checkbox',
}
