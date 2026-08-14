import type {DirectProxyType, GenericProxyType, ProxyPattern} from '../../tools/index';

export type PacScriptPattern = Pick<ProxyPattern, 'type' | 'pattern'>;

export type PacScript = {
  rules: (
    | {
        type: GenericProxyType;
        host: string;
        port: number;
        whitePatterns: PacScriptPattern[];
        blackPatterns: PacScriptPattern[];
      }
    | {
        type: DirectProxyType;
        whitePatterns: PacScriptPattern[];
        blackPatterns: PacScriptPattern[];
      }
  )[];
};
