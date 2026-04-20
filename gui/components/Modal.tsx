import * as React from "react";
import { Modal as HeroModal } from "@heroui/react";

interface ModalProps {
  children?: React.ReactNode;
  visible: boolean;
  onClose: () => void;
}

export function Modal({ children, visible, onClose }: ModalProps) {
  return (
    <HeroModal
      isOpen={visible}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <HeroModal.Backdrop isDismissable>
        <HeroModal.Container>
          <HeroModal.Dialog>
            {children}
          </HeroModal.Dialog>
        </HeroModal.Container>
      </HeroModal.Backdrop>
    </HeroModal>
  );
}

Modal.Header = function ModalHeader({ children }: { children: React.ReactNode }) {
  return <HeroModal.Header>{children}</HeroModal.Header>;
};

Modal.Title = function ModalTitle({ children }: { children: React.ReactNode }) {
  return <HeroModal.Heading>{children}</HeroModal.Heading>;
};

Modal.Body = function ModalBody({ children }: { children: React.ReactNode }) {
  return <HeroModal.Body>{children}</HeroModal.Body>;
};

Modal.Footer = function ModalFooter({ children }: { children: React.ReactNode }) {
  return <HeroModal.Footer>{children}</HeroModal.Footer>;
};
