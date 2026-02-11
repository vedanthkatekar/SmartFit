export const AVATAR_MODEL_CONFIG = {
  male: {
    front: 'https://i.ibb.co/placeholder-male-front/male-3d-model.png',
    side: 'https://i.ibb.co/placeholder-male-side/male-3d-model.png',
    back: 'https://i.ibb.co/placeholder-male-back/male-3d-model.png',
  },
  female: {
    front: 'https://i.ibb.co/placeholder-female-front/female-3d-model.png',
    side: 'https://i.ibb.co/placeholder-female-side/female-3d-model.png',
    back: 'https://i.ibb.co/placeholder-female-back/female-3d-model.png',
  },
  unspecified: {
    front: 'https://i.ibb.co/placeholder-neutral-front/neutral-3d-model.png',
    side: 'https://i.ibb.co/placeholder-neutral-side/neutral-3d-model.png',
    back: 'https://i.ibb.co/placeholder-neutral-back/neutral-3d-model.png',
  },
};

export function getModelImageUrl(gender: string, viewAngle: string = 'front'): string {
  const genderKey = gender as keyof typeof AVATAR_MODEL_CONFIG;
  const angleKey = viewAngle as keyof typeof AVATAR_MODEL_CONFIG.male;

  return AVATAR_MODEL_CONFIG[genderKey]?.[angleKey] || AVATAR_MODEL_CONFIG.unspecified.front;
}
