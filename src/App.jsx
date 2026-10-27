import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LockKeyhole,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Settings,
  Sun,
  Trash2,
  X
} from "lucide-react";

const emptyProduct = { name: "", category: "Linho natural", description: "", price: "", promoPrice: "", image: "", tag: "" };
const defaultSiteSettings = {
  siteName: "Atelier Lume",
  tagline: "Cortinas para a sua casa",
  logoImageUrl: "",
  faviconUrl: "/favicon.svg",
  metaDescription: "Veja os modelos de cortinas da Atelier Lume. Consulte os preços e fale connosco para esclarecer dúvidas.",
  heroEyebrow: "Conheça os modelos",
  heroTitle: "A cortina certa muda a divisão.",
  heroDescription: "Veja os modelos disponíveis e fale connosco para escolher o tecido e o tamanho ideais.",
  heroButtonLabel: "Ver cortinas",
  whatsappMessage: "Olá! Gostaria de saber mais sobre as cortinas.",
  contactEmail: "",
  contactPhone: "",
  whatsappNumber: "",
  contactAddress: "",
  instagramUrl: ""
};
const money = new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 });
const productTags = ["", "Promoção", "Novo", "Esgotado"];
const allCategoriesValue = "__all__";
const isAdminPath = () => window.location.pathname.replace(/\/+$/, "") === "/admin";

