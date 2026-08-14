import React from 'react';

import type {Preview} from '@storybook/react-vite';

import PageBase from '../src/components/PageBase/PageBase';

const preview: Preview = {
  decorators: [
    (Story) => (
      <PageBase>
        <Story />
      </PageBase>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'centered',
  },
};

export default preview;
