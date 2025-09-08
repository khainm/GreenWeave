export const formatVnd = (value: number): string => {
  return new Intl.NumberFormat('vi-VN').format(value)
}


