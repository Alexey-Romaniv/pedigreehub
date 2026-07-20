// Заглушка для локализации (будет реализована позже)

export const locKeys = {
  UI_COMPONENTS: {
    ARIA_LABELS: {
      TOGGLE_COLOR_MODE: 'toggle_color_mode',
    },
  },
}

export const _t = (key: string) => {
  const translations: Record<string, string> = {
    toggle_color_mode: 'Przełącz motyw',
  }
  return translations[key] || key
}

