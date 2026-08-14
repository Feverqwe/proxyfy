import ChromeSettingGetDetails = chrome.types.ChromeSettingGetDetails;

export const asyncResponse = (
  sendResponse: (data: unknown) => void,
  fn: () => Promise<unknown>,
) => {
  fn().then(sendResponse, (err) => {
    console.error('asyncResponse error: %O', err);
    sendResponse({
      error: err instanceof Error ? err.message : String(err),
    });
  });
  return true;
};

export function throwIfResponseError(response: unknown): void {
  if (
    response &&
    typeof response === 'object' &&
    'error' in response &&
    typeof response.error === 'string'
  ) {
    throw new Error(response.error);
  }
}

export async function chromeProxySettingsGet(details: ChromeSettingGetDetails) {
  return await chrome.proxy.settings.get(details);
}
