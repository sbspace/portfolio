import { useState, useCallback } from 'react';
import type { Page, ViewFilter } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { AssetInputPage } from '@/pages/AssetInputPage';
import { TargetWeightPage } from '@/pages/TargetWeightPage';
import { RebalancingPage } from '@/pages/RebalancingPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { MemoPage } from '@/pages/MemoPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { usePortfolio } from '@/hooks/usePortfolio';
import { usePrices } from '@/hooks/usePrices';
import { useHistoryFolder } from '@/hooks/useHistoryFolder';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('combined');

  const {
    state,
    updateBeomseokAssets,
    updateSeyeonAssets,
    updateTargetWeights,
    updateSettings,
    updateMemo,
    updateDatedMemo,
    updateMemoTitle,
    saveSnapshot,
    deleteSnapshot,
    syncHoldingsToTickers,
  } = usePortfolio();

  const { prices, loading, error, fetchPrices, forceRefresh } = usePrices();
  const historyFolder = useHistoryFolder();

  const handleFetchPrices = useCallback(() => {
    fetchPrices(state.settings);
  }, [fetchPrices, state.settings]);

  const handleForceRefresh = useCallback(() => {
    forceRefresh(state.settings);
  }, [forceRefresh, state.settings]);

  const handleSaveSnapshot = useCallback(() => {
    if (!prices) return;
    saveSnapshot(prices);
  }, [prices, saveSnapshot]);

  const includesFixed =
    state.beomseokAssets.fixedAsset.depositIncluded ||
    state.beomseokAssets.fixedAsset.pensionIncluded ||
    state.seyeonAssets.fixedAsset.depositIncluded ||
    state.seyeonAssets.fixedAsset.pensionIncluded;

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && (
        <DashboardPage
          appState={state}
          prices={prices}
          loading={loading}
          error={error}
          viewFilter={viewFilter}
          onViewFilterChange={setViewFilter}
          onFetchPrices={handleFetchPrices}
          onForceRefresh={handleForceRefresh}
          onSaveSnapshot={handleSaveSnapshot}
          historyFolder={historyFolder}
        />
      )}

      {currentPage === 'input' && (
        <AssetInputPage
          beomseokAssets={state.beomseokAssets}
          seyeonAssets={state.seyeonAssets}
          settings={state.settings}
          snapshots={state.snapshots}
          onUpdateBeomseok={updateBeomseokAssets}
          onUpdateSeyeon={updateSeyeonAssets}
        />
      )}

      {currentPage === 'target' && (
        <TargetWeightPage
          targetWeights={state.targetWeights}
          settings={state.settings}
          includesFixed={includesFixed}
          onUpdate={updateTargetWeights}
        />
      )}

      {currentPage === 'rebalancing' && (
        <RebalancingPage
          appState={state}
          prices={prices}
          loading={loading}
          onFetchPrices={handleFetchPrices}
        />
      )}

      {currentPage === 'history' && (
        <HistoryPage snapshots={state.snapshots} onDelete={deleteSnapshot} />
      )}

      {currentPage === 'memo' && (
        <MemoPage
          memo={state.memo}
          onUpdate={updateMemo}
          datedMemos={state.datedMemos}
          onUpdateDatedMemo={updateDatedMemo}
          memoTitles={state.memoTitles}
          onUpdateTitle={updateMemoTitle}
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          settings={state.settings}
          prices={prices}
          loading={loading}
          onUpdate={updateSettings}
          onSyncHoldings={syncHoldingsToTickers}
          onFetchPrices={handleFetchPrices}
          onForceRefresh={handleForceRefresh}
          historyFolder={historyFolder}
        />
      )}
    </Layout>
  );
}
