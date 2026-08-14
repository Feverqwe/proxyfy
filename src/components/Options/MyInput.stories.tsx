import type {Meta, StoryObj} from '@storybook/react-vite';

import MyInput from './MyInput';

const meta = {
  title: 'Options/MyInput',
  component: MyInput,
  args: {
    label: 'Proxy name',
    placeholder: 'Local proxy',
  },
} satisfies Meta<typeof MyInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Error: Story = {
  args: {
    defaultValue: 'Invalid value',
    isError: true,
  },
};

export const Disabled: Story = {
  args: {
    defaultValue: 'Disabled value',
    disabled: true,
  },
};
