import toast from 'react-hot-toast';

export const copyToClipboard = async (text: string, successMessage?: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage || 'Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy: ', err);
    toast.error('Failed to copy to clipboard');
  }
}; 