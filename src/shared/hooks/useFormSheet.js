import { useState } from 'react';
import { useScrollLock } from './useScrollLock';

/**
 * Reusable hook for CRUD form sheets.
 * Manages open/close state, edit vs create mode, form values, and saving state.
 *
 * @param {Object} defaultValues — default form field values for "create" mode
 * @returns form sheet state and helpers
 */
export function useFormSheet(defaultValues) {
  const [isOpen, setIsOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultValues);

  useScrollLock(isOpen);

  const openCreate = () => {
    setForm({ ...defaultValues });
    setEditId(null);
    setIsOpen(true);
  };

  const openEdit = (id, values) => {
    setForm(values);
    setEditId(id);
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setEditId(null);
  };

  const resetAndClose = () => {
    setIsOpen(false);
    setEditId(null);
    setForm({ ...defaultValues });
    setSaving(false);
  };

  return {
    isOpen,
    editId,
    isEdit: !!editId,
    saving,
    setSaving,
    form,
    setForm,
    openCreate,
    openEdit,
    close,
    resetAndClose,
  };
}
