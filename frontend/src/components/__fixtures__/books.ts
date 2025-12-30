import type { BookSearchResult } from '../../types'

export const mockBooks: BookSearchResult[] = [
  {
    isbn: '9784123456789',
    title: 'サンプル書籍1',
    author: '著者1',
    thumbnail_url: 'https://via.placeholder.com/128x180?text=Book1',
    description: 'これはサンプル書籍1の説明です。',
  },
  {
    isbn: '9784123456790',
    title: 'サンプル書籍2',
    author: '著者2',
    thumbnail_url: 'https://via.placeholder.com/128x180?text=Book2',
    description: 'これはサンプル書籍2の説明です。',
  },
  {
    isbn: '9784123456791',
    title: 'サンプル書籍3',
    author: '著者3',
    thumbnail_url: null,
    description: 'これはサンプル書籍3の説明です。',
  },
]

export const mockBook: BookSearchResult = mockBooks[0]


