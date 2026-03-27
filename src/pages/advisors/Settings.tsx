import { useState } from 'react';

const tabs = ['BYOK AI Setup', 'Development', 'Options'] as const;
type Tab = (typeof tabs)[number];

export function Settings() {
  const [activeTab, setActiveTab] = useState<Tab>('BYOK AI Setup');

  return (
    <div>
      <h1 className="text-xl font-semibold text-fx-black">Advisors Settings</h1>
      <p className="mt-1 text-sm text-fx-600">Operational configuration for Advisors.</p>

      <div className="mt-6 flex gap-1 border-b border-fx-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? 'border-fx-blue text-fx-blue font-medium'
                : 'border-transparent text-fx-600 hover:text-fx-black hover:border-fx-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'BYOK AI Setup' && <BYOKPanel />}
        {activeTab === 'Development' && <DevelopmentPanel />}
        {activeTab === 'Options' && <OptionsPanel />}
      </div>
    </div>
  );
}

function BYOKPanel() {
  return (
    <div className="max-w-lg rounded-lg border border-fx-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-fx-black">Bring Your Own Key — AI Provider</h2>
      <p className="mt-1 text-xs text-fx-500">
        Connect an OpenAI-compatible API to enable Advanced Explanation on check results.
      </p>
      <form className="mt-5 space-y-4" onSubmit={(e) => e.preventDefault()}>
        <label className="block">
          <span className="text-xs font-medium text-fx-700">API Endpoint</span>
          <input
            type="url"
            placeholder="https://api.openai.com/v1"
            className="mt-1 block w-full rounded-md border border-fx-200 bg-fx-paper px-3 py-2 text-sm text-fx-black placeholder:text-fx-400 focus:border-fx-blue focus:ring-1 focus:ring-fx-blue/30 outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-fx-700">API Key</span>
          <input
            type="password"
            placeholder="sk-••••••••••••••••"
            className="mt-1 block w-full rounded-md border border-fx-200 bg-fx-paper px-3 py-2 text-sm text-fx-black placeholder:text-fx-400 focus:border-fx-blue focus:ring-1 focus:ring-fx-blue/30 outline-none"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-fx-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Save Configuration
        </button>
      </form>
    </div>
  );
}

function DevelopmentPanel() {
  return (
    <div className="rounded-lg border border-dashed border-fx-300 bg-fx-100/50 p-8 text-center">
      <p className="text-sm font-medium text-fx-600">Development of Advisors — Studio</p>
      <p className="mt-1 text-xs text-fx-500">
        Author, test, and publish custom database checks. Not in scope for this prototype.
      </p>
    </div>
  );
}

function OptionsPanel() {
  return (
    <div className="rounded-lg border border-dashed border-fx-300 bg-fx-100/50 p-8 text-center">
      <p className="text-sm font-medium text-fx-600">Additional options placeholder</p>
      <p className="mt-1 text-xs text-fx-500">
        Notification routing, default intervals, and other global settings will live here.
      </p>
    </div>
  );
}
