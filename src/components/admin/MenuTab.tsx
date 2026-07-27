import { useState } from 'react';
import { useStore } from '@/store/useStore';
import Modal from '@/components/Modal';
import Switch from '@/components/Switch';
import { showToast } from '@/components/Toast';
import type { MenuItem } from '@/types';

const emptyForm = { name: '', cat: '', description: '', price: '', image: '', available: true };

export default function MenuTab() {
  const t = useStore((s) => s.t);
  const menuItems = useStore((s) => s.menuItems);
  const addMenuItem = useStore((s) => s.addMenuItem);
  const updateMenuItem = useStore((s) => s.updateMenuItem);
  const deleteMenuItem = useStore((s) => s.deleteMenuItem);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditId(item.id);
    setForm({
      name: item.name,
      cat: item.cat,
      description: item.description ?? '',
      price: String(item.price),
      image: item.image ?? '',
      available: item.available,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.cat || !form.price) {
      showToast(t('fillFields'), 'error');
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      showToast(t('invalidPrice'), 'error');
      return;
    }
    const payload = {
      name: form.name,
      cat: form.cat,
      description: form.description || null,
      price,
      image: form.image || null,
      available: form.available,
    };
    if (editId) {
      await updateMenuItem(editId, payload);
      showToast(t('itemUpdated'), 'alert');
    } else {
      await addMenuItem(payload);
      showToast(t('itemAdded'), 'alert');
    }
    setModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    await deleteMenuItem(id);
    showToast(t('itemDeleted'), 'alert');
  };

  const toggleAvailable = async (item: MenuItem) => {
    await updateMenuItem(item.id, { available: !item.available });
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div className="section-title" style={{ margin: 0 }}>{t('menu')}</div>
        <button className="btn btn-gold" onClick={openAdd}>+ {t('addItem')}</button>
      </div>

      {menuItems.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem' }}>{t('noMenuItems')}</div>
      ) : (
        <div className="admin-menu-grid">
          {menuItems.map((item) => (
            <div key={item.id} className={`admin-menu-card${!item.available ? ' unavailable' : ''}`}>
              {/* Image */}
              <div className="admin-card-img-wrap">
                {item.image
                  ? <img src={item.image} alt={item.name} className="admin-card-img" />
                  : <div className="admin-card-img-placeholder" />
                }
                <div className="admin-card-img-overlay" />
                {!item.available && (
                  <div className="admin-card-badge">{t('soldOut')}</div>
                )}
              </div>

              {/* Body — overlays the image bottom */}
              <div className="admin-card-body">
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--gold)', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{item.cat}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.15rem', color: 'var(--cream)', margin: '0.15rem 0', textShadow: '0 2px 6px rgba(0,0,0,0.8)', lineHeight: 1.2 }}>{item.name}</div>
                <div className="c-item-rating">
                  <span className="stars">★★★★★</span>
                  <span className="rating-text">4.9 (120+)</span>
                </div>
                {item.description && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.4, marginBottom: '0.5rem', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>{item.description}</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.35rem', color: 'var(--gold)', fontWeight: 800, textShadow: '0 2px 10px rgba(201,168,76,0.4)' }}>${item.price.toFixed(2)}</div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                    <Switch checked={item.available} onChange={() => toggleAvailable(item)} />
                    <button className="btn btn-sm btn-outline" style={{ padding: '0.35rem 0.7rem', fontSize: '0.75rem' }} onClick={() => openEdit(item)}>{t('edit')}</button>
                    <button className="btn btn-sm btn-danger" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', minWidth: '28px' }} onClick={() => handleDelete(item.id)}>×</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <h2 style={{ color: 'var(--gold)', marginBottom: '2rem', fontFamily: "'Playfair Display',serif", fontSize: '1.8rem' }}>
          {editId ? t('editItem') : t('addItem')}
        </h2>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('name')}</label>
            <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('category')}</label>
            <input className="form-input" value={form.cat} onChange={(e) => setForm({ ...form, cat: e.target.value })} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('description')}</label>
          <input className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{t('price')} ($)</label>
            <input className="form-input" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('available')}</label>
            <select className="form-input" value={String(form.available)} onChange={(e) => setForm({ ...form, available: e.target.value === 'true' })}>
              <option value="true">{t('yes')}</option>
              <option value="false">{t('no')}</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{t('imageUrl')}</label>
          <input className="form-input" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
        </div>
        <button className="btn btn-gold btn-full" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }} onClick={handleSave}>
          {t('save')}
        </button>
      </Modal>
    </div>
  );
}
