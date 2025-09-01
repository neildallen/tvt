export const formatNumber = (num: number): string => {
  if (num === 0) return '0.00';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  }
  
  if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  
  return num.toFixed(2);
};

export const formatCurrency = (num: number): string => {
  return '$' + formatNumber(num);
};

export const formatPercentage = (num: number): string => {
  return num.toFixed(2) + '%';
};

export const truncateAddress = (address: string, length: number = 8): string => {
  if (address.length <= length) return address;
  return `${address.slice(0, length / 2)}...${address.slice(-length / 2)}`;
}; 

export const getImgProxyUrl = (url: string, size: number) => `https://wsrv.nl/?fit=cover&w=${size}&h=${size}&url=${url}`