import React, { useState, useEffect } from 'react';
import {
  Extension,
  ExtensionCategory,
  InstalledExtension,
  ExtensionUpdate,
  ExtensionReview,
} from '../../types';

type StoreTab = 'marketplace' | 'installed' | 'updates' | 'my-extensions';

interface ExtensionDetailsModalProps {
  extension: Extension;
  onClose: () => void;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
}

const ExtensionDetailsModal: React.FC<ExtensionDetailsModalProps> = ({
  extension,
  onClose,
  onInstall,
  onUninstall,
}) => {
  const [reviews, setReviews] = useState<ExtensionReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadReviews();
  }, [extension.id]);

  const loadReviews = async () => {
    const result = await window.api.extensionGetReviews(extension.id);
    if (result.success && result.reviews) {
      setReviews(result.reviews);
    }
  };

  const handleSubmitReview = async () => {
    const result = await window.api.extensionSubmitReview(
      extension.id,
      newRating,
      newComment
    );
    if (result.success) {
      setShowReviewForm(false);
      setNewComment('');
      setNewRating(5);
      loadReviews();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">{extension.name}</h2>
              <p className="text-gray-400">
                by {extension.author} • v{extension.version}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Rating</div>
              <div className="text-xl font-bold text-white">
                ★ {extension.rating.toFixed(1)}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Downloads</div>
              <div className="text-xl font-bold text-white">
                {extension.downloads.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Type</div>
              <div className="text-xl font-bold text-white capitalize">
                {extension.type}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
            <p className="text-gray-300">{extension.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Category:</span>{' '}
                <span className="text-white capitalize">{extension.category}</span>
              </div>
              <div>
                <span className="text-gray-400">License:</span>{' '}
                <span className="text-white capitalize">{extension.licenseType}</span>
                {extension.price && (
                  <span className="text-green-400"> (${extension.price})</span>
                )}
              </div>
              <div>
                <span className="text-gray-400">Size:</span>{' '}
                <span className="text-white">
                  {(extension.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div>
                <span className="text-gray-400">Last Updated:</span>{' '}
                <span className="text-white">
                  {new Date(extension.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {extension.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {extension.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-white">Reviews</h3>
              {extension.installed && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Write Review
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="mb-4 p-4 bg-gray-700 rounded">
                <div className="mb-3">
                  <label className="block text-sm text-gray-300 mb-1">Rating</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="w-full p-2 bg-gray-600 text-white rounded"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {'★'.repeat(rating)} {rating}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm text-gray-300 mb-1">Comment</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-2 bg-gray-600 text-white rounded h-24"
                    placeholder="Share your experience with this extension..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitReview}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Submit Review
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setNewComment('');
                      setNewRating(5);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-gray-400 text-center py-4">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="p-3 bg-gray-700 rounded">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-white font-medium">{review.author}</span>
                        <span className="text-yellow-400 ml-2">
                          {'★'.repeat(review.rating)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(review.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300">{review.comment}</p>
                    <div className="text-sm text-gray-400 mt-2">
                      {review.helpful} people found this helpful
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3">
            {extension.installed ? (
              <button
                onClick={() => onUninstall(extension.id)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Uninstall
              </button>
            ) : (
              <button
                onClick={() => onInstall(extension.id)}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Install
              </button>
            )}
            {extension.sourceUrl && (
              <a
                href={extension.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Source Code
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const BAppStorePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StoreTab>('marketplace');
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [installedExtensions, setInstalledExtensions] = useState<InstalledExtension[]>([]);
  const [availableUpdates, setAvailableUpdates] = useState<ExtensionUpdate[]>([]);
  const [categories, setCategories] = useState<ExtensionCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'downloads' | 'recent'>('rating');
  const [selectedExtension, setSelectedExtension] = useState<Extension | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
    loadExtensions();
    loadInstalledExtensions();
    checkForUpdates();

    // Listen for extension events
    window.api.onExtensionInstalled((_installed) => {
      loadInstalledExtensions();
      loadExtensions();
    });

    window.api.onExtensionUninstalled((_extensionId) => {
      loadInstalledExtensions();
      loadExtensions();
    });

    window.api.onExtensionUpdated((_updated) => {
      loadInstalledExtensions();
      checkForUpdates();
    });
  }, []);

  const loadCategories = async () => {
    const result = await window.api.extensionGetCategories();
    if (result.success && result.categories) {
      setCategories(result.categories);
    }
  };

  const loadExtensions = async () => {
    setLoading(true);
    const result = await window.api.extensionGetAll();
    if (result.success && result.extensions) {
      setExtensions(result.extensions);
    }
    setLoading(false);
  };

  const loadInstalledExtensions = async () => {
    const result = await window.api.extensionGetInstalled();
    if (result.success && result.extensions) {
      setInstalledExtensions(result.extensions);
    }
  };

  const checkForUpdates = async () => {
    const result = await window.api.extensionCheckUpdates();
    if (result.success && result.updates) {
      setAvailableUpdates(result.updates);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    const filters: any = { sortBy };
    if (selectedCategory !== 'all') {
      filters.category = selectedCategory;
    }

    const result = await window.api.extensionSearch(searchQuery, filters);
    if (result.success && result.extensions) {
      setExtensions(result.extensions);
    }
    setLoading(false);
  };

  const handleInstall = async (extensionId: string) => {
    setLoading(true);
    const result = await window.api.extensionInstall(extensionId);
    if (result.success) {
      loadExtensions();
      loadInstalledExtensions();
      setSelectedExtension(null);
    }
    setLoading(false);
  };

  const handleUninstall = async (extensionId: string) => {
    setLoading(true);
    const result = await window.api.extensionUninstall(extensionId);
    if (result.success) {
      loadExtensions();
      loadInstalledExtensions();
      setSelectedExtension(null);
    }
    setLoading(false);
  };

  const handleToggleExtension = async (extensionId: string, enabled: boolean) => {
    const result = await window.api.extensionEnable(extensionId, enabled);
    if (result.success) {
      loadInstalledExtensions();
    }
  };

  const handleUpdateExtension = async (extensionId: string) => {
    setLoading(true);
    const result = await window.api.extensionUpdate(extensionId);
    if (result.success) {
      checkForUpdates();
      loadInstalledExtensions();
    }
    setLoading(false);
  };

  const handleUpdateAll = async () => {
    setLoading(true);
    const result = await window.api.extensionUpdateAll();
    if (result.success) {
      checkForUpdates();
      loadInstalledExtensions();
    }
    setLoading(false);
  };

  const filteredExtensions = extensions.filter((ext) => {
    if (selectedCategory !== 'all' && ext.category !== selectedCategory) return false;
    if (searchQuery && !ext.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h2 className="text-xl font-semibold mb-4">BApp Store & Extensions</h2>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 rounded ${
              activeTab === 'marketplace'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Marketplace
          </button>
          <button
            onClick={() => setActiveTab('installed')}
            className={`px-4 py-2 rounded ${
              activeTab === 'installed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Installed ({installedExtensions.length})
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`px-4 py-2 rounded ${
              activeTab === 'updates'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Updates
            {availableUpdates.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                {availableUpdates.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'marketplace' && (
          <div>
            <div className="mb-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search extensions..."
                  className="flex-1 p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Search
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 bg-gray-700 text-white rounded border border-gray-600"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.count})
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="p-2 bg-gray-700 text-white rounded border border-gray-600"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="downloads">Sort by Downloads</option>
                  <option value="recent">Sort by Recent</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-400">Loading extensions...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExtensions.map((extension) => (
                  <div
                    key={extension.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
                    onClick={() => setSelectedExtension(extension)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-white">{extension.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          extension.type === 'verified'
                            ? 'bg-blue-600 text-white'
                            : extension.type === 'enterprise'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-600 text-white'
                        }`}
                      >
                        {extension.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {extension.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-400">
                          ★ {extension.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          {extension.downloads.toLocaleString()} downloads
                        </span>
                      </div>
                      {extension.installed && (
                        <span className="text-green-400 text-xs">✓ Installed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredExtensions.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No extensions found matching your criteria
              </div>
            )}
          </div>
        )}

        {activeTab === 'installed' && (
          <div className="space-y-3">
            {installedExtensions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No extensions installed. Browse the marketplace to get started!
              </div>
            ) : (
              installedExtensions.map((installed) => (
                <div
                  key={installed.id}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {installed.extension.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">
                        v{installed.extension.version} • Installed{' '}
                        {new Date(installed.installedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-300 mb-3">
                        {installed.extension.description}
                      </p>
                      {installed.uiPanels && installed.uiPanels.length > 0 && (
                        <div className="text-sm text-gray-400">
                          <span className="font-semibold">UI Panels:</span>{' '}
                          {installed.uiPanels.map((panel) => panel.title).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={installed.enabled}
                          onChange={(e) =>
                            handleToggleExtension(installed.id, e.target.checked)
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-gray-300">Enabled</span>
                      </label>
                      <button
                        onClick={() => setSelectedExtension(installed.extension)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleUninstall(installed.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        Uninstall
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'updates' && (
          <div className="space-y-3">
            {availableUpdates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                All extensions are up to date!
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleUpdateAll}
                    disabled={loading}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                  >
                    Update All ({availableUpdates.length})
                  </button>
                </div>
                {availableUpdates.map((update) => (
                  <div
                    key={update.extensionId}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-1">
                          Extension Update Available
                        </h3>
                        <p className="text-sm text-gray-400 mb-2">
                          {update.currentVersion} → {update.latestVersion}
                        </p>
                        <p className="text-sm text-gray-300 mb-2">
                          Size: {(update.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="text-sm text-gray-300">
                          <div className="font-semibold mb-1">Release Notes:</div>
                          <div className="whitespace-pre-wrap">{update.releaseNotes}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateExtension(update.extensionId)}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Update
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {selectedExtension && (
        <ExtensionDetailsModal
          extension={selectedExtension}
          onClose={() => setSelectedExtension(null)}
          onInstall={handleInstall}
          onUninstall={handleUninstall}
        />
      )}
    </div>
  );
};
