/**
 * Content repository. UI reads content through here, never from data files
 * directly — so moving services, use cases or technology into a CMS or the GA
 * Automations API later only changes this module.
 */
import { services } from '@/data/services';
import { techCategories } from '@/data/technology';
import { useCases } from '@/data/useCases';

export const content = {
  services: () => services,
  useCases: () => useCases,
  technology: () => techCategories,
};
