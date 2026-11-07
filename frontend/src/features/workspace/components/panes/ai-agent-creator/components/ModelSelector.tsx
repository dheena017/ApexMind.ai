/**
 * frontend/src/features/workspace/components/panes/ai-agent-creator/components/ModelSelector.tsx
 */

import React from 'react';
import { Cpu } from 'lucide-react';
import { CustomSelect } from '@/src/shared/ui/CustomSelect';
import { ScriptModelOption, DEFAULT_SCRIPT_MODEL_LABEL } from '@/src/shared/aiModels';
import { useAvailableScriptModels } from '@/src/shared/hooks/useAvailableScriptModels';

export interface ModelSelectorProps {
  value?: string;
  onChange?: (val: string) => void;
  models?: ScriptModelOption[];
  currentModel?: string;
  defaultModel?: string;
  loading?: boolean;
  error?: string | null;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  value,
  onChange,
  models: propModels,
  currentModel: propCurrentModel,
  defaultModel: propDefaultModel,
  loading: propLoading,
  error: propError,
}) => {
  const hookResult = useAvailableScriptModels();

  const models = propModels ?? hookResult.models;
  const defaultModel = propDefaultModel ?? hookResult.defaultModel;
  const loading = propLoading ?? hookResult.loading;
  const error = propError ?? hookResult.error;
  const currentModel = value ?? propCurrentModel;

  const options = models.map((m) => ({
    value: m.value,
    label: m.label,
    description: m.value,
  }));

  const activeValue = models.some((m) => m.value === currentModel) ? currentModel : defaultModel;

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase font-mono-studio text-[#9CA3AF] flex items-center gap-1.5 font-semibold">
        <Cpu className="w-3 h-3 text-[#3B82F6]" />
        <span>Model</span>
      </label>
      <CustomSelect
        options={options}
        value={activeValue}
        onChange={(val) => onChange?.(val)}
        disabled={loading || models.length === 0}
        className="w-full text-xs"
      />
      {!loading && !error && models.length > 0 && !currentModel && (
        <p className="mt-1 text-[10px] text-[#737373]">Default: {defaultModel || DEFAULT_SCRIPT_MODEL_LABEL}</p>
      )}
      {loading && <p className="mt-1 text-[10px] text-[#737373]">Loading models from Google…</p>}
      {error && <p role="alert" className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  );
};
