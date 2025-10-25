import * as React from "react";

interface ModalProps {
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
}

interface ModalHeaderProps {
  children: React.ReactNode;
}

interface ModalBodyProps {
  children: React.ReactNode;
}

interface ModalFooterProps {
  children: React.ReactNode;
}

export function Modal({ children, visible, onClose }: ModalProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && visible) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [visible, onClose]);

  if (!visible) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

Modal.Header = function ModalHeader({ children }: ModalHeaderProps) {
  return <div className="modal-header">{children}</div>;
};

Modal.Title = function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="modal-title">{children}</h2>;
};

Modal.Body = function ModalBody({ children }: ModalBodyProps) {
  return <div className="modal-body">{children}</div>;
};

Modal.Footer = function ModalFooter({ children }: ModalFooterProps) {
  return <div className="modal-footer">{children}</div>;
};
