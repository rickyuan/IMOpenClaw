import type { AgentUIPlugin } from '../types';
import MenuCard from '../../components/cards/MenuCard.vue';
import OrderCard from '../../components/cards/OrderCard.vue';
import ConfirmationCard from '../../components/cards/ConfirmationCard.vue';

export const baristaAgentUI: AgentUIPlugin = {
  id: 'barista',
  name: 'QuickCafe',
  icon: 'coffee',
  subtitle: 'AI Barista Demo',
  themeColor: '#C67C4E',
  themeColorSecondary: '#8B5A2B',
  cardComponents: {
    menu_card: MenuCard,
    order_card: OrderCard,
    confirmation_card: ConfirmationCard,
  },
};
