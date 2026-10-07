"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { products as initialProducts, type Product } from "@/data/products";

export default function AdminProducts() {
  const [productList, setProductList] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isDrafting, setIsDrafting] = useState(false);
  const [draftProduct, setDraftProduct] = useState({
    name: "",
    category: "AI & Automation",
    description: "",
    url: "",
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

  const handleAddDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftProduct.name || !draftProduct.description) return;

    const newProd: Product = {
      id: `custom-${Date.now()}` as any,
      name: draftProduct.name,
      logo: "/brand/elvaveo-logo.png",
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
        setDraftProduct({ name: "", category: "AI & Automation", description: "", url: "" });
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
            {/* Top row */}
            <div className="flex items-start justify-between">
              <div>
                <span className="rounded-full bg-blue/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue">
                  {prod.category}
                </span>
                <h3 className="mt-2 text-[22px] font-extrabold text-navy">
                  {prod.name}
                </h3>
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
              <span className="font-mono text-[11px] text-blue">{prod.href}</span>
            </div>
          </article>
        ))}
      </div>

      {/* Draft Product Modal */}
      {isDrafting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl sm:p-8">
            <button
              onClick={() => setIsDrafting(false)}
              className="absolute right-5 top-5 rounded-full p-2 text-muted hover:bg-black/5"
            >
              <X size={18} />
            </button>

            <h3 className="text-[18px] font-bold text-navy">Draft New Product</h3>
            <p className="mt-1 text-[13px] text-muted">
              Propose or add a new digital product to ELVAVEO. It will be saved live into database.
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
                  disabled={isSaving}
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
