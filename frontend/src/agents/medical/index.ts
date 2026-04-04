import type { AgentUIPlugin } from '../types';
import ServiceMenuCard from '../../components/cards/ServiceMenuCard.vue';
import DoctorListCard from '../../components/cards/DoctorListCard.vue';
import AppointmentCard from '../../components/cards/AppointmentCard.vue';
import PatientInfoCard from '../../components/cards/PatientInfoCard.vue';

export const medicalAgentUI: AgentUIPlugin = {
  id: 'medical',
  name: 'MediAssist',
  icon: 'stethoscope',
  subtitle: 'AI Medical Assistant',
  themeColor: '#2E86AB',
  themeColorSecondary: '#1B4965',
  cardComponents: {
    service_menu_card: ServiceMenuCard,
    doctor_list_card: DoctorListCard,
    appointment_card: AppointmentCard,
    patient_info_card: PatientInfoCard,
  },
};
