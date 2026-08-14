import {DirectProxyType} from '../../tools/index';
import type {Config, ProxyPattern} from '../../tools/index';
import {PacScript, PacScriptPattern} from '../pac/pacTypes';

export async function getPacScript(proxies: Config['proxies']): Promise<string> {
  const rules: PacScript['rules'] = [];
  proxies.forEach((proxy) => {
    if (!proxy.enabled) return;

    switch (proxy.type) {
      case DirectProxyType.Direct: {
        return rules.push({
          type: proxy.type,
          whitePatterns: getPatterns(proxy.whitePatterns),
          blackPatterns: getPatterns(proxy.blackPatterns),
        });
      }
      default: {
        return rules.push({
          type: proxy.type,
          host: proxy.host,
          port: proxy.port,
          whitePatterns: getPatterns(proxy.whitePatterns),
          blackPatterns: getPatterns(proxy.blackPatterns),
        });
      }
    }
  });

  const config: PacScript = {rules};

  const pacScript = await fetch('./pacScript.js')
    .then((r) => r.text())
    .then((t) => t.replace(/[^\x00-\x7F]/g, ''));

  return `var FindProxyForURL=null;\nvar Config=${JSON.stringify(config)};\n${pacScript};`;
}

function getPatterns(patterns: ProxyPattern[]): PacScriptPattern[] {
  const pacScriptPatterns: PacScriptPattern[] = [];

  patterns.forEach((pattern) => {
    if (!pattern.enabled) return;

    pacScriptPatterns.push({
      type: pattern.type,
      pattern: pattern.pattern,
    });
  });

  return pacScriptPatterns;
}
