import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  isError?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onClose, 
  onConfirm, 
  confirmText,
  isError = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-content ${isError ? 'modal-error' : ''}`}>
        <h2 className="modal-title">{title}</h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            {onConfirm ? 'Cancelar' : 'Cerrar'}
          </button>
          {onConfirm && (
            <button className="btn btn-primary" onClick={onConfirm}>
              {confirmText || 'Confirmar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
