import Modal from './Modal';
import Button from './Button';

export default function ConflictModal({ open, onReload, onClose }) {
  return (
    <Modal
      open={open}
      title="This record changed at another station"
      onClose={onClose}
      footer={<Button type="button" onClick={onReload}>Reload the form</Button>}
    >
      Someone else updated this form at another station. Reloading will discard
      the changes on this screen and load the latest version.
    </Modal>
  );
}
