import { useRef, ReactNode, useEffect } from "react";
import styles from "./modal.module.scss";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  disableOutsideClick?: boolean;
  blurIntensity?: 'light' | 'medium' | 'heavy';
}

const Modal = ({
  open,
  onClose,
  children,
  disableOutsideClick = false,
  blurIntensity = 'medium'
}: ModalProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (dialogElement) {
      if (open) {
        dialogElement.showModal();
      } else if (dialogElement.open) {
        dialogElement.close();
      }
    }
  }, [open]);

  const handleOverlayClick = () => {
    if (!disableOutsideClick) {
      onClose();
    }
  };

  const getOverlayClasses = () => {
    const baseClasses = `${styles.modalOverlay} ${open ? styles.visible : styles.hidden}`;
    const blurClass = styles[`blur${blurIntensity.charAt(0).toUpperCase() + blurIntensity.slice(1)}`];
    return `${baseClasses} ${blurClass}`;
  };

  const dialogClasses = `${styles.modalDialog} ${
    open ? styles.visible : styles.hidden
  }`;

  return (
    <div
      className={getOverlayClasses()}
      onClick={handleOverlayClick}
    >
      <dialog
        ref={dialogRef}
        className={dialogClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </dialog>
    </div>
  );
};

export default Modal;
