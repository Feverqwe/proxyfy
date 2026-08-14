import * as v from 'valibot';

import {proxyModes} from '../../domain/proxy/proxyState';
import {ConfigSchema, ProxyPatternSchema, ProxySchema} from '../../tools/ConfigSchema';

export const RuntimeAction = {
  GetState: 'proxy.getState',
  SetProxy: 'proxy.set',
  GetConfig: 'config.get',
  GetExportConfig: 'config.getExport',
  ReplaceConfig: 'config.replace',
  SaveProxy: 'config.proxy.save',
  RemoveProxy: 'config.proxy.remove',
  MoveProxy: 'config.proxy.move',
  SetProxyEnabled: 'config.proxy.setEnabled',
  CloneProxy: 'config.proxy.clone',
  ReplaceProxyPatterns: 'config.proxy.replacePatterns',
  GetStorageSettings: 'config.storage.getSettings',
  SwitchStorage: 'config.storage.switch',
  SetDefaultIconColor: 'config.storage.setDefaultIconColor',
  StateChanged: 'proxy.stateChanged',
  ProxiesChanged: 'config.changed',
} as const;

const BackgroundRequestSchema = v.variant('action', [
  v.object({action: v.literal(RuntimeAction.GetState)}),
  v.object({
    action: v.literal(RuntimeAction.SetProxy),
    mode: v.picklist(proxyModes),
    id: v.optional(v.string()),
  }),
  v.object({action: v.literal(RuntimeAction.GetConfig)}),
  v.object({action: v.literal(RuntimeAction.GetExportConfig)}),
  v.object({
    action: v.literal(RuntimeAction.ReplaceConfig),
    config: ConfigSchema,
  }),
  v.object({
    action: v.literal(RuntimeAction.SaveProxy),
    proxy: ProxySchema,
    isNew: v.boolean(),
  }),
  v.object({action: v.literal(RuntimeAction.RemoveProxy), proxyId: v.string()}),
  v.object({
    action: v.literal(RuntimeAction.MoveProxy),
    proxyId: v.string(),
    offset: v.pipe(v.number(), v.safeInteger()),
  }),
  v.object({
    action: v.literal(RuntimeAction.SetProxyEnabled),
    proxyId: v.string(),
    enabled: v.boolean(),
  }),
  v.object({
    action: v.literal(RuntimeAction.CloneProxy),
    proxyId: v.string(),
    cloneId: v.string(),
  }),
  v.object({
    action: v.literal(RuntimeAction.ReplaceProxyPatterns),
    proxyId: v.string(),
    whitePatterns: v.array(ProxyPatternSchema),
    blackPatterns: v.array(ProxyPatternSchema),
  }),
  v.object({
    action: v.literal(RuntimeAction.GetStorageSettings),
  }),
  v.object({
    action: v.literal(RuntimeAction.SwitchStorage),
    storageType: v.picklist(['sync', 'local']),
  }),
  v.object({
    action: v.literal(RuntimeAction.SetDefaultIconColor),
    color: v.string(),
  }),
]);

export type BackgroundRequest = v.InferOutput<typeof BackgroundRequestSchema>;

const backgroundRequestActions = new Set<string>([
  RuntimeAction.GetState,
  RuntimeAction.SetProxy,
  RuntimeAction.GetConfig,
  RuntimeAction.GetExportConfig,
  RuntimeAction.ReplaceConfig,
  RuntimeAction.SaveProxy,
  RuntimeAction.RemoveProxy,
  RuntimeAction.MoveProxy,
  RuntimeAction.SetProxyEnabled,
  RuntimeAction.CloneProxy,
  RuntimeAction.ReplaceProxyPatterns,
  RuntimeAction.GetStorageSettings,
  RuntimeAction.SwitchStorage,
  RuntimeAction.SetDefaultIconColor,
]);

export function isBackgroundRequestMessage(message: unknown): boolean {
  return Boolean(
    message &&
    typeof message === 'object' &&
    'action' in message &&
    typeof message.action === 'string' &&
    backgroundRequestActions.has(message.action),
  );
}

export function parseBackgroundRequest(message: unknown): BackgroundRequest | null {
  const result = v.safeParse(BackgroundRequestSchema, message);
  return result.success ? result.output : null;
}

export function hasRuntimeAction(
  message: unknown,
  action: (typeof RuntimeAction)[keyof typeof RuntimeAction],
): boolean {
  return Boolean(
    message && typeof message === 'object' && 'action' in message && message.action === action,
  );
}
