import React, { useState, useEffect } from 'react';
import {
  IconSettings,
  IconPlus,
  IconTrash,
  IconDeviceFloppy,
  IconArrowUp,
  IconArrowDown,
  IconEye,
  IconEyeOff,
  IconColumns
} from '@tabler/icons-react';
import { CustomColumn, AvailableField, ColorRule } from '../../types';
import { ModalWrapper } from './ModalWrapper';

interface ConfigurationPanelProps {
  onClose: () => void;
}

type TabType = 'profiles' | 'columns' | 'colors';

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('profiles');

  // Profiles
  const [profiles, setProfiles] = useState<string[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string>('default');
  const [newProfileName, setNewProfileName] = useState('');
  const [showNewProfile, setShowNewProfile] = useState(false);

  // Columns
  const [customColumns, setCustomColumns] = useState<CustomColumn[]>([]);
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');

  // Color Rules
  const [colorRules, setColorRules] = useState<ColorRule[]>([]);
  const [showNewColorRule, setShowNewColorRule] = useState(false);
  const [newColorRule, setNewColorRule] = useState<ColorRule>({
    name: '',
    filter: '',
    bgColor: '#ffffff',
    fgColor: '#000000'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!window.api) return;

    // Load profiles list
    const profilesResult = await window.api.configListProfiles();
    if (profilesResult.success && profilesResult.profiles) {
      setProfiles(profilesResult.profiles);
    }

    // Load current configuration
    const currentResult = await window.api.configGetCurrent();
    if (currentResult.success && currentResult.profile) {
      setCurrentProfile(currentResult.profile);
    }

    // Load custom columns
    const columnsResult = await window.api.configGetCustomColumns();
    if (columnsResult.success && columnsResult.columns) {
      setCustomColumns(columnsResult.columns);
    }

    // Load available fields
    const fieldsResult = await window.api.configGetAvailableFields();
    if (fieldsResult.success && fieldsResult.fields) {
      setAvailableFields(fieldsResult.fields);
    }

    // Load color rules
    const rulesResult = await window.api.configGetColorRules();
    if (rulesResult.success && rulesResult.rules) {
      setColorRules(rulesResult.rules);
    }
  };

  // Profile Management
  const handleLoadProfile = async (profileName: string) => {
    const result = await window.api.configLoadProfile(profileName);
    if (result.success) {
      setCurrentProfile(profileName);
      await loadData();
      alert(`Loaded profile: ${profileName}`);
    } else {
      alert(`Failed to load profile: ${result.error}`);
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfileName.trim()) {
      alert('Please enter a profile name');
      return;
    }

    const result = await window.api.configDuplicateProfile(currentProfile, newProfileName);
    if (result.success) {
      setProfiles([...profiles, newProfileName]);
      setNewProfileName('');
      setShowNewProfile(false);
      alert(`Created profile: ${newProfileName}`);
    } else {
      alert(`Failed to create profile: ${result.error}`);
    }
  };

  const handleDeleteProfile = async (profileName: string) => {
    if (profileName === 'default') {
      alert('Cannot delete default profile');
      return;
    }

    if (!confirm(`Delete profile "${profileName}"?`)) {
      return;
    }

    const result = await window.api.configDeleteProfile(profileName);
    if (result.success) {
      setProfiles(profiles.filter(p => p !== profileName));
      if (currentProfile === profileName) {
        await handleLoadProfile('default');
      }
    } else {
      alert(`Failed to delete profile: ${result.error}`);
    }
  };

  const handleSaveProfile = async () => {
    const result = await window.api.configSaveProfile(currentProfile);
    if (result.success) {
      alert('Profile saved successfully');
    } else {
      alert(`Failed to save profile: ${result.error}`);
    }
  };

  // Column Management
  const handleAddColumn = async () => {
    if (!selectedField) {
      alert('Please select a field');
      return;
    }

    const field = availableFields.find(f => f.id === selectedField);
    if (!field) return;

    const result = await window.api.configAddCustomColumn(field);
    if (result.success && result.columns) {
      setCustomColumns(result.columns);
      setSelectedField('');
    } else {
      alert(`Failed to add column: ${result.error}`);
    }
  };

  const handleRemoveColumn = async (columnId: string) => {
    const result = await window.api.configRemoveCustomColumn(columnId);
    if (result.success && result.columns) {
      setCustomColumns(result.columns);
    } else {
      alert(`Failed to remove column: ${result.error}`);
    }
  };

  const handleMoveColumn = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= customColumns.length) return;

    const result = await window.api.configReorderColumns(index, newIndex);
    if (result.success && result.columns) {
      setCustomColumns(result.columns);
    }
  };

  const handleToggleColumnVisibility = (index: number) => {
    const updatedColumns = [...customColumns];
    updatedColumns[index].visible = !updatedColumns[index].visible;
    setCustomColumns(updatedColumns);
    window.api.configSetCustomColumns(updatedColumns);
  };

  // Color Rule Management
  const handleAddColorRule = async () => {
    if (!newColorRule.name || !newColorRule.filter) {
      alert('Please fill in name and filter');
      return;
    }

    const result = await window.api.configAddColorRule(newColorRule);
    if (result.success && result.rules) {
      setColorRules(result.rules);
      setNewColorRule({ name: '', filter: '', bgColor: '#ffffff', fgColor: '#000000' });
      setShowNewColorRule(false);
    } else {
      alert(`Failed to add color rule: ${result.error}`);
    }
  };

  const handleRemoveColorRule = async (ruleName: string) => {
    const result = await window.api.configRemoveColorRule(ruleName);
    if (result.success && result.rules) {
      setColorRules(result.rules);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
      <div className="apple-card rounded-3xl shadow-2xl flex flex-col overflow-hidden w-full max-w-5xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
              <IconSettings size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-black uppercase tracking-wide">Configuration</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
            >
              <IconDeviceFloppy size={16} />
              Save Profile
            </button>
            <button
              onClick={onClose}
              className="apple-button rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50">
          {[
            { id: 'profiles', label: 'Profiles' },
            { id: 'columns', label: 'Custom Columns' },
            { id: 'colors', label: 'Color Rules' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-5 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 bg-white'
                  : 'border-transparent text-black opacity-60 hover:opacity-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-white">
          {/* Profiles Tab */}
          {activeTab === 'profiles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-black uppercase tracking-wide">Profiles</h3>
                <button
                  onClick={() => setShowNewProfile(true)}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 shadow-sm"
                >
                  <IconPlus size={16} />
                  New Profile
                </button>
              </div>

              {showNewProfile && (
                <div className="flex items-center gap-3 p-5 apple-card rounded-2xl">
                  <input
                    type="text"
                    value={newProfileName}
                    onChange={(e) => setNewProfileName(e.target.value)}
                    placeholder="Profile name"
                    className="flex-1 apple-input rounded-xl px-4 py-2.5 text-sm text-black font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateProfile()}
                  />
                  <button
                    onClick={handleCreateProfile}
                    className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-sm"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowNewProfile(false);
                      setNewProfileName('');
                    }}
                    className="apple-button rounded-xl px-4 py-2.5 text-sm font-semibold text-black"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="space-y-3">
                {profiles.map(profile => (
                  <div
                    key={profile}
                    className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                      profile === currentProfile
                        ? 'border-purple-600 bg-purple-50'
                        : 'apple-card'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <IconSettings size={22} className={profile === currentProfile ? 'text-purple-600' : 'text-black opacity-60'} />
                      <div>
                        <div className="font-bold text-black">{profile}</div>
                        {profile === currentProfile && (
                          <div className="text-xs text-purple-600 font-semibold mt-0.5">Active Profile</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile !== currentProfile && (
                        <button
                          onClick={() => handleLoadProfile(profile)}
                          className="rounded-xl border-2 border-purple-600 text-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-50"
                        >
                          Load
                        </button>
                      )}
                      {profile !== 'default' && (
                        <button
                          onClick={() => handleDeleteProfile(profile)}
                          className="rounded-xl p-2 text-red-600 hover:bg-red-50"
                        >
                          <IconTrash size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-5 apple-card rounded-2xl bg-blue-50 border border-blue-200">
                <h4 className="font-bold text-black mb-2 text-sm uppercase tracking-wide">Profile Information</h4>
                <p className="text-sm text-black opacity-80 font-mono leading-relaxed">
                  Profiles save your entire configuration including custom columns, display filters,
                  BPF filters, color rules, capture options, and UI layout preferences. Create different
                  profiles for different analysis tasks.
                </p>
              </div>
            </div>
          )}

          {/* Custom Columns Tab */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <select
                  value={selectedField}
                  onChange={(e) => setSelectedField(e.target.value)}
                  className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                >
                  <option value="">Select a field to add...</option>
                  {availableFields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.label} ({field.type})
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddColumn}
                  disabled={!selectedField}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  <IconPlus size={16} />
                  Add Column
                </button>
              </div>

              <div className="space-y-2">
                {customColumns.map((column, index) => (
                  <div
                    key={column.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <div className="flex items-center gap-3">
                      <IconColumns size={18} className={column.visible ? 'text-green-600' : 'text-gray-400'} />
                      <div>
                        <div className="font-medium text-sm">{column.label}</div>
                        <div className="text-xs text-gray-500">Width: {column.width}px</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleColumnVisibility(index)}
                        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        title={column.visible ? 'Hide column' : 'Show column'}
                      >
                        {column.visible ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => handleMoveColumn(index, 'up')}
                        disabled={index === 0}
                        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                      >
                        <IconArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMoveColumn(index, 'down')}
                        disabled={index === customColumns.length - 1}
                        className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-30"
                      >
                        <IconArrowDown size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveColumn(column.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {customColumns.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No custom columns. Add fields from the dropdown above.
                </div>
              )}
            </div>
          )}

          {/* Color Rules Tab */}
          {activeTab === 'colors' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Color Rules</h3>
                <button
                  onClick={() => setShowNewColorRule(true)}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  <IconPlus size={16} />
                  New Rule
                </button>
              </div>

              {showNewColorRule && (
                <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg space-y-3">
                  <input
                    type="text"
                    value={newColorRule.name}
                    onChange={(e) => setNewColorRule({ ...newColorRule, name: e.target.value })}
                    placeholder="Rule name"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <input
                    type="text"
                    value={newColorRule.filter}
                    onChange={(e) => setNewColorRule({ ...newColorRule, filter: e.target.value })}
                    placeholder="Filter (e.g., protocol:TCP, source:192.168.1.1)"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
                  />
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-sm mb-1">Background Color</label>
                      <input
                        type="color"
                        value={newColorRule.bgColor}
                        onChange={(e) => setNewColorRule({ ...newColorRule, bgColor: e.target.value })}
                        className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-700"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm mb-1">Text Color</label>
                      <input
                        type="color"
                        value={newColorRule.fgColor}
                        onChange={(e) => setNewColorRule({ ...newColorRule, fgColor: e.target.value })}
                        className="w-full h-10 rounded-lg border border-neutral-300 dark:border-neutral-700"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddColorRule}
                      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                      Add Rule
                    </button>
                    <button
                      onClick={() => {
                        setShowNewColorRule(false);
                        setNewColorRule({ name: '', filter: '', bgColor: '#ffffff', fgColor: '#000000' });
                      }}
                      className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {colorRules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-neutral-200 dark:border-neutral-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-16 h-8 rounded border border-neutral-300"
                        style={{ backgroundColor: rule.bgColor, color: rule.fgColor }}
                      >
                        <div className="flex items-center justify-center h-full text-xs font-medium">
                          Sample
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-xs text-gray-500">{rule.filter}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveColorRule(rule.name)}
                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {colorRules.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No color rules. Create rules to highlight specific packets.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;
