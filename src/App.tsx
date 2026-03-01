import { useState, useEffect, useCallback } from 'react';
import type { SearchHistoryEntry, SavedSearchEntry, Announcement } from './types';
import type { AppSearchMode, CombinedSearchQuery, ProximitySearchQuery } from './types/search';
import type { Collection } from './types/collections';
import { MAX_RESULTS } from './constants/search';
import { useSearchTabsContext } from './contexts/SearchTabsContext';
import { useOperatingMode } from './contexts/OperatingModeContext';
import { BooksProvider } from './contexts/BooksContext';
import { useSearch } from './hooks/useSearch';
import { useReaderNavigation } from './hooks/useReaderNavigation';
import { Sidebar } from './components/Sidebar';
import { ReaderPanel, ResultsPanel, HelpPanel } from './components/panels';
import { DraggableSplitter } from './components/ui';
import {
  TextSelectionModal,
  MetadataBrowser,
  SavedSearchesModal,
  SearchHistoryModal,
  AnnouncementsModal,
  CollectionsModal,
  SaveCollectionModal,
  type TextSelectionMode,
} from './components/modals';
import { Toolbar } from './components/Toolbar';
import { SearchTabs, type TabData } from './components/SearchTabs';
import type { NameFormData } from './utils/namePatterns';
import { createEmptyNameForm } from './utils/namePatterns';
import { getEligibleAnnouncements } from './utils/announcements';
import { markMultipleAnnouncementsDismissed, setSkipAnnouncementPopups } from './utils/storage';
import {
  getCollections,
  createCollection,
  updateCollectionBooks,
} from './utils/collections';

