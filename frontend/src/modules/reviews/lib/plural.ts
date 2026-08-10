// Польская плюрализация: 1 opinia, 2–4 opinie (кроме 12–14), иначе opinii
export const opinionsLabel = (count: number): string => {
  if (count === 1) return '1 opinia'
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return `${count} opinie`
  }
  return `${count} opinii`
}
