import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { BookForm } from './BookForm'

const meta: Meta<typeof BookForm> = {
  title: 'Components/BookForm',
  component: BookForm,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    defaultUserId: {
      control: 'text',
      description: 'デフォルトのユーザーID',
    },
    onSuccess: {
      action: 'onSuccess',
      description: '書籍登録成功時のコールバック',
    },
  },
}

export default meta
type Story = StoryObj<typeof BookForm>

export const Default: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
}

export const SearchResults: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
  parameters: {
    msw: {
      handlers: [
        // MSWハンドラーはグローバル設定で既に設定済み
      ],
    },
  },
}

export const BookSelected: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
}

export const ManualMode: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
}

export const Loading: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
  parameters: {
    msw: {
      handlers: [
        // 遅延レスポンスをシミュレート
      ],
    },
  },
}

export const Error: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
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
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
  play: async ({ canvasElement }) => {
    const { within, userEvent, expect } = await import('@storybook/test')
    const canvas = within(canvasElement)
    
    // 検索モードで検索を実行
    const searchInput = canvas.getByPlaceholderText('タイトルまたは著者名を入力')
    await userEvent.type(searchInput, 'サンプル')
    
    const searchButton = canvas.getByRole('button', { name: /検索/i })
    await userEvent.click(searchButton)
    
    // 検索結果が表示されるまで待機
    await expect(canvas.findByText('サンプル書籍1')).resolves.toBeInTheDocument()
  },
}