function App() {
  // Operating mode context
  const { loading: modeLoading, api } = useOperatingMode();

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);
  const [announcementsChecked, setAnnouncementsChecked] = useState(false);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Tab-based state from context
  const {
    tabs,
    activeTabId,
    activeTab,
    setActiveTabId,
    closeTab,
  } = useSearchTabsContext();

  // App-level search mode (terms, names)
  const [appSearchMode, setAppSearchMode] = useState<AppSearchMode>('terms');

  // Name search form state (kept in App for sidebar)
  const [nameFormData, setNameFormData] = useState<NameFormData[]>([createEmptyNameForm('form-0')]);
  const [generatedPatterns, setGeneratedPatterns] = useState<string[][]>([]);

  const [selectedBookIds, setSelectedBookIds] = useState<Set<number>>(new Set());

  const [splitterRatio, setSplitterRatio] = useState(() => {
    const saved = localStorage.getItem('splitterRatio');
    return saved ? parseFloat(saved) : 0.6;
  });

  const [textSelectionModalOpen, setTextSelectionModalOpen] = useState(false);
  const [textBrowserOpen, setTextBrowserOpen] = useState(false);
  const [searchHistoryModalOpen, setSearchHistoryModalOpen] = useState(false);
  const [savedSearchesModalOpen, setSavedSearchesModalOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Collections state
  const [collectionsModalOpen, setCollectionsModalOpen] = useState(false);
  const [saveCollectionModalOpen, setSaveCollectionModalOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [textSelectionMode, setTextSelectionMode] = useState<TextSelectionMode>('select');
  const [editingCollection, setEditingCollection] = useState<Collection | undefined>(undefined);

  // Reader navigation hook
  const { handleNavigatePage, loadResultIntoTab } = useReaderNavigation({ api });

  // Use search hook with selected book IDs and loadResultIntoTab
  const {
    handleSearch,
    handleProximitySearch,
    handleNameSearch: handleNameSearchFromHook,
    handleLoadMore,
    handleExportResults,
    handleResultClick,
  } = useSearch({ selectedBookIds, loadResultIntoTab, api });

  // Wrap name search to update generated patterns
  const handleNameSearch = useCallback(async () => {
    const { displayPatterns } = await handleNameSearchFromHook(nameFormData);
    setGeneratedPatterns(displayPatterns);
  }, [handleNameSearchFromHook, nameFormData]);

  useEffect(() => {
    localStorage.setItem('splitterRatio', splitterRatio.toString());
  }, [splitterRatio]);

  // Prepare tab data for SearchTabs component
  const tabData: TabData[] = tabs.map(tab => ({
    id: tab.id,
    label: tab.label,
    fullQuery: tab.fullQuery,
  }));

  // Check and show announcements
  const checkAndShowAnnouncements = useCallback(async () => {
    if (announcementsChecked) return;

    try {
      const appVersion = '1.0.0';
      const eligible = await getEligibleAnnouncements(appVersion);
      setAnnouncementsChecked(true);

      if (eligible.length > 0) {
        setAnnouncements(eligible);
        setShowAnnouncementsModal(true);
      }
    } catch (err) {
      console.error('Failed to check announcements:', err);
      setAnnouncementsChecked(true);
    }
  }, [announcementsChecked]);

  // Handle announcements modal dismiss
  const handleAnnouncementsDismiss = useCallback(async (skipFuturePopups: boolean, dismissedIds: string[]) => {
    try {
      // Save skip preference
      if (skipFuturePopups) {
        await setSkipAnnouncementPopups(true);
      }

      // Mark announcements as dismissed
      if (dismissedIds.length > 0) {
        await markMultipleAnnouncementsDismissed(dismissedIds);
      }
    } catch (err) {
      console.error('Failed to save announcement preferences:', err);
    }

    setShowAnnouncementsModal(false);
    setAnnouncements([]);
  }, []);

  // Check for announcements when ready
  useEffect(() => {
    if (modeLoading) return;
    if (announcementsChecked) return;

    checkAndShowAnnouncements();
  }, [modeLoading, announcementsChecked, checkAndShowAnnouncements]);

  // Handle loading a search from history or saved searches
  const handleLoadSearch = useCallback(async (search: SearchHistoryEntry | SavedSearchEntry) => {
    try {
      // Parse query data
      const queryData = JSON.parse(search.query_data);

      // Restore book filter if present
      if (search.book_ids) {
        const bookIds = JSON.parse(search.book_ids) as number[];
        setSelectedBookIds(new Set(bookIds));
      } else {
        setSelectedBookIds(new Set());
      }

      // Execute the appropriate search based on type
      if (search.search_type === 'boolean' && queryData.type === 'boolean') {
        const combined: CombinedSearchQuery = {
          andInputs: queryData.andInputs || [],
          orInputs: queryData.orInputs || [],
        };
        setAppSearchMode('terms');
        handleSearch(combined);
      } else if (search.search_type === 'proximity' && queryData.type === 'proximity') {
        const query: ProximitySearchQuery = {
          term1: queryData.term1,
          field1: queryData.field1,
          term2: queryData.term2,
          field2: queryData.field2,
          distance: queryData.distance,
        };
        setAppSearchMode('terms');
        handleProximitySearch(query);
      } else if (search.search_type === 'name' && queryData.type === 'name') {
        if (queryData.forms && Array.isArray(queryData.forms)) {
          setNameFormData(queryData.forms);
          setAppSearchMode('names');
          // Wait a tick for state to update, then search
          setTimeout(() => {
            handleNameSearch();
          }, 0);
        }
      }
    } catch (err) {
      console.error('Failed to load search:', err);
    }
  }, [handleSearch, handleProximitySearch, handleNameSearch]);

  const loadCollections = useCallback(async () => {
    try {
      const loaded = await getCollections();
      setCollections(loaded);
    } catch (err) {
      console.error('Failed to load collections:', err);
    }
  }, []);

  // Load collections on mount
  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  // Handle opening save collection modal
  const handleOpenSaveCollectionModal = useCallback(() => {
    setSaveCollectionModalOpen(true);
  }, []);

  // Handle saving a new collection
  const handleSaveCollection = useCallback(async (name: string, description: string | null) => {
    await createCollection(name, Array.from(selectedBookIds), description ?? undefined);
    await loadCollections();
  }, [selectedBookIds, loadCollections]);

  // Handle opening collections modal
  const handleOpenCollectionsModal = useCallback(() => {
    setCollectionsModalOpen(true);
  }, []);

  // Handle editing a collection (opens TextSelectionModal in edit mode)
  const handleEditCollection = useCallback((collection: Collection) => {
    setEditingCollection(collection);
    setSelectedBookIds(new Set(collection.book_ids));
    setTextSelectionMode('edit-collection');
    setTextSelectionModalOpen(true);
  }, []);

  // Handle creating a new collection from CollectionsModal
  const handleCreateCollectionFromModal = useCallback(() => {
    setTextSelectionMode('create-collection');
    setSelectedBookIds(new Set());
    setTextSelectionModalOpen(true);
  }, []);

  // Handle updating collection books
  const handleUpdateCollectionBooks = useCallback(async (id: number, bookIds: number[]) => {
    await updateCollectionBooks(id, bookIds);
    await loadCollections();
  }, [loadCollections]);

  // Handle closing TextSelectionModal - reset mode
  const handleCloseTextSelectionModal = useCallback(() => {
    setTextSelectionModalOpen(false);
    setTextSelectionMode('select');
    setEditingCollection(undefined);
  }, []);

  // Show loading screen while initializing
  if (modeLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-app-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-app-accent mx-auto mb-4"></div>
          <p className="text-app-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Main app content wrapped in BooksProvider
  return (
    <BooksProvider api={api}>
      <div className="h-screen w-screen flex flex-col bg-app-bg overflow-hidden">
        {/* Top Menu Bar */}
        <Toolbar
          onBrowseTexts={() => setTextBrowserOpen(true)}
          onSearchHistory={() => setSearchHistoryModalOpen(true)}
          onSavedSearches={() => setSavedSearchesModalOpen(true)}
          onCollections={handleOpenCollectionsModal}
          onHelp={() => setHelpOpen(!helpOpen)}
          helpActive={helpOpen}
        />

        <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onSearch={handleSearch}
          onProximitySearch={handleProximitySearch}
          onNameSearch={handleNameSearch}
          onOpenTextSelection={() => {
            setTextSelectionMode('select');
            setTextSelectionModalOpen(true);
          }}
          onSaveCollection={selectedBookIds.size > 0 ? handleOpenSaveCollectionModal : undefined}
          loading={activeTab?.loading ?? false}
          indexedPages={0}
          selectedTextsCount={selectedBookIds.size}
          appSearchMode={appSearchMode}
          onAppSearchModeChange={setAppSearchMode}
          nameFormData={nameFormData}
          onNameFormDataChange={setNameFormData}
          generatedPatterns={generatedPatterns}
        />

        <div className="flex-1 flex flex-col overflow-hidden p-4">
          {helpOpen ? (
            /* Help Panel - replaces normal content when active */
            <div className="flex-1 overflow-hidden rounded-xl shadow-app-md">
              <HelpPanel onClose={() => setHelpOpen(false)} />
            </div>
          ) : (
            /* Normal Search Interface */
            <>
              {/* Tab Bar */}
              <SearchTabs
                tabs={tabData}
                activeTabId={activeTabId}
                onTabClick={setActiveTabId}
                onTabClose={closeTab}
              />

              <div style={{ flex: splitterRatio }} className="overflow-hidden shadow-app-md bg-white mb-3 rounded-b-xl">
                <ReaderPanel
                  currentPage={activeTab?.currentPage ?? null}
                  tokens={activeTab?.pageTokens ?? []}
                  onNavigate={handleNavigatePage}
                  matchedTokenIndices={activeTab?.matchedTokenIndices ?? []}
                />
              </div>

              <DraggableSplitter ratio={splitterRatio} onDrag={setSplitterRatio} />

              <div style={{ flex: 1 - splitterRatio }} className="overflow-hidden rounded-xl shadow-app-md">
                <ResultsPanel
                  results={activeTab?.searchResults ?? null}
                  onResultClick={handleResultClick}
                  onLoadMore={handleLoadMore}
                  onExport={handleExportResults}
                  loading={activeTab?.loading ?? false}
                  loadingMore={activeTab?.loadingMore ?? false}
                  errorMessage={activeTab?.errorMessage ?? ''}
                  maxResults={MAX_RESULTS}
                />
              </div>
            </>
          )}
        </div>
        </div>

        {textSelectionModalOpen && (
          <TextSelectionModal
            onClose={handleCloseTextSelectionModal}
            selectedBookIds={selectedBookIds}
            onSelectionChange={setSelectedBookIds}
            mode={textSelectionMode}
            editingCollection={editingCollection}
            collections={collections}
            onSaveCollection={handleOpenSaveCollectionModal}
            onUpdateCollection={handleUpdateCollectionBooks}
          />
        )}

        {textBrowserOpen && (
          <MetadataBrowser onClose={() => setTextBrowserOpen(false)} />
        )}

        <SearchHistoryModal
          isOpen={searchHistoryModalOpen}
          onClose={() => setSearchHistoryModalOpen(false)}
          onLoadSearch={handleLoadSearch}
        />

        <SavedSearchesModal
          isOpen={savedSearchesModalOpen}
          onClose={() => setSavedSearchesModalOpen(false)}
          onLoadSearch={handleLoadSearch}
        />

        {showAnnouncementsModal && announcements.length > 0 && (
          <AnnouncementsModal
            announcements={announcements}
            onDismiss={handleAnnouncementsDismiss}
          />
        )}

        {/* Collections Modal */}
        <CollectionsModal
          isOpen={collectionsModalOpen}
          onClose={() => setCollectionsModalOpen(false)}
          onEditCollection={handleEditCollection}
          onCreateCollection={handleCreateCollectionFromModal}
        />

        {/* Save Collection Modal */}
        <SaveCollectionModal
          isOpen={saveCollectionModalOpen}
          onClose={() => setSaveCollectionModalOpen(false)}
          onSave={handleSaveCollection}
          existingNames={collections.map(c => c.name)}
        />
      </div>
    </BooksProvider>
  );
}

export default App;
