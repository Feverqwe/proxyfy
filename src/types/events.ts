import type {ChangeEvent} from 'react';
import type {SelectChangeEvent} from '@mui/material';
import type {DirectProxyType, GenericProxyType, ProxyPatternType} from '../tools/ConfigStruct';

export type ChromePickerColor = {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
    a?: number;
  };
};

export type ProxyMode = 'pac_script' | 'system' | 'fixed_servers' | 'direct' | 'auto_detect';
export type StorageType = 'sync' | 'local';

export type ProxySelectChangeEvent = SelectChangeEvent<string>;

export type ProxyState = {
  mode: ProxyMode;
  id?: string;
};

// Event handler types for improved type safety
export type SelectChangeEventHandler = (event: SelectChangeEvent<string>) => void;
export type InputChangeEventHandler = (event: ChangeEvent<HTMLInputElement>) => void;
export type FormSubmitEventHandler = (event: React.FormEvent<HTMLFormElement>) => void;
export type ButtonClickEventHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;

// Specific event types for UI components
export type ProxyTypeChangeEvent = ChangeEvent<{value: GenericProxyType | DirectProxyType}>;
export type PatternTypeChangeEvent = ChangeEvent<{value: ProxyPatternType}>;

// Pattern item type for callback functions
export type PatternItem = {
  enabled: boolean;
  name: string;
  type: ProxyPatternType;
  pattern: string;
};

// Menu item type for popup component
export type MenuItem = {
  id?: string;
  title: string;
  mode: string;
};
