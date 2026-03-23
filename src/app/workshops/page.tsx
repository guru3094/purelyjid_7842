'use client';
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Icon from '@/components/ui/AppIcon';
import { createClient } from '@/lib/supabase/client';

interface WorkshopCatalogue {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  thumbnail_url: string | null;
  download_count: number;
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function WorkshopsPage() {
  const [catalogues, setCatalogues] = useState<WorkshopCatalogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalogues = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from('workshop_catalogues')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (data) setCatalogues(data);
      } catch {}
      finally { setLoading(false); }
    };
    fetchCatalogues();
  }, []);

  const handleDownload = async (catalogue: WorkshopCatalogue) => {
    setDownloading(catalogue.id);
    try {
      const supabase = createClient();
      await supabase
        .from('workshop_catalogues')
        .update({ download_count: catalogue.download_count + 1 })
        .eq('id', catalogue.id);

      const link = document.createElement('a');
      link.href = catalogue.file_url;
      link.download = catalogue.file_name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCatalogues((prev) =>
        prev.map((c) => c.id === catalogue.id ? { ...c, download_count: c.download_count + 1 } : c)
      );
    } catch {}
    finally { setDownloading(null); }
  };

  return (
    <main className="bg-[#FAF6F0] min-h-screen overflow-x-hidden">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Icon name="AcademicCapIcon" size={14} className="text-primary" />
            <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-primary">Workshops</span>
          </div>
          <h1 className="font-display italic text-5xl md:text-6xl font-semibold text-foreground mb-4">
            Learn the Art of Resin
          </h1>
          <p className="text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Download our workshop catalogues to explore upcoming sessions, pricing, and what you'll create. From beginner pours to advanced techniques.
          </p>
        </div>
      </section>

      {/* Catalogues Grid */}
      <section className="pb-24 px-6">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] overflow-hidden animate-pulse">
                  <div className="h-48 bg-[#EDE8E0]" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 w-3/4 bg-[#EDE8E0] rounded" />
                    <div className="h-4 w-full bg-[#EDE8E0] rounded" />
                    <div className="h-10 w-full bg-[#EDE8E0] rounded-full mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : catalogues.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Icon name="AcademicCapIcon" size={28} className="text-primary" />
              </div>
              <h3 className="font-display italic text-2xl font-semibold text-foreground mb-2">Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Workshop catalogues will be available here soon. Check back or follow us on Instagram for updates.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catalogues.map((cat) => (
                <div key={cat.id} className="bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] overflow-hidden hover:shadow-card transition-shadow group">
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-[#FAF6F0] to-[#EDE8E0] flex items-center justify-center overflow-hidden">
                    {cat.thumbnail_url ? (
                      <img
                        src={cat.thumbnail_url}
                        alt={`${cat.title} workshop catalogue thumbnail`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Icon name="DocumentArrowDownIcon" size={28} className="text-primary" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">PDF Catalogue</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                      <Icon name="ArrowDownTrayIcon" size={12} className="text-muted-foreground" />
                      <span className="text-[10px] font-bold text-muted-foreground">{cat.download_count}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="font-display italic text-xl font-semibold text-foreground mb-2">{cat.title}</h3>
                    {cat.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2">{cat.description}</p>
                    )}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Icon name="DocumentIcon" size={13} />
                        <span>{cat.file_name}</span>
                      </div>
                      {cat.file_size > 0 && (
                        <span className="text-xs text-muted-foreground">{formatFileSize(cat.file_size)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownload(cat)}
                      disabled={downloading === cat.id}
                      className="w-full h-11 rounded-full bg-foreground text-[#FAF6F0] text-xs font-semibold uppercase tracking-[0.2em] hover:bg-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {downloading === cat.id ? (
                        <><div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" />Downloading…</>
                      ) : (
                        <><Icon name="ArrowDownTrayIcon" size={14} />Download Catalogue</>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 bg-white rounded-3xl border border-[rgba(196,120,90,0.12)] p-8 md:p-12 text-center">
            <h2 className="font-display italic text-3xl font-semibold text-foreground mb-3">
              Want to Book a Workshop?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Reach out directly to reserve your spot or ask about custom group sessions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="https://wa.me/919999999999?text=Hi%20PurelyJid!%20I%27d%20like%20to%20book%20a%20workshop.%20Could%20you%20share%20available%20dates%3F"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-green-500 text-white text-xs font-semibold uppercase tracking-[0.2em] hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Us
              </a>
              <a
                href="tel:+919999999999"
                className="inline-flex items-center gap-2 h-11 px-6 rounded-full border border-[rgba(196,120,90,0.3)] text-foreground text-xs font-semibold uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-colors"
              >
                <Icon name="PhoneIcon" size={14} />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
