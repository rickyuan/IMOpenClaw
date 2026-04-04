/**
 * Frontend Agent UI Plugin Interface
 *
 * Each agent provides its card components and theme configuration.
 * The frontend uses this to dynamically render agent-specific cards
 * and apply agent-specific styling.
 */

import type { Component } from 'vue';

export interface AgentUIPlugin {
  /** Must match backend agent id */
  id: string;

  /** Display name */
  name: string;

  /** Icon identifier or emoji */
  icon: string;

  /** Short subtitle */
  subtitle: string;

  /** Primary theme color (Tailwind class or CSS value) */
  themeColor: string;

  /** Secondary/gradient color */
  themeColorSecondary: string;

  /** Map of card_type -> Vue component */
  cardComponents: Record<string, Component>;
}
