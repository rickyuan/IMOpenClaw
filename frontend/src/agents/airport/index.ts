import type { AgentUIPlugin } from '../types';
import FlightStatusCard from '../../components/cards/FlightStatusCard.vue';
import TransportCard from '../../components/cards/TransportCard.vue';
import JewelCard from '../../components/cards/JewelCard.vue';
import TerminalDiningCard from '../../components/cards/TerminalDiningCard.vue';

export const airportAgentUI: AgentUIPlugin = {
  id: 'airport',
  name: 'SkyGuide',
  icon: 'plane',
  subtitle: 'AI Airport Assistant',
  themeColor: '#1A73E8',
  themeColorSecondary: '#0D47A1',
  cardComponents: {
    flight_status_card: FlightStatusCard,
    transport_card: TransportCard,
    jewel_card: JewelCard,
    terminal_dining_card: TerminalDiningCard,
  },
};
