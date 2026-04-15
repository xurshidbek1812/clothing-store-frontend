import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, Package2, ScanLine, ImagePlus, Trash2 } from 'lucide-react';
import { API_BASE_URL, apiFetch } from '../../lib/api';
import ProductModal from './components/ProductModal';
import VariantModal from './components/VariantModal';

const initialProductForm = {
  name: '',
  brand: '',
  categoryId: '',
  gender: '',
  season: '',
  isActive: true,
};

const initialVariantForm = {
  sizeId: '',
};

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');

  const [productOpen, setProductOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [productForm, setProductForm] = useState(initialProductForm);
  const [savingProduct, setSavingProduct] = useState(false);

  const [variantOpen, setVariantOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState(null);
  const [variantForm, setVariantForm] = useState(initialVariantForm);
  const [savingVariant, setSavingVariant] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes, sizesRes] = await Promise.all([
        apiFetch(`/products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`),
        apiFetch('/reference/categories'),
        apiFetch('/reference/sizes'),
      ]);

      setItems(productsRes || []);
      setCategories(categoriesRes || []);
      setSizes(sizesRes || []);
    } catch (error) {
      toast.error(error.message || 'Tovarlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (e) => {
    e?.preventDefault?.();
    loadData();
  };

  const openCreate = () => {
    setEditingItem(null);
    setProductForm(initialProductForm);
    setProductOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setProductForm({
      name: item.name || '',
      brand: item.brand || '',
      categoryId: item.categoryId || '',
      gender: item.gender || '',
      season: item.season || '',
      isActive: item.isActive ?? true,
    });
    setProductOpen(true);
  };

  const closeProductModal = () => {
    setProductOpen(false);
    setEditingItem(null);
    setProductForm(initialProductForm);
  };

  const submitProduct = async (e) => {
    e.preventDefault();

    const payload = {
      name: String(productForm.name || '').trim(),
      brand: productForm.brand ? String(productForm.brand).trim() : null,
      categoryId: productForm.categoryId || null,
      gender: productForm.gender ? String(productForm.gender).trim() : null,
      season: productForm.season ? String(productForm.season).trim() : null,
      isActive: Boolean(productForm.isActive),
    };

    if (!payload.name) {
      toast.error('Tovar nomi majburiy');
      return;
    }

    setSavingProduct(true);
    try {
      if (editingItem) {
        await apiFetch(`/products/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        toast.success('Tovar yangilandi');
      } else {
        await apiFetch('/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Tovar yaratildi');
      }

      closeProductModal();
      loadData();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSavingProduct(false);
    }
  };

  const openVariantModal = (product) => {
    setVariantProduct(product);
    setVariantForm(initialVariantForm);
    setVariantOpen(true);
  };

  const closeVariantModal = () => {
    setVariantOpen(false);
    setVariantProduct(null);
    setVariantForm(initialVariantForm);
  };

  const submitVariant = async (e) => {
    e.preventDefault();

    const payload = {
      sizeId: variantForm.sizeId,
    };

    if (!variantProduct?.id) {
      toast.error('Tovar topilmadi');
      return;
    }

    if (!payload.sizeId) {
      toast.error('Razmer tanlang');
      return;
    }

    setSavingVariant(true);
    try {
      await apiFetch(`/products/${variantProduct.id}/variants`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success("Variant qo‘shildi");
      closeVariantModal();
      loadData();
    } catch (error) {
      toast.error(error.message || "Variant qo‘shishda xatolik");
    } finally {
      setSavingVariant(false);
    }
  };

  const handleUploadImage = async (productId, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const raw = localStorage.getItem('clothing_shop_auth');
      const auth = raw ? JSON.parse(raw) : null;

      const token = auth?.token;
      const activeStoreId = auth?.activeStoreId;

      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/image`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(activeStoreId ? { 'x-store-id': activeStoreId } : {}),
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || 'Rasm yuklashda xatolik');
      }

      toast.success(data.message || 'Rasm yuklandi');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Rasm yuklashda xatolik');
    }
  };

  const handleDeleteImage = async (productId) => {
    try {
      const res = await apiFetch(`/products/${productId}/image`, {
        method: 'DELETE',
      });

      toast.success(res.message || 'Rasm o‘chirildi');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Rasm o‘chirishda xatolik');
    }
  };

  const rows = useMemo(() => items, [items]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Package2 size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Tovarlar
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Tovarlar ro‘yxati, rasm, kategoriya va variantlar
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tovar, brand yoki barcode qidiring"
                className="w-full min-w-[280px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Qidirish
              </button>
            </form>

            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Yangi tovar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Yuklanmoqda...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="pb-3 font-semibold">Rasm</th>
                  <th className="pb-3 font-semibold">Nomi</th>
                  <th className="pb-3 font-semibold">Kategoriya</th>
                  <th className="pb-3 font-semibold">Brend</th>
                  <th className="pb-3 font-semibold">Jinsi</th>
                  <th className="pb-3 font-semibold">Mavsumi</th>
                  <th className="pb-3 font-semibold">Variantlar</th>
                  <th className="pb-3 font-semibold">Qoldiq</th>
                  <th className="pb-3 font-semibold">Holati</th>
                  <th className="pb-3 text-right font-semibold">Amal</th>
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  rows.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 align-top">
                      <td className="py-3">
                        <div className="flex min-w-[170px] items-start gap-3">
                          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                            {item.imageUrl ? (
                              <img
                                src={`${API_BASE_URL}${item.imageUrl}`}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                                Rasm yo‘q
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                              <ImagePlus size={14} />
                              Rasm
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUploadImage(item.id, file);
                                  e.target.value = '';
                                }}
                              />
                            </label>

                            {item.imageUrl ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(item.id)}
                                className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"
                              >
                                <Trash2 size={14} />
                                O‘chirish
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
                          </p>
                        </div>
                      </td>

                      <td className="py-3 text-slate-700">{item.category?.name || '-'}</td>
                      <td className="py-3 text-slate-700">{item.brand || '-'}</td>
                      <td className="py-3 text-slate-700">{item.gender || '-'}</td>
                      <td className="py-3 text-slate-700">{item.season || '-'}</td>

                      <td className="py-3 text-slate-700">
                        <div className="space-y-1">
                          {item.variants?.length ? (
                            item.variants.map((variant) => (
                              <div
                                key={variant.id}
                                className="rounded-xl bg-slate-50 px-3 py-2 text-xs"
                              >
                                <div className="font-semibold text-slate-800">
                                  {variant.size?.name || '-'}
                                </div>
                                <div className="text-slate-500">
                                  Barcode: {variant.barcode || '-'}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">Variant yo‘q</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 font-semibold text-slate-900">
                        {Number(item.totalStock || 0).toLocaleString('uz-UZ')}
                      </td>

                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.isActive
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600'
                          }`}
                        >
                          {item.isActive ? 'Faol' : 'Nofaol'}
                        </span>
                      </td>

                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openVariantModal(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <ScanLine size={14} />
                            Variant
                          </button>

                          <button
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Pencil size={14} />
                            Tahrirlash
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-sm text-slate-500">
                      Hozircha tovarlar yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductModal
        open={productOpen}
        onClose={closeProductModal}
        onSubmit={submitProduct}
        form={productForm}
        setForm={setProductForm}
        saving={savingProduct}
        editingItem={editingItem}
        categories={categories}
        onUploadImage={handleUploadImage}
        onDeleteImage={handleDeleteImage}
      />

      <VariantModal
        open={variantOpen}
        onClose={closeVariantModal}
        onSubmit={submitVariant}
        form={variantForm}
        setForm={setVariantForm}
        saving={savingVariant}
        sizes={sizes}
        product={variantProduct}
      />
    </div>
  );
}