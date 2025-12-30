/**
 * Search Bar Component
 * Provides keyword search input with real-time filtering
 */

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSearch?: (query: string) => void
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'タイトルまたは著者名で検索...',
  onSearch,
}: SearchBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    // Real-time search: call onSearch if provided
    if (onSearch) {
      onSearch(newValue)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(value)
    }
  }

  return (
    <div className="search-bar">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="search-input"
        aria-label="書籍検索"
      />
      {onSearch && (
        <button onClick={() => onSearch(value)} className="search-button" aria-label="検索">
          検索
        </button>
      )}
    </div>
  )
}
