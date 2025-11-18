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
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg font-bold text-black uppercase tracking-wide mb-2">{extension.name}</h2>
              <p className="text-sm text-gray-600">
                by {extension.author} • v{extension.version}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-black transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <div className="text-sm font-semibold text-gray-600">Rating</div>
              <div className="text-xl font-bold text-black">
                ★ {extension.rating.toFixed(1)}
              </div>
            </div>
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <div className="text-sm font-semibold text-gray-600">Downloads</div>
              <div className="text-xl font-bold text-black">
                {extension.downloads.toLocaleString()}
              </div>
            </div>
            <div className="apple-card rounded-2xl p-5 border border-gray-200">
              <div className="text-sm font-semibold text-gray-600">Type</div>
              <div className="text-xl font-bold text-black capitalize">
                {extension.type}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-black mb-2 block">Description</h3>
            <p className="text-sm text-gray-600">{extension.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-black mb-2 block">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Category:</span>{' '}
                <span className="text-black capitalize">{extension.category}</span>
              </div>
              <div>
                <span className="text-gray-600">License:</span>{' '}
                <span className="text-black capitalize">{extension.licenseType}</span>
                {extension.price && (
                  <span className="text-green-600"> (${extension.price})</span>
                )}
              </div>
              <div>
                <span className="text-gray-600">Size:</span>{' '}
                <span className="text-black">
                  {(extension.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
              <div>
                <span className="text-gray-600">Last Updated:</span>{' '}
                <span className="text-black">
                  {new Date(extension.lastUpdated).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {extension.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-black mb-2 block">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {extension.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-sm border border-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-black">Reviews</h3>
              {extension.installed && !showReviewForm && (
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  Write Review
                </button>
              )}
            </div>

            {showReviewForm && (
              <div className="mb-4 apple-card rounded-2xl p-5 border border-gray-200">
                <div className="mb-3">
                  <label className="text-sm font-semibold text-black mb-2 block">Rating</label>
                  <select
                    value={newRating}
                    onChange={(e) => setNewRating(Number(e.target.value))}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {'★'.repeat(rating)} {rating}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="text-sm font-semibold text-black mb-2 block">Comment</label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="apple-input rounded-xl px-4 py-2.5 text-sm text-black w-full h-24"
                    placeholder="Share your experience with this extension..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitReview}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                  >
                    Submit Review
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      setNewComment('');
                      setNewRating(5);
                    }}
                    className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {reviews.length === 0 ? (
                <p className="text-gray-600 text-center py-4">
                  No reviews yet. Be the first to review!
                </p>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="apple-card rounded-2xl p-5 border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-black font-semibold">{review.author}</span>
                        <span className="text-yellow-500 ml-2">
                          {'★'.repeat(review.rating)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Date(review.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    <div className="text-sm text-gray-600 mt-2">
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
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
              >
                Uninstall
              </button>
            ) : (
              <button
                onClick={() => onInstall(extension.id)}
                className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
              >
                Install
              </button>
            )}
            {extension.sourceUrl && (
              <a
                href={extension.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-gray-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 shadow-sm"
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
    <div className="flex flex-col h-full bg-white">
      <div className="px-6 py-5 border-b border-gray-200">
        <h2 className="text-lg font-bold text-black uppercase tracking-wide">BApp Store & Extensions</h2>
      </div>

      <div className="flex border-b border-gray-200 px-6 bg-gray-50 overflow-x-auto">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'marketplace'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-black'
          }`}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'installed'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-black'
          }`}
        >
          Installed ({installedExtensions.length})
        </button>
        <button
          onClick={() => setActiveTab('updates')}
          className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'updates'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-black'
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

      <div className="flex-1 overflow-y-auto p-6">
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
                  className="flex-1 apple-input rounded-xl px-4 py-2.5 text-sm text-black"
                />
                <button
                  onClick={handleSearch}
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                >
                  Search
                </button>
              </div>

              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="apple-input rounded-xl px-4 py-2.5 text-sm text-black"
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
                  className="apple-input rounded-xl px-4 py-2.5 text-sm text-black"
                >
                  <option value="rating">Sort by Rating</option>
                  <option value="downloads">Sort by Downloads</option>
                  <option value="recent">Sort by Recent</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-600">Loading extensions...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExtensions.map((extension) => (
                  <div
                    key={extension.id}
                    className="apple-card rounded-2xl p-5 border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                    onClick={() => setSelectedExtension(extension)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base font-semibold text-black">{extension.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-lg font-semibold ${
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
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {extension.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-yellow-500">
                          ★ {extension.rating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          {extension.downloads.toLocaleString()} downloads
                        </span>
                      </div>
                      {extension.installed && (
                        <span className="text-green-600 text-xs font-semibold">✓ Installed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && filteredExtensions.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                No extensions found matching your criteria
              </div>
            )}
          </div>
        )}

        {activeTab === 'installed' && (
          <div className="space-y-3">
            {installedExtensions.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                No extensions installed. Browse the marketplace to get started!
              </div>
            ) : (
              installedExtensions.map((installed) => (
                <div
                  key={installed.id}
                  className="apple-card rounded-2xl p-5 border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold text-black mb-1">
                        {installed.extension.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        v{installed.extension.version} • Installed{' '}
                        {new Date(installed.installedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700 mb-3">
                        {installed.extension.description}
                      </p>
                      {installed.uiPanels && installed.uiPanels.length > 0 && (
                        <div className="text-sm text-gray-600">
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
                        <span className="text-sm font-semibold text-black">Enabled</span>
                      </label>
                      <button
                        onClick={() => setSelectedExtension(installed.extension)}
                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleUninstall(installed.id)}
                        className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 shadow-sm"
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
              <div className="text-center py-8 text-gray-600">
                All extensions are up to date!
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleUpdateAll}
                    disabled={loading}
                    className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm disabled:opacity-50"
                  >
                    Update All ({availableUpdates.length})
                  </button>
                </div>
                {availableUpdates.map((update) => (
                  <div
                    key={update.extensionId}
                    className="apple-card rounded-2xl p-5 border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-black mb-1">
                          Extension Update Available
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {update.currentVersion} → {update.latestVersion}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          Size: {(update.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="text-sm text-gray-700">
                          <div className="font-semibold mb-1">Release Notes:</div>
                          <div className="whitespace-pre-wrap">{update.releaseNotes}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateExtension(update.extensionId)}
                        disabled={loading}
                        className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm disabled:opacity-50"
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
