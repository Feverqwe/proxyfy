import React from 'react';

import type {Meta, StoryObj} from '@storybook/react-vite';
import {MemoryRouter} from 'react-router';

import {configureChromeMock} from '../../../.storybook/chromeMock';

import Options from './Options';

interface OptionsPageProps {
  route: string;
  storageSettingsPending?: boolean;
}

const OptionsPage = ({route, storageSettingsPending}: OptionsPageProps) => {
  configureChromeMock({storageSettingsPending});
  return (
    <MemoryRouter key={route} initialEntries={[route]}>
      <Options />
    </MemoryRouter>
  );
};

const meta = {
  title: 'Pages/Options',
  component: OptionsPage,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    route: {control: false},
  },
} satisfies Meta<typeof OptionsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProxyList: Story = {
  args: {route: '/'},
};

export const AddProxy: Story = {
  args: {route: '/proxy'},
};

export const EditProxy: Story = {
  args: {route: '/proxy?id=office'},
};

export const Patterns: Story = {
  args: {route: '/patterns?id=office'},
};

export const StorageSettings: Story = {
  args: {route: '/storage'},
};

export const StorageSettingsLoading: Story = {
  args: {route: '/storage', storageSettingsPending: true},
};
