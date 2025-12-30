import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { http, HttpResponse, delay } from 'msw'
import { LocationManager } from './LocationManager'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787/api'

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
        http.get(`${API_URL}/locations`, () => {
          return HttpResponse.json({ locations: [] })
        }),
      ],
    },
  },
}

export const WithLocations: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
  // グローバルMSWハンドラー（handlers.ts）で場所データが返される
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
        http.get(`${API_URL}/locations`, async () => {
          await delay('infinite')
          return HttpResponse.json({ locations: [] })
        }),
      ],
    },
  },
}

export const Editing: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
  // 編集モードを表示（場所が存在する状態で編集ボタンをクリックした状態）
}

export const Error: Story = {
  args: {
    userId: 'user-1',
    onLocationChange: fn(),
  },
  parameters: {
    msw: {
      handlers: [
        // エラーレスポンスを返す
        http.get(`${API_URL}/locations`, () => {
          return HttpResponse.json(
            { message: '場所の取得に失敗しました' },
            { status: 500 }
          )
        }),
        http.post(`${API_URL}/locations`, () => {
          return HttpResponse.json(
            { message: '場所の作成に失敗しました' },
            { status: 500 }
          )
        }),
        http.put(`${API_URL}/locations/:id`, () => {
          return HttpResponse.json(
            { message: '場所の更新に失敗しました' },
            { status: 500 }
          )
        }),
        http.delete(`${API_URL}/locations/:id`, () => {
          return HttpResponse.json(
            { message: '場所の削除に失敗しました' },
            { status: 500 }
          )
        }),
      ],
    },
  },
}

export const Interactive: Story = {
  tags: ['interactive'], // VRTでスキップするためのタグ
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

