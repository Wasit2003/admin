/**
 * Format an amount with the specified currency symbol
 * @param amount The amount to format
 * @param currency The currency symbol (default: '$')
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted amount string
 */
export const formatAmount = (
  amount: string | number,
  currency = '$',
  decimals = 2
): string => {
  try {
    if (amount === null || amount === undefined || amount === '') {
      return `${currency}0.00`;
    }

    // Convert to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if it's a valid number
    if (isNaN(numericAmount)) {
      return `${currency}0.00`;
    }

    // Format with the specified number of decimal places and add currency symbol
    return `${currency}${numericAmount.toFixed(decimals)}`;
  } catch (error) {
    console.error('Error formatting amount:', error);
    return `${currency}0.00`;
  }
};

/**
 * Format a percentage
 * @param value The percentage value
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: string | number,
  decimals = 2
): string => {
  try {
    if (value === null || value === undefined || value === '') {
      return '0.00%';
    }

    // Convert to number if it's a string
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
    if (isNaN(numericValue)) {
      return '0.00%';
    }

    // Format with the specified number of decimal places and add percentage symbol
    return `${numericValue.toFixed(decimals)}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0.00%';
  }
}; 