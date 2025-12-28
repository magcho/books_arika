import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { BarcodeScanner } from './BarcodeScanner'

const meta: Meta<typeof BarcodeScanner> = {
  title: 'Components/BarcodeScanner',
  component: BarcodeScanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof BarcodeScanner>

export const Default: Story = {
  args: {
    onScan: fn(),
    onError: fn(),
    onClose: fn(),
  },
}

export const Scanning: Story = {
  args: {
    onScan: fn(),
    onError: fn(),
    onClose: fn(),
  },
  parameters: {
    // カメラAPIをモックする設定は後で追加
  },
}

export const ManualInput: Story = {
  args: {
    onScan: fn(),
    onError: fn(),
    onClose: fn(),
  },
}

export const Interactive: Story = {
  args: {
    onScan: fn(),
    onError: fn(),
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const { within, userEvent, expect } = await import('@storybook/test')
    const canvas = within(canvasElement)
    
    // 手動入力フィールドにISBNを入力
    const input = canvas.getByPlaceholderText('ISBNを入力')
    await userEvent.type(input, '9781234567890')
    
    // 確定ボタンをクリック
    const submitButton = canvas.getByRole('button', { name: /確定/i })
    await userEvent.click(submitButton)
    
    // onScanが呼ばれたことを確認
    expect(args.onScan).toHaveBeenCalledWith('9781234567890')
  },
}

