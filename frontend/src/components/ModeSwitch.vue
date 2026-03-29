<template>
  <div class="top-bar">
    <div class="mode-switch">
      <button
        :class="['mode-btn', modelValue === 'text' && 'active']"
        @click="$emit('update:modelValue', 'text')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Text Chat
      </button>
      <button
        :class="['mode-btn', modelValue === 'voice' && 'active']"
        @click="$emit('update:modelValue', 'voice')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
        Voice Chat
      </button>
    </div>
    <div class="model-selector" v-if="models.length > 0">
      <label class="model-label">Model:</label>
      <select class="model-select" :value="activeModelId" @change="onModelChange">
        <option v-for="m in models" :key="m.id" :value="m.id">{{ m.name }}</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchModels, selectModel, type ModelInfo } from '../services/api';

const props = defineProps<{
  modelValue: 'text' | 'voice';
  userId: string;
}>();

defineEmits<{
  'update:modelValue': [value: 'text' | 'voice'];
}>();

const models = ref<ModelInfo[]>([]);
const activeModelId = ref('');

async function loadModels() {
  try {
    const result = await fetchModels(props.userId);
    models.value = result.models;
    activeModelId.value = result.activeId;
  } catch (e) {
    console.error('Failed to load models:', e);
  }
}

async function onModelChange(e: Event) {
  const modelId = (e.target as HTMLSelectElement).value;
  try {
    const result = await selectModel(props.userId, modelId);
    activeModelId.value = result.activeId;
  } catch (err) {
    console.error('Failed to switch model:', err);
  }
}

onMounted(loadModels);
</script>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.mode-switch {
  display: flex;
  gap: 8px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border: 1px solid #d0d0d0;
  border-radius: 20px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.mode-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.mode-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.model-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-label {
  font-size: 13px;
  color: #888;
}

.model-select {
  padding: 6px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  outline: none;
}

.model-select:hover {
  border-color: #1890ff;
}

.model-select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
}
</style>
