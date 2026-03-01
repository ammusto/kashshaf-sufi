interface ToolbarProps {
  onBrowseTexts: () => void;
  onSearchHistory: () => void;
  onSavedSearches: () => void;
  onCollections: () => void;
  onHelp: () => void;
  helpActive?: boolean;
}

export function Toolbar({
  onBrowseTexts,
  onSearchHistory,
  onSavedSearches,
  onCollections,
  onHelp,
  helpActive,
}: ToolbarProps) {
  return (
    <div className="flex flex-col flex-shrink-0">
      {/* Main Toolbar */}
      <div className="h-10 flex items-center gap-2 px-3 bg-white border-b border-app-border-light">
        {/* Browse Texts Button */}
        <button
          onClick={onBrowseTexts}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                     bg-app-surface-variant text-app-text-primary hover:bg-app-accent-light
                     flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Browse Texts
        </button>

        {/* Search History Button */}
        <button
          onClick={onSearchHistory}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                     bg-app-surface-variant text-app-text-primary hover:bg-app-accent-light
                     flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History
        </button>

        {/* Saved Searches Button */}
        <button
          onClick={onSavedSearches}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                     bg-app-surface-variant text-app-text-primary hover:bg-app-accent-light
                     flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          Saved
        </button>

        {/* Collections Button */}
        <button
          onClick={onCollections}
          className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                     bg-app-surface-variant text-app-text-primary hover:bg-app-accent-light
                     flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Collections
        </button>

        {/* Help Button */}
        <button
          onClick={onHelp}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                     flex items-center gap-1.5
                     ${helpActive
              ? 'bg-app-accent text-white'
              : 'bg-app-surface-variant text-app-text-primary hover:bg-app-accent-light'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Help
        </button>

        {/* Spacer to push version badge to the right */}
        <div className="flex-1" />

        {/* Web badge */}
        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 font-medium">
          Web v{import.meta.env.VITE_APP_VERSION}
        </span>
      </div>
    </div>
  );
}
