import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { LocationManager } from './LocationManager'

const meta: Meta<typeof LocationManager> = {
  title: 'Components/LocationManager',
  component: LocationManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    userId: {
      control: 'text',
      description: 'ユーザーID',
    },
    onLocationChange: {
      action: 'onLocationChange',
      description: '場所変更時のコールバック',
    },
  },
}

export default meta
type Story = StoryObj<typeof LocationManager>

export const Default: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: undefined,
  },
}

export const Empty: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        // 空のレスポンスを返す
      ],
    },
  },
}

export const WithLocations: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
}

export const Loading: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        // 遅延レスポンスをシミュレート
      ],
    },
  },
}

export const Editing: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
}

export const Error: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        // エラーレスポンスをシミュレート
      ],
    },
  },
}

export const Interactive: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const { within, userEvent, expect } = await import('@storybook/test')
    const canvas = within(canvasElement)
    
    // 新しい場所を追加
    const nameInput = canvas.getByLabelText(/場所名/i)
    await userEvent.type(nameInput, '新しい本棚')
    
    const submitButton = canvas.getByRole('button', { name: /追加/i })
    await userEvent.click(submitButton)
    
    // 場所が追加されたことを確認
    await expect(canvas.findByText('新しい本棚')).resolves.toBeInTheDocument()
    
    // onLocationChangeが呼ばれたことを確認
    expect(args.onLocationChange).toHaveBeenCalled()
  },
}

