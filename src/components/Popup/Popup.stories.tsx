import React from 'react';

import type {Meta, StoryObj} from '@storybook/react-vite';

import {configureChromeMock} from '../../../.storybook/chromeMock';
import type {ProxyState} from '../../types/index';

import Popup from './Popup';

const PopupPage = (state: ProxyState) => {
  configureChromeMock({state});
  return <Popup />;
};

const meta = {
  title: 'Pages/Popup',
  component: Popup,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Popup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AutomaticRouting: Story = {
  render: () => <PopupPage mode="pac_script" />,
};

export const SelectedProxy: Story = {
  render: () => <PopupPage mode="fixed_servers" id="office" />,
};

export const SystemSettings: Story = {
  render: () => <PopupPage mode="system" />,
};
