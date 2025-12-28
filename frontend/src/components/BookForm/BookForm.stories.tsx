import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { http, HttpResponse, delay } from 'msw'
import { BookForm } from './BookForm'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'

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
  // グローバルMSWハンドラー（handlers.ts）で検索結果が返される
  // 検索を実行すると、モックデータが表示されます
}

export const BookSelected: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
  // 書籍選択状態を表示（検索後に書籍を選択した状態）
}

export const ManualMode: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
  // 手動登録モードを表示
}

export const Loading: Story = {
  args: {
    onSuccess: fn(),
    defaultUserId: 'user-1',
  },
  parameters: {
    msw: {
      handlers: [
        // 検索APIを遅延させてローディング状態をシミュレート
        http.get(`${API_URL}/search/books`, async () => {
          await delay('infinite')
          return HttpResponse.json({ items: [] })
        }),
        http.post(`${API_URL}/search/barcode`, async () => {
          await delay('infinite')
          return HttpResponse.json({})
        }),
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
        // 検索APIでエラーを返す
        http.get(`${API_URL}/search/books`, () => {
          return HttpResponse.json(
            { message: '検索に失敗しました' },
            { status: 500 }
          )
        }),
        http.post(`${API_URL}/search/barcode`, () => {
          return HttpResponse.json(
            { message: 'バーコード検索に失敗しました' },
            { status: 500 }
          )
        }),
        http.post(`${API_URL}/books`, () => {
          return HttpResponse.json(
            { message: '書籍の登録に失敗しました' },
            { status: 500 }
          )
        }),
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