function normalizeProductTag(tag) {
  return tag?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function isPromotion(product) {
  const promoPrice = Number(product.promoPrice);
  return normalizeProductTag(product.tag) === "promocao"
    && Number.isFinite(promoPrice)
    && promoPrice > 0
    && promoPrice < Number(product.price);
}

function getSavedTheme() {
  const savedTheme = window.localStorage.getItem("atelier-theme");
  if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getProductTagClass(tag) {
  const normalizedTag = normalizeProductTag(tag);
  if (normalizedTag === "promocao") return "product-tag-promotion";
  if (normalizedTag === "novo") return "product-tag-new";
  if (normalizedTag === "esgotado") return "product-tag-sold-out";
  return "";
}

function getWhatsAppUrl(number, message) {
  const digits = number.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

async function request(path, options = {}) {
  const response = await fetch(path, options);
  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir o pedido.");
  return data;
}

function App() {
  const [products, setProducts] = useState([]);
  const [siteSettings, setSiteSettings] = useState(defaultSiteSettings);
  const [activeCategory, setActiveCategory] = useState(allCategoriesValue);
  const [heroIndex, setHeroIndex] = useState(0);
  const [page, setPage] = useState(() => isAdminPath() ? "admin" : "home");
  const [theme, setTheme] = useState(getSavedTheme);
  const [token, setToken] = useState(() => sessionStorage.getItem("atelier-admin-token") || "");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type, id: Date.now() });
  }

  async function loadProducts() {
    try {
      setProducts(await request("/api/products"));
    } catch (loadError) {
      showToast(loadError.message, "error");
    }
  }

  async function loadSiteSettings() {
    try {
      setSiteSettings(await request("/api/settings"));
    } catch (loadError) {
      showToast(loadError.message, "error");
    }
  }

  useEffect(() => {
    loadProducts();
    loadSiteSettings();
  }, []);

  useEffect(() => {
    document.title = `${siteSettings.siteName} — ${siteSettings.tagline}`;
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", siteSettings.metaDescription);

    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement("link");
      icon.rel = "icon";
      document.head.appendChild(icon);
    }
    icon.href = siteSettings.faviconUrl || "/favicon.svg";
  }, [siteSettings]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("atelier-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), toast.type === "error" ? 7000 : 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [page]);

  useEffect(() => {
    function handleHistoryChange() {
      setPage(isAdminPath() ? "admin" : "home");
      setMobileMenuOpen(false);
    }

    window.addEventListener("popstate", handleHistoryChange);
    return () => window.removeEventListener("popstate", handleHistoryChange);
  }, []);

  useEffect(() => {
    if (!token) return;
    request("/api/admin/session", { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {})
      .catch(() => {
        sessionStorage.removeItem("atelier-admin-token");
        setToken("");
        showToast("A sessão expirou. Entre novamente para continuar.", "error");
      });
  }, [token]);

  const categories = useMemo(
    () => [
      { value: allCategoriesValue, label: "Todos" },
      ...[...new Set(products.map((product) => product.category))]
        .map((category) => ({ value: category, label: category }))
    ],
    [products]
  );
  const visibleProducts = products.filter(
    (product) => activeCategory === allCategoriesValue || product.category === activeCategory
  );
  const promotionalProducts = products.filter(isPromotion);
  const newProducts = products.filter((product) => normalizeProductTag(product.tag) === "novo");
  const featuredProducts = promotionalProducts.length > 0 ? promotionalProducts : newProducts;
  const featuredProduct = featuredProducts[heroIndex];
  const whatsappUrl = getWhatsAppUrl(siteSettings.whatsappNumber, siteSettings.whatsappMessage || "");

  useEffect(() => {
    setHeroIndex((currentIndex) => Math.min(currentIndex, Math.max(featuredProducts.length - 1, 0)));
  }, [featuredProducts.length]);

  useEffect(() => {
    if (featuredProducts.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setHeroIndex((currentIndex) => (currentIndex + 1) % featuredProducts.length);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [featuredProducts.length]);

  function moveHero(direction) {
    setHeroIndex((currentIndex) => (
      currentIndex + direction + featuredProducts.length
    ) % featuredProducts.length);
  }

  function navigateTo(nextPage) {
    const nextPath = nextPage === "admin" ? "/admin" : "/";
    if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
    setPage(nextPage);
    setMobileMenuOpen(false);
  }

  function signOut() {
    request("/api/admin/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
    sessionStorage.removeItem("atelier-admin-token");
    setToken("");
    navigateTo("home");
  }

  return (
    <div className="site-shell">
      {page === "home" && <header className="site-header">
        <a className="brand" href="#inicio" onClick={() => navigateTo("home")} aria-label={`${siteSettings.siteName}, início`}>
          {siteSettings.logoImageUrl
            ? <img className="brand-logo" src={siteSettings.logoImageUrl} alt="" />
            : <span className="brand-mark"><span /></span>}
          <span className="brand-name">{siteSettings.siteName}<small>{siteSettings.tagline}</small></span>
        </a>
        <button className="mobile-menu-toggle icon-button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Abrir menu">
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <nav className={mobileMenuOpen ? "main-nav is-open" : "main-nav"}>
          <a href="#colecao" onClick={() => { navigateTo("home"); setMobileMenuOpen(false); }}>Coleção</a>
          <a href="#atelier" onClick={() => setMobileMenuOpen(false)}>Como escolher</a>
          <a href="#contacto" onClick={() => setMobileMenuOpen(false)}>Contactos</a>
          <button className="theme-toggle" onClick={() => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark")} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} aria-pressed={theme === "dark"}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
          </button>
        </nav>
      </header>}

      {page === "admin" ? (
        <AdminPanel
          products={products}
          siteSettings={siteSettings}
          theme={theme}
          token={token}
          onToggleTheme={() => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark")}
          notify={showToast}
          onSiteSettingsChanged={(updatedSettings) => setSiteSettings(updatedSettings)}
          onLogin={(newToken) => {
            sessionStorage.setItem("atelier-admin-token", newToken);
            setToken(newToken);
            showToast("Sessão iniciada. Pode gerir os seus produtos.");
          }}
          onLogout={signOut}
          onProductsChanged={loadProducts}
          onBack={() => navigateTo("home")}
        />
      ) : (
        <main>
          <section className="hero" id="inicio">
            <img className="hero-image" src={featuredProduct?.image || products[0]?.image || "https://images.unsplash.com/photo-1578337834535-357ad7dccdfd?auto=format&fit=crop&w=2200&q=90"} alt={featuredProduct?.name || products[0]?.name || "Cortinas para a sua casa"} />
            <div className="hero-overlay" />
            <div className="hero-content">
              <span className="eyebrow hero-eyebrow">{featuredProduct?.tag || siteSettings.heroEyebrow}</span>
              <h1>{featuredProduct?.name || siteSettings.heroTitle}</h1>
              <p>{featuredProduct?.description || siteSettings.heroDescription}</p>
              {featuredProduct && isPromotion(featuredProduct) && (
                <div className="hero-price" aria-label={`Preço anterior ${money.format(featuredProduct.price)}, agora ${money.format(featuredProduct.promoPrice)}`}>
                  <del>{money.format(featuredProduct.price)}</del>
                  <strong>{money.format(featuredProduct.promoPrice)}</strong>
                </div>
              )}
              {featuredProduct && !isPromotion(featuredProduct) && (
                <div className="hero-price"><strong>{money.format(featuredProduct.price)}</strong></div>
              )}
              <a className="button button-light" href="#colecao">{siteSettings.heroButtonLabel} <ArrowRight size={17} /></a>
              {featuredProducts.length > 1 && (
                <div className="hero-carousel-controls" aria-label="Produtos em destaque">
                  <button type="button" className="hero-carousel-arrow" onClick={() => moveHero(-1)} aria-label="Produto anterior"><ChevronLeft size={17} /></button>
                  <span>{heroIndex + 1} / {featuredProducts.length}</span>
                  <button type="button" className="hero-carousel-arrow" onClick={() => moveHero(1)} aria-label="Próximo produto"><ChevronRight size={17} /></button>
                </div>
              )}
            </div>
          </section>

          <section className="intro-section" id="atelier">
            <div className="intro-kicker">ANTES DE ESCOLHER</div>
            <div className="intro-copy">
            <h2>Cada janela pede uma cortina diferente.</h2>
            <p>Explore os modelos disponíveis. Se tiver dúvidas sobre o tecido, o preço ou as medidas, fale connosco — teremos gosto em ajudar.</p>
            </div>
          </section>

          <section className="collection-section" id="colecao">
            <div className="section-heading">
              <div><span className="eyebrow">MODELOS DISPONÍVEIS</span><h2>Escolha a sua cortina.</h2></div>
              <a className="text-link" href="#contacto">Precisa de ajuda? Fale connosco <ArrowUpRight size={15} /></a>
            </div>
            <div className="filter-row">
              <div className="category-filters" aria-label="Filtrar por material">
                {categories.map((category) => (
                  <button key={category.value} className={activeCategory === category.value ? "filter-chip active" : "filter-chip"} onClick={() => setActiveCategory(category.value)}>
                    {category.label}
                  </button>
                ))}
              </div>
              <span className="product-count">{visibleProducts.length} {visibleProducts.length === 1 ? "modelo" : "modelos"}</span>
            </div>

            <div className="product-grid">
              {visibleProducts.map((product) => (
                <article className={`product-card ${product.tag?.toLowerCase() === "esgotado" ? "product-card-sold-out" : ""}`} key={product.id}>
                  <div className="product-image-wrap">
                    <img src={product.image} alt={product.name} loading="lazy" />
                    {product.tag && (normalizeProductTag(product.tag) !== "promocao" || isPromotion(product)) && <span className={`product-tag ${getProductTagClass(product.tag)}`}>{product.tag}</span>}
                    {product.tag?.toLowerCase() === "esgotado" && <span className="sold-out-overlay" aria-hidden="true" />}
                    <button className="quick-view" disabled={product.tag?.toLowerCase() === "esgotado"} onClick={() => document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" })}>
                      {product.tag?.toLowerCase() === "esgotado" ? "Sem stock" : "Perguntar por esta cortina"} {product.tag?.toLowerCase() !== "esgotado" && <ArrowUpRight size={15} />}
                    </button>
                  </div>
                  <div className="product-meta"><span>{product.category}</span></div>
                  <div className="product-title-row">
                    <h3>{product.name}</h3>
                    <span className={isPromotion(product) ? "product-price product-price-sale" : "product-price"}>
                      {isPromotion(product) && <del>{money.format(product.price)}</del>}
                      <strong>{money.format(isPromotion(product) ? product.promoPrice : product.price)}</strong>
                    </span>
                  </div>
                  <p>{product.description}</p>
                  <span className="product-unit">{product.unit || "por painel"}</span>
                </article>
              ))}
              {visibleProducts.length === 0 && <p className="empty-products">Ainda não há produtos nesta coleção.</p>}
            </div>
          </section>

          <section className="atelier-note-section">
            <div className="atelier-note-copy">
              <span className="eyebrow">AJUDA NA ESCOLHA</span>
              <h2>Não sabe qual escolher?</h2>
              <p>Diga-nos o que procura. Ajudamos a esclarecer dúvidas sobre os modelos e os preços.</p>
              <a className="text-link" href="#contacto">Ver contactos <ArrowRight size={15} /></a>
            </div>
            <figure className="atelier-note-photo">
              <img src={products[1]?.image || products[0]?.image || "https://images.unsplash.com/photo-1757382603619-7682803cfc5d?auto=format&fit=crop&w=1300&q=85"} alt={products[1]?.name || products[0]?.name || "Cortinas disponíveis na loja"} loading="lazy" />
              {products[1]?.name && <figcaption>{products[1].name} · {products[1].category}</figcaption>}
            </figure>
          </section>

          <section className="contact-section" id="contacto">
            <span className="eyebrow">CONTACTOS</span>
            <h2>Fale connosco.</h2>
            <p>Quer confirmar medidas, preço ou disponibilidade? Envie-nos uma mensagem. Respondemos com todo o gosto.</p>
            {whatsappUrl && <a className="button button-dark contact-whatsapp" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle size={17} /> Enviar mensagem pelo WhatsApp</a>}
            {(siteSettings.contactEmail || siteSettings.contactPhone || siteSettings.contactAddress || siteSettings.instagramUrl) && (
              <div className="contact-details">
                {siteSettings.contactEmail && <a href={`mailto:${siteSettings.contactEmail}`}>{siteSettings.contactEmail}</a>}
                {siteSettings.contactPhone && <a href={`tel:${siteSettings.contactPhone.replace(/[^\d+]/g, "")}`}>{siteSettings.contactPhone}</a>}
                {siteSettings.contactAddress && <span>{siteSettings.contactAddress}</span>}
                {siteSettings.instagramUrl && <a href={siteSettings.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram <ArrowUpRight size={13} /></a>}
              </div>
            )}
          </section>
        </main>
      )}
      {page === "home" && whatsappUrl && (
        <a className="whatsapp-button" href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="Fale connosco pelo WhatsApp">
          <MessageCircle size={23} />
          <span>Fale connosco</span>
        </a>
      )}
      {page === "home" && <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio" onClick={() => navigateTo("home")}>
          {siteSettings.logoImageUrl
            ? <img className="brand-logo" src={siteSettings.logoImageUrl} alt="" />
            : <span className="brand-mark"><span /></span>}
          <span className="brand-name">{siteSettings.siteName}<small>{siteSettings.tagline}</small></span>
        </a>
        <a className="footer-credit" href="https://viroslabscom.vercel.app" target="_blank" rel="noopener noreferrer">
          © {new Date().getFullYear()} Todos os direitos reservados pela vIRos Lab&apos;s
        </a>
        <a href="#inicio">Voltar ao início <ArrowUpRight size={14} /></a>
      </footer>}
      {toast && <ToastNotification toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function SiteTextField({ label, settingKey, form, setForm, maxLength, multiline = false }) {
  const value = form[settingKey] ?? "";
  const updateValue = (event) => setForm((currentForm) => ({ ...currentForm, [settingKey]: event.target.value }));
  const field = multiline
    ? <textarea maxLength={maxLength} rows="2" value={value} onChange={updateValue} />
    : <input maxLength={maxLength} value={value} onChange={updateValue} />;

  return <label>{label}{field}</label>;
}

function SiteImageField({ label, settingKey, form, setForm, uploadImage, busy, setBusy, notify }) {
  const value = form[settingKey] ?? "";

  async function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const url = await uploadImage(file);
      setForm((currentForm) => ({ ...currentForm, [settingKey]: url }));
      notify("Imagem carregada com sucesso.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  }

  return (
    <>
      <label>{label} — carregar do computador<input className="image-file-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleUpload} disabled={busy} /><span className="settings-field-hint">JPG, PNG, GIF ou WebP · máximo 5 MB</span></label>
      <label>{label} — URL<input maxLength="2048" value={value} onChange={(event) => setForm((currentForm) => ({ ...currentForm, [settingKey]: event.target.value }))} placeholder="https://... ou /uploads/..." /></label>
      {value && <img className="settings-image-preview" src={value} alt={`Pré-visualização: ${label.toLowerCase()}`} />}
    </>
  );
}

function ToastNotification({ toast, onClose }) {
  const isError = toast.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div key={toast.id} className={`toast-notification ${isError ? "toast-error" : "toast-success"}`} role={isError ? "alert" : "status"} aria-live={isError ? "assertive" : "polite"}>
      <span className="toast-icon"><Icon size={19} strokeWidth={1.8} /></span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close icon-button" onClick={onClose} aria-label="Fechar notificação"><X size={16} /></button>
      <span className="toast-progress" />
    </div>
  );
}

function AdminPanel({ products, siteSettings, theme, token, notify, onToggleTheme, onLogin, onLogout, onProductsChanged, onSiteSettingsChanged, onBack }) {
  const [email, setEmail] = useState("admin@gmail.com");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState(siteSettings);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const categoryOptions = [...new Set(["Linho natural", "Algodão", "Blackout", "Voil", ...products.map((product) => product.category)])];

  useEffect(() => {
    if (!editorOpen && !settingsOpen) return undefined;
    function closeOnEscape(event) {
      if (event.key !== "Escape" || busy) return;
      if (settingsOpen) setSettingsOpen(false);
      else resetForm();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [editorOpen, settingsOpen, busy]);

  function openSiteSettings() {
    setSettingsForm(siteSettings);
    setSettingsOpen(true);
  }

  async function saveSiteSettings(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const updatedSettings = await request("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(settingsForm)
      });
      onSiteSettingsChanged(updatedSettings);
      setSettingsOpen(false);
      notify("Informações do site atualizadas com sucesso.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { token: newToken } = await request("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      onLogin(newToken);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function editProduct(product) {
    setEditingId(product.id);
    setForm({ ...product, price: String(product.price), promoPrice: product.promoPrice == null ? "" : String(product.promoPrice) });
    setEditorOpen(true);
  }

  function addProduct() {
    setEditingId("");
    setForm(emptyProduct);
    setEditorOpen(true);
  }

  function resetForm() {
    setEditorOpen(false);
    setEditingId("");
    setForm(emptyProduct);
  }

  async function saveProduct(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const successMessage = editingId ? "Produto atualizado com sucesso." : "Produto adicionado com sucesso.";
      await request(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          promoPrice: normalizeProductTag(form.tag) === "promocao" ? Number(form.promoPrice) : null
        })
      });
      resetForm();
      await onProductsChanged();
      notify(successMessage);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("A imagem excede o limite de 5 MB.");
    }

    const { url } = await request("/api/products/images", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": file.type },
      body: file
    });
    return url;
  }

  async function uploadProductImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const url = await uploadImage(file);
      setForm((currentForm) => ({ ...currentForm, image: url }));
      event.target.value = "";
      notify("Imagem carregada com sucesso.");
    } catch (error) {
      notify(error.message, "error");
      event.target.value = "";
    } finally {
      setBusy(false);
    }
  }

  async function uploadSiteIcon(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const url = await uploadImage(file);
      setSettingsForm((currentSettings) => ({ ...currentSettings, faviconUrl: url }));
      event.target.value = "";
      notify("Ícone carregado com sucesso.");
    } catch (error) {
      notify(error.message, "error");
      event.target.value = "";
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(product) {
    setDeletingId(product.id);
    try {
      await request(`/api/products/${product.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (editingId === product.id) resetForm();
      setPendingDeleteId("");
      await onProductsChanged();
      notify("Produto removido da coleção.");
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-page-top">
        <button className="back-link" onClick={onBack}><ArrowRight className="back-arrow" size={16} /> Voltar à loja</button>
        <button className="theme-toggle" onClick={onToggleTheme} aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} aria-pressed={theme === "dark"}>
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          <span>{theme === "dark" ? "Modo claro" : "Modo escuro"}</span>
        </button>
      </div>
      {!token ? (
        <section className="login-card">
          <div className="login-icon"><LockKeyhole size={21} /></div>
          <span className="eyebrow">ÁREA RESERVADA</span>
          <h1>Bem-vindo de <em>volta.</em></h1>
          <p>Entre com o seu email e palavra-passe para gerir a coleção {siteSettings.siteName}.</p>
          <form onSubmit={handleLogin}>
            <label htmlFor="admin-email">Email</label>
            <input id="admin-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="admin-password">Palavra-passe</label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button className="button button-dark full-button" disabled={busy}>{busy ? "A entrar..." : "Entrar"} <ArrowRight size={16} /></button>
          </form>
          <span className="login-note"><LockKeyhole size={13} /> Acesso reservado à administração</span>
        </section>
      ) : (
        <div className="admin-dashboard">
          <div className="admin-heading">
            <div><span className="eyebrow">GESTÃO DA LOJA</span><h1>A sua <em>coleção.</em></h1><p>Adicione, edite ou remova produtos da montra.</p></div>
            <div className="admin-heading-actions">
              <button className="button button-settings" onClick={openSiteSettings}><Settings size={16} /> Informações do site</button>
              <button className="text-link logout-button" onClick={onLogout}>Terminar sessão <ArrowUpRight size={15} /></button>
            </div>
          </div>
          <div className="admin-summary"><span><strong>{products.length}</strong> produtos na coleção</span><span>As alterações ficam disponíveis na loja de imediato</span></div>
          <div className="admin-layout">
            <section className="admin-products">
              <div className="admin-list-heading">
                <div className="admin-list-title"><h2>Produtos atuais</h2><span>{products.length}</span></div>
                <button className="button button-dark add-product-button" onClick={addProduct}><Plus size={16} /> Adicionar novo produto</button>
              </div>
              {products.map((product) => (
                <article className="admin-product-row" key={product.id}>
                  <img src={product.image} alt="" />
                  <div className="admin-product-info">
                    <strong>{product.name}</strong>
                    <span>
                      {product.category} · {isPromotion(product)
                        ? <><del>{money.format(product.price)}</del> <strong>{money.format(product.promoPrice)}</strong></>
                        : money.format(product.price)}
                    </span>
                    {normalizeProductTag(product.tag) === "promocao" && !isPromotion(product) && <span className="missing-promo-price">Defina o preço promocional</span>}
                  </div>
                  {product.tag && <span className={`admin-product-tag ${getProductTagClass(product.tag)}`}>{product.tag}</span>}
                  {pendingDeleteId === product.id ? (
                    <div className="delete-confirm-actions">
                      <span>Remover?</span>
                      <button className="icon-button confirm-delete-button" onClick={() => deleteProduct(product)} disabled={deletingId === product.id} aria-label={`Confirmar remoção de ${product.name}`}>
                        {deletingId === product.id ? "…" : <Check size={16} />}
                      </button>
                      <button className="icon-button cancel-delete-button" onClick={() => setPendingDeleteId("")} disabled={deletingId === product.id} aria-label="Cancelar remoção"><X size={16} /></button>
                    </div>
                  ) : (
                    <>
                      <button className="icon-button edit-button" onClick={() => editProduct(product)} aria-label={`Editar ${product.name}`}><ChevronDown size={17} /></button>
                      <button className="icon-button delete-button" onClick={() => setPendingDeleteId(product.id)} aria-label={`Remover ${product.name}`}><Trash2 size={16} /></button>
                    </>
                  )}
                </article>
              ))}
              {products.length === 0 && <p className="empty-products">Ainda não há produtos. Adicione a primeira peça.</p>}
            </section>
          </div>
          {editorOpen && (
            <div className="product-modal-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget && !busy) resetForm();
            }}>
              <section className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
                <div className="product-modal-heading">
                  <div>
                    <span className="eyebrow">{editingId ? "ATUALIZAR PRODUTO" : "NOVO PRODUTO"}</span>
                    <h2 id="product-modal-title">{editingId ? "Editar peça" : "Adicionar peça"}</h2>
                  </div>
                  <button className="icon-button modal-close-button" type="button" onClick={resetForm} disabled={busy} aria-label="Fechar formulário"><X size={20} /></button>
                </div>
                <form className="product-form" onSubmit={saveProduct}>
                  <label>Nome do produto<input maxLength="80" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required placeholder="Ex.: Linho da Manhã" /></label>
                  <label>Categoria<input list="product-categories" maxLength="40" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required /><datalist id="product-categories">{categoryOptions.map((category) => <option key={category} value={category} />)}</datalist></label>
                  <label>Descrição<textarea maxLength="300" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} required placeholder="Conte o que torna esta peça especial." /></label>
                  <div className="form-row">
                    <label>{normalizeProductTag(form.tag) === "promocao" ? "Preço anterior (Kz)" : "Preço (Kz)"}<input type="number" min="0" max="1000000000" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label>
                    <label>Etiqueta promocional
                      <select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })}>
                        {productTags.map((tag) => <option key={tag || "none"} value={tag}>{tag || "Sem etiqueta"}</option>)}
                        {form.tag && !productTags.includes(form.tag) && <option value={form.tag}>{form.tag} (atual)</option>}
                      </select>
                    </label>
                  </div>
                  {normalizeProductTag(form.tag) === "promocao" && (
                    <label>Preço promocional (Kz)<input type="number" min="1" max="99999" step="1" value={form.promoPrice} onChange={(event) => setForm({ ...form, promoPrice: event.target.value })} required /><span className="settings-field-hint">O preço promocional deve ser inferior ao preço anterior.</span></label>
                  )}
                  <label>Carregar imagem do computador<input className="image-file-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadProductImage} disabled={busy} /><span className="settings-field-hint">JPG, PNG, GIF ou WebP · máximo 5 MB</span></label>
                  <label>Ou indique o URL da imagem<input type="text" maxLength="2048" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} required placeholder="https://..." /></label>
                  {form.image && <img className="product-image-preview" src={form.image} alt="Pré-visualização da imagem do produto" />}
                  <div className="product-modal-actions">
                    <button className="button button-cancel" type="button" onClick={resetForm} disabled={busy}>Cancelar</button>
                    <button className="button button-dark" type="submit" disabled={busy}>{busy ? "A guardar..." : editingId ? "Guardar alterações" : "Adicionar produto"} {editingId ? <Check size={16} /> : <Plus size={16} />}</button>
                  </div>
                </form>
              </section>
            </div>
          )}
          {settingsOpen && (
            <div className="product-modal-backdrop settings-modal-backdrop" onMouseDown={(event) => {
              if (event.target === event.currentTarget && !busy) setSettingsOpen(false);
            }}>
              <section className="product-modal site-settings-modal" role="dialog" aria-modal="true" aria-labelledby="site-settings-title">
                <div className="product-modal-heading">
                  <div>
                    <span className="eyebrow">PERSONALIZAR A MONTRA</span>
                    <h2 id="site-settings-title">Informações do site</h2>
                  </div>
                  <button className="icon-button modal-close-button" type="button" onClick={() => setSettingsOpen(false)} disabled={busy} aria-label="Fechar definições"><X size={20} /></button>
                </div>
                <form className="product-form" onSubmit={saveSiteSettings}>
                  <div className="settings-form-section">
                    <span className="settings-section-title">Identidade do site</span>
                    <div className="form-row">
                      <label>Nome do site<input maxLength="80" value={settingsForm.siteName} onChange={(event) => setSettingsForm({ ...settingsForm, siteName: event.target.value })} required /></label>
                      <label>Frase curta / slogan<input maxLength="120" value={settingsForm.tagline} onChange={(event) => setSettingsForm({ ...settingsForm, tagline: event.target.value })} required /></label>
                    </div>
                    <SiteImageField label="Logo do site" settingKey="logoImageUrl" form={settingsForm} setForm={setSettingsForm} uploadImage={uploadImage} busy={busy} setBusy={setBusy} notify={notify} />
                    <label>Carregar ícone do computador<input className="image-file-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={uploadSiteIcon} disabled={busy} /><span className="settings-field-hint">JPG, PNG, GIF ou WebP · máximo 5 MB</span></label>
                    <label>URL do ícone / favicon<input maxLength="2048" value={settingsForm.faviconUrl} onChange={(event) => setSettingsForm({ ...settingsForm, faviconUrl: event.target.value })} placeholder="/favicon.svg ou https://..." /></label>
                    {settingsForm.faviconUrl && <img className="settings-icon-preview" src={settingsForm.faviconUrl} alt="Pré-visualização do ícone do site" />}
                    <label>Descrição do site<input maxLength="300" value={settingsForm.metaDescription} onChange={(event) => setSettingsForm({ ...settingsForm, metaDescription: event.target.value })} /></label>
                  </div>
                  <div className="settings-form-section">
                    <span className="settings-section-title">Apresentação principal</span>
                    <span className="settings-field-hint">A imagem, o nome e a descrição são obtidos do produto em destaque. Edite-os na gestão de produtos.</span>
                    <SiteTextField label="Texto pequeno da apresentação" settingKey="heroEyebrow" form={settingsForm} setForm={setSettingsForm} maxLength={80} />
                    <SiteTextField label="Título alternativo (quando não há promoções ou novidades)" settingKey="heroTitle" form={settingsForm} setForm={setSettingsForm} maxLength={140} />
                    <SiteTextField label="Descrição alternativa" settingKey="heroDescription" form={settingsForm} setForm={setSettingsForm} maxLength={300} multiline />
                    <SiteTextField label="Texto do botão principal" settingKey="heroButtonLabel" form={settingsForm} setForm={setSettingsForm} maxLength={60} />
                  </div>
                  <div className="settings-form-section">
                    <span className="settings-section-title">Dados de contacto</span>
                    <div className="form-row">
                      <label>Email de contacto<input type="email" maxLength="254" value={settingsForm.contactEmail} onChange={(event) => setSettingsForm({ ...settingsForm, contactEmail: event.target.value })} placeholder="ola@oseunegocio.ao" /></label>
                      <label>Telefone<input type="tel" maxLength="40" value={settingsForm.contactPhone} onChange={(event) => setSettingsForm({ ...settingsForm, contactPhone: event.target.value })} placeholder="+244 ..." /></label>
                    </div>
                    <label>Número de WhatsApp<input type="tel" maxLength="40" value={settingsForm.whatsappNumber} onChange={(event) => setSettingsForm({ ...settingsForm, whatsappNumber: event.target.value })} placeholder="+244 923 000 000" /><span className="settings-field-hint">Inclua o indicativo internacional (por exemplo, +244 para Angola). Deixe vazio para ocultar o botão.</span></label>
                    <SiteTextField label="Mensagem inicial do WhatsApp" settingKey="whatsappMessage" form={settingsForm} setForm={setSettingsForm} maxLength={300} multiline />
                    <label>Morada<input maxLength="180" value={settingsForm.contactAddress} onChange={(event) => setSettingsForm({ ...settingsForm, contactAddress: event.target.value })} placeholder="Cidade, Angola" /></label>
                    <label>Link do Instagram<input type="url" maxLength="2048" value={settingsForm.instagramUrl} onChange={(event) => setSettingsForm({ ...settingsForm, instagramUrl: event.target.value })} placeholder="https://instagram.com/oseunegocio" /></label>
                  </div>
                  <div className="product-modal-actions">
                    <button className="button button-cancel" type="button" onClick={() => setSettingsOpen(false)} disabled={busy}>Cancelar</button>
                    <button className="button button-dark" type="submit" disabled={busy}>{busy ? "A guardar..." : "Guardar informações"} <Check size={16} /></button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default App;
