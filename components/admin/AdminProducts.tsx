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
} from "lucide-react";
import Link from "next/link";
import { products as initialProducts, type Product } from "@/data/products";

export default function AdminProducts() {
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDrafting, setIsDrafting] = useState(false);
  const [draftProduct, setDraftProduct] = useState({
    name: "",
    category: "AI & Automation",
    description: "",
    url: "",
    logo: "/brand/elvaveo-logo.3d7b3289.png",
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setDraftProduct((prev) => ({ ...prev, logo: data.url }));
          showToast("Logo uploaded successfully!");
        }
      } else {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          if (uploadEvent.target?.result) {
            setDraftProduct((prev) => ({
              ...prev,
              logo: String(uploadEvent.target?.result),
            }));
            showToast("Logo preview loaded!");
          }
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setDraftProduct((prev) => ({
            ...prev,
            logo: String(uploadEvent.target?.result),
          }));
          showToast("Logo preview loaded!");
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftProduct.name || !draftProduct.description) return;

    const newProd: Product = {
      id: `custom-${Date.now()}` as any,
      name: draftProduct.name,
      logo: draftProduct.logo || "/brand/elvaveo-logo.3d7b3289.png",
      badge: "An ELVAVEO Product",
      category: draftProduct.category,
      headline: [draftProduct.name, "Next Generation Platform"],
      accentLine: 1,
      description: draftProduct.description,
      cta: "Learn More",
      stats: [
        { label: "Status", value: "Active Dev" },
        { label: "Platform", value: "Cloud SaaS" },
      ],
      accent: "cyan",
      href: draftProduct.url || "https://elvaveo.com",
    };

    const updated = [...productList, newProd];
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      if (res.ok) {
        setProductList(updated);
        showToast(`Added ${newProd.name}! Products updated live on website.`);
        setIsDrafting(false);
        setDraftProduct({
          name: "",
          category: "AI & Automation",
          description: "",
          url: "",
          logo: "/brand/elvaveo-logo.3d7b3289.png",
        });
      } else {
        showToast("Failed to save product.");
      }
    } catch (err) {
      console.error("Error saving product:", err);
      showToast("Failed to save product.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-8 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/90 px-5 py-3 text-sm font-bold text-white shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
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
            onClick={() => setIsDrafting(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-4 text-xs font-bold text-white shadow-md transition hover:opacity-95"
          >
            <Plus size={16} />
            <span>Draft New Product</span>
          </button>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {productList.map((prod) => (
          <article
            key={prod.id}
            className="glass group relative overflow-hidden rounded-[26px] p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:bg-white/95"
          >
            {/* Top row with Logo and Live App link */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                {/* Product Logo / Icon Container */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/90 bg-white/80 p-2 shadow-xs">
                  {prod.logo ? (
                    // Using img for absolute/relative compatibility with uploads & svgs
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

              <a
                href={prod.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-xl border border-blue/20 bg-white/80 px-3 py-1.5 text-xs font-bold text-blue shadow-sm hover:bg-blue hover:text-white transition-colors"
              >
                <span>Live App</span>
                <ArrowUpRight size={14} />
              </a>
            </div>

            {/* Headline & Description */}
            <p className="mt-4 text-[14px] font-semibold text-navy/80">
              {prod.headline.join(" ")}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              {prod.description}
            </p>

            {/* Stats preview box */}
            <div className="mt-6 rounded-2xl border border-white/90 bg-white/60 p-4 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">
                Product Metrics &amp; Performance
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {prod.stats.map((stat, idx) => (
                  <div key={idx} className="rounded-xl bg-white/70 p-2.5 shadow-xs">
                    <p className="text-[10px] font-medium text-muted truncate">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-[13px] font-bold text-navy truncate">
                      {stat.value}
                    </p>
                    {stat.trend && (
                      <span className="text-[9.5px] font-semibold text-emerald-600">
                        {stat.trend}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer row */}
            <div className="mt-5 flex items-center justify-between border-t border-blue/10 pt-4 text-xs text-muted">
              <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Production
              </span>
              <span className="font-mono text-[11px] text-blue truncate max-w-[200px]">
                {prod.href}
              </span>
            </div>
          </article>
        ))}
      </div>

      {/* Draft Product Modal */}
      {isDrafting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsDrafting(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X size={18} />
            </button>

            <h3 className="text-[18px] font-bold text-navy">Draft New Product</h3>
            <p className="mt-1 text-[13px] text-muted">
              Propose or add a new digital product to ELVAVEO with custom logo and details.
            </p>

            <form onSubmit={handleAddDraft} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-navy">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FinloAI, OmniDesk"
                  value={draftProduct.name}
                  onChange={(e) =>
                    setDraftProduct({ ...draftProduct, name: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              {/* Logo Upload & Selection Section */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Product Logo</label>
                  {isUploading && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue">
                      <RefreshCw size={12} className="animate-spin" /> Uploading...
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
                        <span>Upload Logo (PNG, SVG, JPG)</span>
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
                      placeholder="e.g. /brand/finlo-logo.svg or https://..."
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

              <div>
                <label className="text-xs font-bold text-navy">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FinTech, AI Agent, Productivity"
                  value={draftProduct.category}
                  onChange={(e) =>
                    setDraftProduct({ ...draftProduct, category: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Product Subdomain / URL</label>
                <input
                  type="url"
                  placeholder="https://app.elvaveo.com"
                  value={draftProduct.url}
                  onChange={(e) =>
                    setDraftProduct({ ...draftProduct, url: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-navy">Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What does this product solve and who is it for?"
                  value={draftProduct.description}
                  onChange={(e) =>
                    setDraftProduct({ ...draftProduct, description: e.target.value })
                  }
                  className="mt-1.5 w-full rounded-xl border border-blue/20 bg-ice px-3.5 py-2.5 text-xs font-medium text-navy focus:border-blue focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDrafting(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-muted hover:text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="rounded-xl bg-gradient-to-r from-cyan via-blue to-violet px-5 py-2.5 text-xs font-bold text-white shadow-md hover:opacity-95 disabled:opacity-50"
                >
                  {isSaving ? "Saving Live..." : "Add & Save Live"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
