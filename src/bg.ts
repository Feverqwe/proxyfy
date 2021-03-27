import * as s from "superstruct";
import {Infer} from "superstruct";

type Config = Infer<typeof ConfigStruct>;
const ConfigStruct = s.type({
  mode: s.union([
    s.literal('system'),
    s.literal('auto_detect'),
    s.literal('direct'),
    s.literal('pac_script'),
  ]),
});

export type PacScript = {
  kind: 'pac_script',
  rules: {
    scheme: 'http' | 'https' | 'socks4' | 'socks5',
    protocol: null | 'http' | 'https',
    host: string,
    patterns: ({
      type: 'wildcard',
      pattern: string,
    } | {
      type: 'regexp',
      pattern: string,
    })[],
  }[],
};

type Direct = {
  kind: 'direct'
};

type AutoDetect = {
  kind: 'auto_detect'
};

type System = {
  kind: 'system'
};

type Proxy = PacScript | Direct | AutoDetect | System;

export class Bg {
  init() {

  }
}

const bg = new Bg();
bg.init();
