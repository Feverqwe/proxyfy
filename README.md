# Proxyfy

Proxyfy is a compact Chrome extension for switching proxy routes. It supports individual proxy
connections, system and direct modes, and rule-based automatic routing through a generated PAC
script.

## Features

- Switch routes from the toolbar popup without opening Chrome settings.
- Configure HTTP, HTTPS, SOCKS4, SOCKS5, QUIC, and direct connections.
- Route requests automatically with ordered wildcard or regular-expression rules.
- Add exceptions for hosts that should skip a matching connection.
- Reorder, enable, duplicate, import, and export connection profiles.
- Customize the extension icon and badge for each connection.
- Store public configuration in Chrome sync or only in the current browser profile.
- Keep proxy credentials in local storage and exclude them from exported configuration.

## Using Proxyfy

Create and manage connections on the extension options page. The toolbar popup provides quick
access to:

- **Automatic routing** — applies enabled connections and their rules in list order.
- **System settings** — returns proxy handling to the operating system.
- **Configured connections** — activates one connection for all requests.

Automatic routing checks connections from top to bottom and uses the first matching rule. If no
rule matches, the request goes directly to its destination. Each connection can contain inclusion
rules and exceptions. Rules may be wildcards or JavaScript regular expressions and are matched
against `scheme://host[:port]`; URL paths, query strings, and credentials are ignored.
