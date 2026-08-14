import {createFindProxyForURL} from './services/pac/pacRuntime';
import {PacScript} from './services/pac/pacTypes';

declare let FindProxyForURL: (url: string) => string;
declare let Config: PacScript | null;

FindProxyForURL = createFindProxyForURL(Config!);
Config = null;
