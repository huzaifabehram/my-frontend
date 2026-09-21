// src/Pages/ServicesPage.jsx
// ─── Services Page ──────────────────────────────────────────────────────────
// Same branding as HomePage.jsx / Shopify.jsx. Reached from the "Services"
// nav link in the header (added here, in HomePage.jsx, and — via the patch
// in SHOPIFY_NAV_PATCH.md — in the course landing page too).
//
// NEW: Gold/Premium package pricing cards, above the existing services
// list — these are the flagship "done-for-you" offers. Each card's "Get
// Package" button links to /get-package?package=gold|premium, a new page
// (PackageInquiryPage.jsx) with a Name/WhatsApp/Email/Package form that
// POSTs to POST /api/package-inquiries (submissions land in Super Admin →
// Messages → Package Inquiries, same pattern as the Contact Us form).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Megaphone, ShoppingBag, Target, TrendingUp, Sparkles, Crown } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

// EDIT ME: the two placeholder entries need your real scope/features —
// everything else here (icons, layout, "Get a quote" link) will just work
// once you swap the text.
const SERVICES = [
  {
    icon: Megaphone,
    title: 'Digital Marketing',
    description: "End-to-end campaign management across Facebook, Instagram, and Google — built around what actually drives sales, not vanity metrics.",
    features: ['Ad strategy & creative direction', 'Facebook & Instagram Ads management', 'Google Ads (Search & Shopping)', 'Monthly performance reporting'],
  },
  {
    icon: ShoppingBag,
    title: 'E-Commerce Startup',
    description: 'From zero to a live store: Shopify setup, product listings, and a checkout flow built to convert visitors into customers.',
    features: ['Shopify store setup & theme customization', 'Product listing & catalog structure', 'Checkout & payment gateway setup', 'Launch support'],
  },
  {
    icon: Target,
    title: 'Brand Strategy & Positioning',
    description: "Placeholder service — tell me the real scope and I'll fill this in with your actual offering.",
    features: ['Positioning & messaging', 'Visual identity direction', 'Content pillars'],
    placeholder: true,
  },
  {
    icon: TrendingUp,
    title: 'Paid Ads Management',
    description: "Placeholder service — tell me the real scope and I'll fill this in with your actual offering.",
    features: ['Full-funnel ad management', 'Creative testing', 'Weekly optimization'],
    placeholder: true,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PACKAGES — Gold & Premium
// ─────────────────────────────────────────────────────────────────────────────
const PACKAGES = [
  {
    id: 'gold',
    icon: Sparkles,
    name: 'Gold Package',
    tagline: 'Build, Launch & Learn to Run Your E-commerce Business',
    value: 270000,
    price: 135000,
    included: [
      { title: 'Professional Store Setup', value: 30000, bullets: ['Professional e-commerce store', 'Domain included'] },
      { title: 'Complete Brand Identity', value: 10000, bullets: ['Professional Logo', 'Brand Color Selection', 'Website Branding', 'Outlet Branding', 'Thank-You Cards', 'Flyers & Marketing Materials'] },
      { title: '20 Winning Products', value: 50000, bullets: ['Research-based winning product selection', 'Products suitable for e-commerce testing'] },
      { title: '10 High-Converting Branded Video Ads', value: 100000, bullets: ['10 professionally designed video ads', 'Customized specifically for your brand', 'Your brand name and identity incorporated', 'Created for Facebook & TikTok advertising'] },
      { title: 'Winning Product Sourcing', value: 30000, bullets: ['Product sourcing support', 'Supplier/product research'] },
      { title: 'Complete Business Setup', value: 15000, bullets: ['Facebook Page Setup', 'Facebook Business Center', 'TikTok Business Center', 'Ad Account Creation', 'Pixel Connection', 'Courier Account Setup'] },
      { title: 'Ad Account Audit', value: 5000, bullets: ['Professional advertising account review', 'Setup and performance assessment'] },
      { title: 'Facebook & TikTok Campaign Launch', value: 30000, bullets: ['Campaign setup and launch', 'Winning product testing'] },
    ],
    extraSections: [
      {
        title: 'After Generating Sales',
        bullets: [
          'Store will be handed over to you',
          'Product sourcing support included',
          'Full access to your business assets',
          'Professional training to operate the business',
          'Custom dashboard for managing Orders, Cash Flow, Inventory, Balance & Profit',
        ],
      },
    ],
  },
  {
    id: 'premium',
    icon: Crown,
    name: 'Premium Package',
    tagline: 'We Will Run the Business — You Will Focus on the Investment',
    value: 340000,
    price: 250000,
    included: [
      { title: 'Professional Store Setup', value: 30000, bullets: ['Professional e-commerce store', 'Domain included'] },
      { title: 'Complete Brand Identity', value: 10000, bullets: ['Professional Logo', 'Brand Color Selection', 'Website Branding', 'Outlet Branding', 'Thank-You Cards', 'Flyers & Marketing Materials'] },
      { title: '20 Winning Products', value: 50000, bullets: ['Research-based winning product selection', 'Products suitable for e-commerce testing'] },
      { title: '10 High-Converting Branded Video Ads', value: 100000, bullets: ['10 professionally designed video ads', 'Customized specifically for your brand', 'Your brand name and identity incorporated', 'Created for Facebook & TikTok advertising'] },
      { title: 'Winning Product Sourcing', value: 30000, bullets: ['Product sourcing support', 'Supplier/product research'] },
      { title: 'Complete Business Setup', value: 15000, bullets: ['Facebook Page Setup', 'Facebook Business Center', 'TikTok Business Center', 'Ad Account Creation', 'Pixel Connection', 'Courier Account Setup'] },
      { title: 'Ad Account Audit', value: 5000, bullets: ['Professional advertising account review', 'Setup and performance assessment'] },
      { title: 'Facebook & TikTok Campaign Launch', value: 30000, bullets: ['Campaign setup and launch', 'Winning product testing'] },
      { title: 'Complete Business Management', valueLabel: 'Rs. 70,000/month Value', bullets: ['You provide the investment', 'We run and manage the business', 'Sales monitoring', 'Ad management', 'Parcel delivery coordination', 'Parcel tracking', 'Payment collection', 'Cash-flow management', 'Reinvestment for business growth'] },
    ],
    extraSections: [
      {
        title: 'Complete Transparency',
        intro: "You get full access to your business through a Professional Custom Dashboard, where you can monitor:",
        bullets: ['Total Orders', 'Cash Flow', 'Inventory', 'Account Balance', 'Sales', 'Profit', 'Daily Performance', 'Weekly Performance', 'Monthly Performance'],
      },
      {
        title: 'Our Partnership Model',
        bullets: [
          'We become a 50% business partner',
          'We run and manage the business on your behalf',
          'You focus on providing the required investment',
          'You receive your share of the generated profit',
          'You do not need to manage daily operations',
          'No separate monthly management fee',
          'We continue managing the business as your operating partner',
        ],
      },
    ],
  },
];

function formatPKR(n) { return `Rs. ${n.toLocaleString('en-PK')}/-`; }

function PackageCard({ pkg, onGetPackage }) {
  const Icon = pkg.icon;
  const discountPct = Math.round((1 - pkg.price / pkg.value) * 100);
  return (
    <div className="border-2 border-[#e8dfd0] rounded-3xl bg-white overflow-hidden flex flex-col shadow-sm">
      {/* HEADER */}
      <div className="bg-[#1a1208] px-6 md:px-8 py-7 md:py-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#e8540a] flex items-center justify-center mx-auto mb-4">
          <Icon size={22} className="text-white" />
        </div>
        <p className="text-[#f9c97a] font-bold text-xs uppercase tracking-widest mb-2">{pkg.name}</p>
        <h3 className="text-white text-lg md:text-xl font-bold leading-snug" style={{ fontFamily: "'Playfair Display', serif" }}>{pkg.tagline}</h3>
      </div>

      {/* PRICE BLOCK */}
      <div className="px-6 md:px-8 py-6 border-b border-[#f0ebe3] text-center bg-[#fdf9f3]">
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className="text-sm text-[#9e9789]">Package Value:</span>
          {/* NEW: strikethrough on the original/undiscounted price, in the
              brand's orange accent — this is what makes it read as "on
              sale" rather than just two unrelated numbers. */}
          <span className="text-sm text-[#9e9789] relative">
            {formatPKR(pkg.value)}
            <span className="absolute left-0 right-0 top-1/2 border-t-2 border-[#e8540a]" />
          </span>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{formatPKR(pkg.price)}</p>
        <span className="inline-block bg-[#e8540a] text-white text-xs font-bold px-3 py-1 rounded-full">{discountPct}% OFF — Limited Time</span>
      </div>

      {/* BODY */}
      <div className="px-6 md:px-8 py-6 flex-1 space-y-6">
        <div>
          <h4 className="text-sm font-bold text-[#1a1208] uppercase tracking-wide mb-3">What's Included</h4>
          <div className="space-y-4">
            {pkg.included.map((item, i) => (
              <div key={item.title}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-bold text-[#1a1208] flex items-start gap-2">
                    <span className="text-[#e8540a] flex-shrink-0">{i + 1}.</span> {item.title}
                  </p>
                  <span className="text-xs font-semibold text-[#9e9789] whitespace-nowrap flex-shrink-0">{item.valueLabel || formatPKR(item.value)}</span>
                </div>
                <ul className="pl-5 space-y-0.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-1.5 text-xs text-[#6b5e4e]">
                      <Check size={12} className="text-[#e8540a] flex-shrink-0 mt-0.5" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {pkg.extraSections.map((section) => (
          <div key={section.title} className="pt-5 border-t border-[#f0ebe3]">
            <h4 className="text-sm font-bold text-[#1a1208] uppercase tracking-wide mb-2">{section.title}</h4>
            {section.intro && <p className="text-xs text-[#6b5e4e] mb-2">{section.intro}</p>}
            <ul className="space-y-1">
              {section.bullets.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-xs text-[#3d3020]">
                  <Check size={12} className="text-[#e8540a] flex-shrink-0 mt-0.5" /> {b}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-5 border-t border-[#f0ebe3]">
          <h4 className="text-sm font-bold text-[#1a1208] uppercase tracking-wide mb-2">Profit Potential</h4>
          <p className="text-xs text-[#6b5e4e] leading-relaxed">
            Target Profit Margin: <strong className="text-[#1a1208]">40–50% of Total Sales*</strong><br />
            Example: Rs. 100,000 in sales → approximately Rs. 40,000–50,000 potential profit.
          </p>
        </div>

        <p className="text-[10px] text-[#9e9789] leading-relaxed italic">
          *Profit figures are estimates and are not guaranteed. Actual results depend on product performance, advertising costs, sales volume, returns, and other business factors.
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-8 pb-6 md:pb-8">
        <button
          onClick={() => onGetPackage(pkg.id)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#e8540a] hover:bg-[#c94708] text-white rounded-xl font-bold transition text-sm md:text-base shadow-lg border-none cursor-pointer"
        >
          Get Package — {formatPKR(pkg.price)} ({discountPct}% OFF)
        </button>
      </div>
    </div>
  );
}

function ServiceRow({ service }) {
  const Icon = service.icon;
  return (
    <div className="border border-[#ece6dd] rounded-2xl bg-white p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8">
      <div className="flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-[#fdf0e4] flex items-center justify-center">
          <Icon size={26} className="text-[#e8540a]" />
        </div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h3 className="text-xl md:text-2xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>{service.title}</h3>
          {service.placeholder && (
            <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Placeholder</span>
          )}
        </div>
        <p className="text-[#6b5e4e] text-sm md:text-base leading-relaxed mb-4">{service.description}</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          {service.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-[#3d3020]">
              <Check size={16} className="text-[#e8540a] flex-shrink-0 mt-0.5" />
              {f}
            </li>
          ))}
        </ul>
        <a href="#get-in-touch" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#e8540a] hover:text-[#c94708] transition">
          Get a quote <ArrowRight size={15} />
        </a>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const navigate = useNavigate();

  // Route changes don't auto-scroll to top in React Router — this makes sure
  // clicking "Services" from anywhere lands at the top of this page.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleNavigate = (path) => navigate(path);
  const handleGetPackage = (packageId) => navigate(`/get-package?package=${packageId}`);

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER — NEW: swapped to the same shared header as the rest of the
          site (real Super Admin logo, expandable Courses list) instead of
          this page's own separate copy. */}
      <SiteHeader />

      {/* HERO */}
      <section className="w-full bg-[#1a1208] text-white py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 text-center">
          <p className="text-[#f9c97a] font-semibold text-sm md:text-base mb-3">Done-for-you</p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Our Services
          </h1>
          <p className="text-base md:text-lg text-[#c8bfaf] max-w-xl mx-auto leading-relaxed">
            For brands that would rather we do the work than teach you how. Same team behind the courses.
          </p>
        </div>
      </section>

      {/* PACKAGES — Gold & Premium */}
      <section className="w-full bg-white py-12 md:py-16 lg:py-20 border-b border-[#ece6dd]">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <p className="text-[#e8540a] font-semibold text-sm mb-2 uppercase tracking-wide">Flagship Offers</p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Build & Launch Your E-Commerce Business
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
            {PACKAGES.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} onGetPackage={handleGetPackage} />)}
          </div>
        </div>
      </section>

      {/* SERVICES LIST */}
      <section className="w-full bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 lg:px-6 space-y-5 md:space-y-6">
          {SERVICES.map((s) => <ServiceRow key={s.title} service={s} />)}
        </div>
      </section>

      {/* GET IN TOUCH */}
      <section id="get-in-touch" className="w-full bg-[#f8f4ed] py-12 md:py-16 border-t border-[#ece6dd]">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a1208] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Let's talk about your project
          </h2>
          <p className="text-[#6b5e4e] text-sm md:text-base mb-6">
            Tell us a bit about your business and which service you're after — we'll get back to you with next steps and pricing.
          </p>
          {/* EDIT ME: swap this for a real contact form, WhatsApp link, or
              lead-capture endpoint once you've decided how you want service
              inquiries routed to you. */}
          <a
            href="mailto:hello@lerni.example?subject=Services%20inquiry"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#e8540a] hover:bg-[#c94708] text-white rounded-xl font-bold transition text-base shadow-lg"
          >
            Email us <ArrowRight size={16} />
          </a>
          <p className="text-xs text-[#9e9789] mt-4">Placeholder contact link — replace with your real email, WhatsApp number, or a form.</p>
        </div>
      </section>

      {/* FOOTER — NEW: swapped to the same shared footer as the rest of the
          site instead of this page's own separate copy. */}
      <SiteFooter />
    </div>
  );
}