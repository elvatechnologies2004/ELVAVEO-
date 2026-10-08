"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Layers,
  ExternalLink,
  Plus,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  X,
  Globe,
  Tag,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { products as initialProducts, type Product } from "@/data/products";

export default function AdminProducts() {
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draftProduct, setDraftProduct] = useState({
    name: "",
    category: "AI & Software",
    headlineLine1: "",
    headlineLine2: "Next-Generation Intelligence",
    description: "",
    url: "",
    logo: "/brand/elvaveo-logo.3d7b3289.png",
    cta: "Learn More",
    accent: "cyan" as "cyan" | "violet",
    stats1Label: "Operational Efficiency",
    stats1Value: "+45%",
    stats2Label: "AI Insights",
    stats2Value: "Real-Time",
  });

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        if (data.products && Array.isArray(data.products)) {
          setProductList(data.products);
        }
      } else {
        showToast("Could not load products from server", "error");
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      showToast("Network error fetching products", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setDraftProduct({
      name: "",
      category: "AI & Software",
      headlineLine1: "",
      headlineLine2: "Next-Generation Intelligence",
      description: "",
      url: "",
      logo: "/brand/elvaveo-logo.3d7b3289.png",
      cta: "Learn More",
      accent: "cyan",
      stats1Label: "Operational Efficiency",
      stats1Value: "+45%",
      stats2Label: "AI Insights",
      stats2Value: "Real-Time",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingId(prod.id);
    setDraftProduct({
      name: prod.name,
      category: prod.category || "AI & Software",
      headlineLine1: prod.headline?.[0] || prod.name,
      headlineLine2: prod.headline?.[1] || "",
      description: prod.description || "",
      url: prod.href || "",
      logo: prod.logo || "/brand/elvaveo-logo.3d7b3289.png",
      cta: prod.cta || "Learn More",
      accent: (prod.accent === "violet" ? "violet" : "cyan") as "cyan" | "violet",
      stats1Label: prod.stats?.[0]?.label || "Metric 1",
      stats1Value: prod.stats?.[0]?.value || "100%",
      stats2Label: prod.stats?.[1]?.label || "Metric 2",
      stats2Value: prod.stats?.[1]?.value || "Real-Time",
    });
    setIsModalOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast("File is too large. Max size is 8MB.", "error");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.url) {
        setDraftProduct((prev) => ({ ...prev, logo: data.url }));
        showToast("Logo uploaded successfully!", "success");
      } else {
        showToast(data.error || "Failed to upload logo file.", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Failed to connect to file upload service.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = draftProduct.name.trim();
    const trimmedDesc = draftProduct.description.trim();

    if (!trimmedName || !trimmedDesc) {
      showToast("Product name and description are required.", "error");
      return;
    }

    // Auto-normalize URL
    let finalUrl = draftProduct.url.trim();
    if (!finalUrl) {
      const cleanSlug = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "");
      finalUrl = `https://${cleanSlug || "product"}.elvaveo.com`;
    } else if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    // Determine target ID
    let targetId = editingId;
    if (!targetId) {
      const baseSlug =
        trimmedName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || "product";

      targetId = baseSlug;
      let counter = 1;
      while (productList.some((p) => p.id === targetId)) {
        targetId = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const prodPayload: Product = {
      id: targetId,
      name: trimmedName,
      logo: draftProduct.logo || "/brand/elvaveo-logo.3d7b3289.png",
      badge: "An ELVAVEO Product",
      category: draftProduct.category.trim() || "AI & Software",
      headline: [
        draftProduct.headlineLine1.trim() || trimmedName,
        draftProduct.headlineLine2.trim() || "Next-Generation Intelligence",
      ],
      accentLine: 1,
      description: trimmedDesc,
      cta: draftProduct.cta.trim() || "Learn More",
      stats: [
        {
          label: draftProduct.stats1Label.trim() || "Efficiency",
          value: draftProduct.stats1Value.trim() || "+45%",
          trend: "Active",
        },
        {
          label: draftProduct.stats2Label.trim() || "AI Insights",
          value: draftProduct.stats2Value.trim() || "Real-Time",
          trend: "Predictive",
        },
        { label: "Architecture", value: "Cloud SaaS", trend: "Fast" },
        { label: "Status", value: "Production", trend: "99.9%" },
      ],
      accent: draftProduct.accent || "cyan",
      href: finalUrl,
    };

    // If editing, replace existing; if adding, append newly created product
    const existingIndex = editingId
      ? productList.findIndex((p) => p.id === editingId)
      : -1;

    const updated =
      existingIndex >= 0
        ? productList.map((p, idx) => (idx === existingIndex ? prodPayload : p))
        : [...productList, prodPayload];

    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setProductList(data.products || updated);
        showToast(
          editingId
            ? `Updated ${prodPayload.name}! Changes saved live.`
            : `Added ${prodPayload.name}! Products updated live on website.`,
          "success"
        );
        setIsModalOpen(false);
      } else {
        showToast(data.error || "Failed to save product.", "error");
      }
    } catch (err: any) {
      console.error("Error saving product:", err);
      showToast(err?.message || "Failed to save product.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from live products?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const remaining = productList.filter((p) => p.id !== id);
        setProductList(data.products || remaining);
        showToast(`Removed "${name}" from live products.`, "success");
      } else {
        showToast(data.error || "Failed to delete product.", "error");
      }
    } catch (err: any) {
      console.error("Error deleting product:", err);
      showToast("Error communicating with products server.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification with top-most z-index */}
      {toastMessage && (
        <div
          className={`fixed top-24 right-8 z-[100] flex items-center gap-2.5 rounded-2xl border px-5 py-3 text-sm font-bold shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/90 text-white"
              : "border-rose-500/30 bg-rose-500/95 text-white"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner & Action */}
      <div className="glass flex flex-col justify-between gap-4 rounded-[22px] p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/15 px-3 py-1 text-[11px] font-bold text-cyan-700">
              <Sparkles size={13} />
              Connected Live to Website
            </span>
            <Link
              href="/products"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue hover:underline"
            >
              <span>View Live on /products</span>
              <ExternalLink size={12} />
            </Link>
          </div>
          <h2 className="mt-2 text-[20px] font-bold text-navy">
            Live Products &amp; SaaS Ecosystem
          </h2>
          <p className="text-[13px] text-muted">
            Manage ELVAVEO proprietary digital products across public pages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue/20 bg-white/80 text-navy hover:bg-white transition-colors"
            title="Reload products from database"
          >
            <RefreshCw size={15} className={isLoading ? "animate-spin text-blue" : ""} />
          </button>

          <button
            onClick={openAddModal}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-4 text-xs font-bold text-white shadow-md transition hover:opacity-95"
          >
            <Plus size={16} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {productList.map((prod) => (
          <article
            key={prod.id}
            className="glass group relative flex flex-col justify-between overflow-hidden rounded-[26px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/95"
          >
            <div>
              {/* Top row with Logo and Actions */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  {/* Product Logo Container */}
                  <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/90 bg-white/80 p-2 shadow-xs">
                    {prod.logo ? (
                      <img
                        src={prod.logo}
                        alt={prod.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <Layers size={24} className="text-blue" />
                    )}
                  </div>

                  <div>
                    <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue">
                      {prod.category}
                    </span>
                    <h3 className="mt-1 text-[20px] font-extrabold text-navy">
                      {prod.name}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(prod)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue/15 bg-white/80 text-blue hover:bg-blue hover:text-white transition-colors"
                    title="Edit product"
                  >
                    <Edit2 size={13} />
                  </button>

                  <a
                    href={prod.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border border-blue/20 bg-white/80 px-2.5 py-1.5 text-xs font-bold text-blue shadow-sm hover:bg-blue hover:text-white transition-colors"
                  >
                    <span>Visit</span>
                    <ArrowUpRight size={13} />
                  </a>

                  <button
                    onClick={() => handleDeleteProduct(prod.id, prod.name)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    title="Delete product"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Headline & Description */}
              <p className="mt-4 text-[14px] font-semibold text-navy/80">
                {prod.headline ? prod.headline.join(" ") : prod.name}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted line-clamp-3">
                {prod.description}
              </p>

              {/* Stats preview box */}
              <div className="mt-5 rounded-2xl border border-white/90 bg-white/60 p-3.5 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                  Product Metrics &amp; Performance
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {(prod.stats || []).slice(0, 4).map((stat, idx) => (
                    <div key={idx} className="rounded-xl bg-white/80 p-2 shadow-xs">
                      <p className="text-[9.5px] font-medium text-muted truncate">
                        {stat.label}
                      </p>
                      <p className="mt-0.5 text-[12.5px] font-bold text-navy truncate">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer row */}
            <div className="mt-5 flex items-center justify-between border-t border-blue/10 pt-4 text-xs text-muted">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live on Website
              </span>
              <span className="font-mono text-[11px] text-blue truncate max-w-[170px]">
                {prod.href.replace(/^https?:\/\//, "")}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue/10 px-2.5 py-0.5 text-[11px] font-bold text-blue">
                {editingId ? "Update Live" : "New Creation"}
              </span>
            </div>

            <h3 className="mt-1 text-[20px] font-extrabold text-navy">
              {editingId ? `Edit ${draftProduct.name}` : "Add New Product"}
            </h3>
            <p className="mt-1 text-[13px] text-muted">
              {editingId
                ? "Update product details, logo, and metrics live on the website."
                : "Publish a new proprietary digital product to ELVAVEO. It will be immediately live across all public pages."}
            </p>

            <form onSubmit={handleSaveProduct} className="mt-6 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-navy">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAMVIA, Finlo, AutoFlow"
                    value={draftProduct.name}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, name: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-navy">Category *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EdTech & AI, FinTech, SaaS"
                    value={draftProduct.category}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, category: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Headlines Customization */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-navy">Headline (Line 1)</label>
                  <input
                    type="text"
                    placeholder="e.g. Intelligent School Management"
                    value={draftProduct.headlineLine1}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, headlineLine1: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-navy">
                    Headline (Line 2 Gradient)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AI-Powered Educational Insights"
                    value={draftProduct.headlineLine2}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, headlineLine2: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Logo Upload & Selection Section */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Product Logo</label>
                  {isUploading && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue">
                      <RefreshCw size={12} className="animate-spin" /> Uploading image...
                    </span>
                  )}
                </div>

                <div className="mt-1.5 flex flex-col sm:flex-row items-center gap-3.5 rounded-2xl border border-blue/20 bg-ice p-3.5">
                  {/* Live Logo Preview Box */}
                  <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/90 bg-white p-2 shadow-xs">
                    {draftProduct.logo ? (
                      <img
                        src={draftProduct.logo}
                        alt="Logo preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon size={24} className="text-muted" />
                    )}
                  </div>

                  {/* Upload button & Custom URL */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-blue/20 bg-white px-3 py-1.5 text-xs font-bold text-blue hover:bg-blue/5 transition-colors shadow-xs">
                        <Upload size={13} />
                        <span>Upload Logo File (SVG, PNG, JPG)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="sr-only"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="e.g. /brand/camvia-logo.svg or /uploads/..."
                      value={draftProduct.logo}
                      onChange={(e) =>
                        setDraftProduct({ ...draftProduct, logo: e.target.value })
                      }
                      className="w-full rounded-lg border border-blue/15 bg-white px-3 py-1.5 text-xs font-mono text-navy focus:border-blue focus:outline-none"
                    />
                  </div>
                </div>

                {/* Preset Brand Logos Quick Selection */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10.5px] font-semibold text-muted">Presets:</span>
                  {[
                    { label: "CAMVIA Logo", path: "/brand/camvia-logo.svg" },
                    { label: "Finlo Logo", path: "/brand/finlo-logo.svg" },
                    { label: "FinloCRM Logo", path: "/brand/finlocrm-logo.png" },
                    { label: "ELVAVEO Brand", path: "/brand/elvaveo-logo.3d7b3289.png" },
                  ].map((preset) => (
                    <button
                      key={preset.path}
                      type="button"
                      onClick={() => setDraftProduct({ ...draftProduct, logo: preset.path })}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                        draftProduct.logo === preset.path
                          ? "bg-blue text-white shadow-xs"
                          : "bg-white/80 border border-blue/15 text-navy/80 hover:bg-white hover:text-blue"
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Website URL & CTA */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-navy">Website / Subdomain</label>
                  <input
                    type="text"
                    placeholder="e.g. camvia.elvaveo.com or https://..."
                    value={draftProduct.url}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, url: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-navy">CTA Button Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Learn More, Launch App"
                    value={draftProduct.cta}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, cta: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Accent style */}
              <div>
                <label className="text-xs font-bold text-navy">Accent Style Glow</label>
                <div className="mt-1.5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftProduct({ ...draftProduct, accent: "cyan" })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      draftProduct.accent === "cyan"
                        ? "border-cyan bg-cyan/15 text-cyan-700 shadow-xs"
                        : "border-blue/15 bg-ice text-muted hover:text-navy"
                    }`}
                  >
                    Cyan Aura (Tech &amp; AI)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraftProduct({ ...draftProduct, accent: "violet" })}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      draftProduct.accent === "violet"
                        ? "border-violet bg-violet/15 text-violet-700 shadow-xs"
                        : "border-blue/15 bg-ice text-muted hover:text-navy"
                    }`}
                  >
                    Violet Aura (CRM &amp; Growth)
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-navy">Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What does this product do and who does it help?"
                  value={draftProduct.description}
                  onChange={(e) =>
                    setDraftProduct({ ...draftProduct, description: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-navy">Metric 1</label>
                  <input
                    type="text"
                    placeholder="Label (e.g. Operational Efficiency)"
                    value={draftProduct.stats1Label}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, stats1Label: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-blue/20 bg-ice px-3 py-2 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. +45%)"
                    value={draftProduct.stats1Value}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, stats1Value: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3 py-2 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-navy">Metric 2</label>
                  <input
                    type="text"
                    placeholder="Label (e.g. AI Insights)"
                    value={draftProduct.stats2Label}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, stats2Label: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-blue/20 bg-ice px-3 py-2 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Real-Time)"
                    value={draftProduct.stats2Value}
                    onChange={(e) =>
                      setDraftProduct({ ...draftProduct, stats2Value: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3 py-2 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving Live..." : editingId ? "Save Changes" : "Publish & Save Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
