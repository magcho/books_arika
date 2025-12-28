import type { Preview, Decorator } from '@storybook/react'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { initialize, mswDecorator } from 'msw-storybook-addon'
import { handlers } from '../src/components/__fixtures__/handlers'

// MSWの初期化
initialize({
  onUnhandledRequest: 'bypass',
})

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    msw: {
      handlers,
    },
  },
  decorators: [
    // MSWデコレーター（APIモック用）
    mswDecorator,
    // MemoryRouterでラップ（react-router-dom依存コンポーネント用）
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ] as Decorator[],
}

export default preview

