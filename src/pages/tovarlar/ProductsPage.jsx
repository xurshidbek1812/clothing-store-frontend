import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Package2,
  ScanLine,
  ImagePlus,
  Trash2,
  Star,
  Eye,
} from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { API_BASE_URL, apiFetch } from '../../lib/api';
import ProductModal from './components/ProductModal';
import VariantModal from './components/VariantModal';
import ImagePreviewModal from '../../components/ImagePreviewModal';
import ProductDetailsModal from './components/ProductDetailsModal';

const initialProductForm = {
  name: '',
  brand: '',
  categoryId: '',
  gender: '',
  season: '',
  isActive: true,
};

const initialVariantForm = {
  sizeIds: [],
};

const PRODUCTS_WAREHOUSE_STORAGE_KEY = 'clothing_shop_products_warehouse_id';

function SortableVariantItem({ variant }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: variant.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-grab rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition active:cursor-grabbing ${
        isDragging ? 'z-10 bg-white shadow-lg ring-2 ring-blue-200' : 'hover:bg-slate-100'
      }`}
      title="Bosib turib joyini almashtiring"
    >
      {variant.size?.name || '-'}
    </div>
  );
}

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState('');
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

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProduct, setDetailsProduct] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    })
  );

  const resolveWarehouseId = (preferredWarehouseId, activeWarehouses) => {
    if (
      preferredWarehouseId &&
      activeWarehouses.some((warehouse) => warehouse.id === preferredWarehouseId)
    ) {
      return preferredWarehouseId;
    }

    return activeWarehouses[0]?.id || '';
  };

  const saveWarehouseId = (nextWarehouseId) => {
    if (nextWarehouseId) {
      localStorage.setItem(PRODUCTS_WAREHOUSE_STORAGE_KEY, nextWarehouseId);
    } else {
      localStorage.removeItem(PRODUCTS_WAREHOUSE_STORAGE_KEY);
    }
  };

  const loadStaticData = async (preferredWarehouseId = '') => {
    const [categoriesRes, sizesRes, warehousesRes] = await Promise.all([
      apiFetch('/reference/categories'),
      apiFetch('/reference/sizes'),
      apiFetch('/warehouses'),
    ]);

    const activeWarehouses = (warehousesRes || []).filter(
      (warehouse) => warehouse.isActive
    );

    const savedWarehouseId =
      localStorage.getItem(PRODUCTS_WAREHOUSE_STORAGE_KEY) || '';

    const resolvedWarehouseId = resolveWarehouseId(
      preferredWarehouseId || savedWarehouseId,
      activeWarehouses
    );

    setCategories(categoriesRes || []);
    setSizes(sizesRes || []);
    setWarehouses(activeWarehouses);
    setWarehouseId(resolvedWarehouseId);
    saveWarehouseId(resolvedWarehouseId);

    return resolvedWarehouseId;
  };

  const loadProducts = async (targetWarehouseId, currentSearch = search) => {
    const query = `/products?${
      currentSearch.trim()
        ? `search=${encodeURIComponent(currentSearch.trim())}&`
        : ''
    }${targetWarehouseId ? `warehouseId=${encodeURIComponent(targetWarehouseId)}` : ''}`;

    const productsRes = await apiFetch(query);
    setItems(productsRes || []);
  };

  const initPage = async () => {
    setLoading(true);
    try {
      const savedWarehouseId =
        localStorage.getItem(PRODUCTS_WAREHOUSE_STORAGE_KEY) || '';
      const resolvedWarehouseId = await loadStaticData(savedWarehouseId);
      await loadProducts(resolvedWarehouseId, search);
    } catch (error) {
      toast.error(error.message || "Ma'lumotlarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const refreshAll = async (preferredWarehouseId = warehouseId) => {
    setLoading(true);
    try {
      const resolvedWarehouseId = await loadStaticData(preferredWarehouseId);
      await loadProducts(resolvedWarehouseId, search);
    } catch (error) {
      toast.error(error.message || "Ma'lumotlarni yangilashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initPage();
  }, []);

  const handleWarehouseChange = async (nextWarehouseId) => {
    setWarehouseId(nextWarehouseId);
    saveWarehouseId(nextWarehouseId);

    setLoading(true);
    try {
      await loadProducts(nextWarehouseId, search);
    } catch (error) {
      toast.error(error.message || 'Tovarlar yuklanmadi');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e?.preventDefault?.();
    if (!warehouseId) return;

    setLoading(true);
    try {
      await loadProducts(warehouseId, search);
    } catch (error) {
      toast.error(error.message || 'Tovarlar yuklanmadi');
    } finally {
      setLoading(false);
    }
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
      await refreshAll();
    } catch (error) {
      toast.error(error.message || 'Saqlashda xatolik');
    } finally {
      setSavingProduct(false);
    }
  };

  const openVariantModal = (product) => {
    setVariantProduct(product);
    setVariantForm({
      sizeIds: (product.variants || []).map((variant) => variant.sizeId),
    });
    setVariantOpen(true);
  };

  const closeVariantModal = () => {
    setVariantOpen(false);
    setVariantProduct(null);
    setVariantForm(initialVariantForm);
  };

  const submitVariant = async (e) => {
    e.preventDefault();

    if (!variantProduct?.id) {
      toast.error('Tovar topilmadi');
      return;
    }

    const selectedSizeIds = variantForm.sizeIds || [];
    const existingVariants = variantProduct.variants || [];

    const existingSizeIds = new Set(existingVariants.map((variant) => variant.sizeId));
    const newSizeIds = selectedSizeIds.filter((sizeId) => !existingSizeIds.has(sizeId));
    const removedVariants = existingVariants.filter(
      (variant) => !selectedSizeIds.includes(variant.sizeId)
    );

    if (!selectedSizeIds.length) {
      toast.error('Kamida bitta razmer tanlang');
      return;
    }

    setSavingVariant(true);
    try {
      for (const sizeId of newSizeIds) {
        await apiFetch(`/products/${variantProduct.id}/variants`, {
          method: 'POST',
          body: JSON.stringify({ sizeId }),
        });
      }

      for (const variant of removedVariants) {
        await apiFetch(`/products/${variantProduct.id}/variants/${variant.id}`, {
          method: 'DELETE',
        });
      }

      if (!newSizeIds.length && !removedVariants.length) {
        toast.success("O'zgarish yo'q");
      } else {
        toast.success('Razmerlar yangilandi');
      }

      closeVariantModal();
      await refreshAll();
    } catch (error) {
      toast.error(error.message || "Razmerlarni yangilashda xatolik");
    } finally {
      setSavingVariant(false);
    }
  };

  const handleVariantDragEnd = async (product, event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const variants = [...(product.variants || [])];
    const oldIndex = variants.findIndex((v) => v.id === active.id);
    const newIndex = variants.findIndex((v) => v.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(variants, oldIndex, newIndex);

    try {
      setItems((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? {
                ...item,
                variants: reordered,
              }
            : item
        )
      );

      await apiFetch(`/products/${product.id}/variants/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({
          variantIds: reordered.map((v) => v.id),
        }),
      });

      toast.success('Razmerlar tartibi yangilandi');
      await refreshAll();
    } catch (error) {
      toast.error(error.message || 'Razmer tartibini saqlashda xatolik');
      await refreshAll();
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
      await refreshAll();
    } catch (error) {
      toast.error(error.message || 'Rasm yuklashda xatolik');
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      const res = await apiFetch(`/products/images/${imageId}`, {
        method: 'DELETE',
      });

      toast.success(res.message || 'Rasm o‘chirildi');
      await refreshAll();
    } catch (error) {
      toast.error(error.message || 'Rasm o‘chirishda xatolik');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      const res = await apiFetch(`/products/images/${imageId}/primary`, {
        method: 'PATCH',
      });

      toast.success(res.message || 'Asosiy rasm belgilandi');
      await refreshAll();
    } catch (error) {
      toast.error(error.message || 'Asosiy rasmni belgilashda xatolik');
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
                Ombor bo‘yicha tovarlar, rasmlar va razmerlar
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={warehouseId}
              onChange={(e) => handleWarehouseChange(e.target.value)}
              className="min-w-[220px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="">Ombor tanlang</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tovar yoki brand qidiring"
                className="w-full min-w-[260px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
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
                  <th className="w-[280px] pb-3 font-semibold">Rasmlar</th>
                  <th className="pb-3 font-semibold">Nomi</th>
                  <th className="pb-3 font-semibold">Kategoriya</th>
                  <th className="w-[220px] pb-3 font-semibold">Razmerlar</th>
                  <th className="pb-3 font-semibold">Holati</th>
                  <th className="pb-3 text-right font-semibold">Amal</th>
                </tr>
              </thead>

              <tbody>
                {rows.length > 0 ? (
                  rows.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 align-top">
                      <td className="py-3 align-top">
                        <div className="w-[255px] space-y-3">
                          {(item.images || []).length > 0 ? (
                            <div className="max-h-[240px] overflow-y-auto pr-1">
                              <div className="grid grid-cols-2 gap-1.5">
                                {item.images.map((image) => (
                                  <div
                                    key={image.id}
                                    className="rounded-2xl border border-slate-200 p-1"
                                  >
                                    <img
                                      src={`${API_BASE_URL}${image.imageUrl}`}
                                      alt={item.name}
                                      className={`h-[74px] w-full cursor-zoom-in rounded-xl object-cover ${
                                        image.isPrimary ? 'ring-2 ring-blue-300' : ''
                                      }`}
                                      onClick={() => {
                                        setPreviewImage(`${API_BASE_URL}${image.imageUrl}`);
                                        setPreviewTitle(item.name);
                                        setPreviewOpen(true);
                                      }}
                                    />

                                    <div className="mt-1 flex justify-between gap-1">
                                      {!image.isPrimary ? (
                                        <button
                                          type="button"
                                          onClick={() => handleSetPrimary(image.id)}
                                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100"
                                          title="Asosiy qilish"
                                        >
                                          <Star size={12} />
                                        </button>
                                      ) : (
                                        <div className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600">
                                          <Star size={12} />
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteImage(image.id)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                        title="Rasmni o‘chirish"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                              Rasm yo‘q
                            </div>
                          )}

                          <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                            <ImagePlus size={14} />
                            Rasm qo‘shish
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

                      <td className="py-3 text-slate-700">
                        <div className="max-h-[240px] w-[190px] overflow-y-auto pr-1">
                          {item.variants?.length ? (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={(event) => handleVariantDragEnd(item, event)}
                            >
                              <SortableContext
                                items={item.variants.map((variant) => variant.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {item.variants.map((variant) => (
                                    <SortableVariantItem
                                      key={variant.id}
                                      variant={variant}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          ) : (
                            <span className="text-xs text-slate-400">Variant yo‘q</span>
                          )}
                        </div>
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
                            type="button"
                            onClick={() => {
                              setDetailsProduct(item);
                              setDetailsOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <Eye size={14} />
                            Ko‘rish
                          </button>

                          <button
                            onClick={() => openVariantModal(item)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            <ScanLine size={14} />
                            Razmer
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
                    <td colSpan="6" className="py-12 text-center text-sm text-slate-500">
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

      <ProductDetailsModal
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsProduct(null);
        }}
        product={detailsProduct}
        warehouseName={warehouses.find((w) => w.id === warehouseId)?.name || ''}
        onPreviewImage={(url, title) => {
          setPreviewImage(url);
          setPreviewTitle(title);
          setPreviewOpen(true);
        }}
      />

      <ImagePreviewModal
        open={previewOpen}
        imageUrl={previewImage}
        title={previewTitle}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewImage('');
          setPreviewTitle('');
        }}
      />
    </div>
  );
}