import React from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  confirmText?: string;
}

export const ConfirmationModal: React.FC<Props> = ({
  isOpen, title, message, onConfirm, onClose, confirmText = 'Підтвердити'
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Скасувати</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white">{confirmText}</button>
        </div>
      </div>
    </div>
  );
};