import ChromeSettingGetResultDetails = chrome.types.ChromeSettingGetResultDetails;
import ChromeSettingGetDetails = chrome.types.ChromeSettingGetDetails;

export const asyncResponse = (
  sendResponse: (data: unknown) => void,
  fn: () => Promise<unknown>,
) => {
  fn()
    .catch((err) => {
      console.error('asyncResponse error: %O', err);
    })
    .then(sendResponse);
  return true;
};

export async function chromeProxySettingsGet(details: ChromeSettingGetDetails) {
  return (await chrome.proxy.settings.get(details)) as unknown as ChromeSettingGetResultDetails;
}
