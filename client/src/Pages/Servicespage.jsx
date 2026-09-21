// src/Pages/ServicesPage.jsx
// ─── Services Page ──────────────────────────────────────────────────────────
// Now a focused packages-only sales page: Header → Gold/Premium package
// cards → Footer. The old hero ("Done-for-you / Our Services"), the
// individual service list (Digital Marketing, E-Commerce Startup, etc.),
// and the "Let's talk about your project" section were all removed per
// request — the package cards are the whole page now, and sit right below
// the header. The header's Log In button is also hidden here (showLogin
// prop) since visitors here are prospective clients, not students.
//
// Each card's "Get Package" button links to /get-package?package=gold|
// premium — PackageInquiryPage.jsx — with a Name/WhatsApp/Email/Package
// form that POSTs to POST /api/package-inquiries (submissions land in Super
// Admin → Messages → Package Inquiries, same pattern as Contact Us).
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Crown } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

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

// A price with a light orange line through it — used both for the big
// package total (heavier line) and for each line item's own price (a
// lighter, thinner version of the same idea): "this is what it's really
// worth, but you're not being charged this for it."
function StruckPrice({ children, thin }) {
  return (
    <span className={`relative inline-block ${thin ? 'text-[#9e9789]' : ''}`}>
      {children}
      <span className={`absolute left-0 right-0 top-1/2 border-t-2 ${thin ? 'border-[#e8540a]/50' : 'border-[#e8540a]'}`} />
    </span>
  );
}

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
          <span className="text-base text-[#9e9789]">Package Value:</span>
          <StruckPrice thin><span className="text-base">{formatPKR(pkg.value)}</span></StruckPrice>
        </div>
        <p className="text-3xl md:text-4xl font-bold text-[#1a1208] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>{formatPKR(pkg.price)}</p>
        <span className="inline-block bg-[#e8540a] text-white text-sm font-bold px-3 py-1 rounded-full">{discountPct}% OFF — Limited Time</span>
      </div>

      {/* BODY */}
      <div className="px-6 md:px-8 py-6 flex-1 space-y-6">
        <div>
          <h4 className="text-base font-bold text-[#1a1208] uppercase tracking-wide mb-3">What's Included</h4>
          <div className="space-y-4">
            {pkg.included.map((item, i) => (
              <div key={item.title}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-base font-bold text-[#1a1208] flex items-start gap-2">
                    <span className="text-[#e8540a] flex-shrink-0">{i + 1}.</span> {item.title}
                  </p>
                  {/* NEW: same struck-price treatment as the main package
                      price, but lighter/thinner — every line item's value
                      now visibly reads as "worth this, not charged for it
                      separately" instead of a plain number. */}
                  <span className="text-sm font-semibold whitespace-nowrap flex-shrink-0">
                    <StruckPrice thin>{item.valueLabel || formatPKR(item.value)}</StruckPrice>
                  </span>
                </div>
                <ul className="pl-5 space-y-0.5">
                  {item.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-1.5 text-sm text-[#6b5e4e]">
                      <Check size={13} className="text-[#e8540a] flex-shrink-0 mt-0.5" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {pkg.extraSections.map((section) => (
          <div key={section.title} className="pt-5 border-t border-[#f0ebe3]">
            <h4 className="text-base font-bold text-[#1a1208] uppercase tracking-wide mb-2">{section.title}</h4>
            {section.intro && <p className="text-sm text-[#6b5e4e] mb-2">{section.intro}</p>}
            <ul className="space-y-1">
              {section.bullets.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-sm text-[#3d3020]">
                  <Check size={13} className="text-[#e8540a] flex-shrink-0 mt-0.5" /> {b}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="pt-5 border-t border-[#f0ebe3]">
          <h4 className="text-base font-bold text-[#1a1208] uppercase tracking-wide mb-2">Profit Potential</h4>
          <p className="text-sm text-[#6b5e4e] leading-relaxed">
            Target Profit Margin: <strong className="text-[#1a1208]">40–50% of Total Sales*</strong><br />
            Example: Rs. 100,000 in sales → approximately Rs. 40,000–50,000 potential profit.
          </p>
        </div>

        <p className="text-xs text-[#9e9789] leading-relaxed italic">
          *Profit figures are estimates and are not guaranteed. Actual results depend on product performance, advertising costs, sales volume, returns, and other business factors.
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 md:px-8 pb-6 md:pb-8">
        <button
          onClick={() => onGetPackage(pkg.id)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#e8540a] hover:bg-[#c94708] text-white rounded-xl font-bold transition text-base shadow-lg border-none cursor-pointer"
        >
          Get Package — {formatPKR(pkg.price)} ({discountPct}% OFF)
        </button>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const navigate = useNavigate();

  // Route changes don't auto-scroll to top in React Router — this makes sure
  // clicking "Services" from anywhere lands at the top of this page.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const handleGetPackage = (packageId) => navigate(`/get-package?package=${packageId}`);

  return (
    <div className="min-h-screen bg-[#FDFAF6] overflow-x-hidden w-full" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* HEADER — Log In hidden here; this page is for prospective clients,
          not students logging into their portal. */}
      <SiteHeader showLogin={false} />

      {/* PACKAGES — now the whole page, right below the header */}
      <section className="w-full bg-white py-12 md:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-12">
            <p className="text-[#e8540a] font-semibold text-sm mb-2 uppercase tracking-wide">Flagship Offers</p>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#1a1208]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Build & Launch Your E-Commerce Business
            </h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
            {PACKAGES.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} onGetPackage={handleGetPackage} />)}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}