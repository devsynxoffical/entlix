import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap, BarChart3, Globe, Shield, Bell, Search, TrendingUp, Star, RefreshCw } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      {/* ======================== HEADER NAV ======================== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-purple-500/20">E</div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Entiix<span className="text-purple-600">.</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-purple-600 transition-colors">Features</a>
            <a href="#how" className="hover:text-purple-600 transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-purple-600 transition-colors">Results</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/auth/signin" className="text-sm font-semibold text-slate-600 hover:text-purple-600 transition-colors hidden sm:block">Sign In</Link>
            <Link href="/auth/signin" className="btn btn-primary text-sm px-4 py-2 shadow-lg shadow-purple-500/20">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ======================== HERO ======================== */}
        <section className="relative overflow-hidden pt-20 pb-24 px-6 lg:px-8">
          {/* Background */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-purple-100/60 via-indigo-100/30 to-transparent rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 border border-purple-200/60 mb-8 text-xs text-purple-700 font-semibold shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
              </span>
              Now monitoring 1M+ Meta Ads globally
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08] mb-6">
              Spy on Competitor<br />
              <span style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Meta Ads
              </span>{" "}in Real Time
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Entiix automatically scans the Meta Ad Library, classifies new vs. existing campaigns, and alerts you the moment a competitor launches a new ad.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-10">
              <Link href="/auth/signin" className="btn btn-primary text-base py-3.5 px-8 w-full sm:w-auto shadow-xl shadow-purple-500/30 rounded-xl font-bold flex items-center justify-center gap-2">
                Open Dashboard <ArrowRight size={18} />
              </Link>
              <Link href="/auth/signin" className="btn btn-secondary text-base py-3.5 px-8 w-full sm:w-auto rounded-xl font-semibold">
                Sign In to Dashboard
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-slate-500">
              {['No credit card required', 'Setup in 2 minutes', 'Cancel anytime'].map(f => (
                <span key={f} className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-purple-500" /> {f}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard screenshot mockup */}
          <div className="max-w-5xl mx-auto mt-16 px-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-400/20 overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <span className="w-3 h-3 rounded-full bg-red-400/60"></span>
                <span className="w-3 h-3 rounded-full bg-amber-400/60"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-400/60"></span>
                <div className="ml-4 flex-1 h-5 bg-slate-200/80 rounded-full max-w-xs text-[10px] text-slate-400 flex items-center px-3">app.entiix.com/dashboard</div>
              </div>
              {/* Mockup content */}
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Ads Tracked', val: '3,256', color: 'text-purple-600', bg: 'bg-purple-50' },
                  { label: 'Active Keywords', val: '394', color: 'text-cyan-600', bg: 'bg-cyan-50' },
                  { label: 'New Ads Today', val: '38', color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Regions Covered', val: '12', color: 'text-rose-600', bg: 'bg-rose-50' },
                ].map((kpi, i) => (
                  <div key={i} className={`${kpi.bg} rounded-xl p-4 border border-slate-200/60`}>
                    <p className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.val}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">{kpi.label}</p>
                  </div>
                ))}
                <div className="col-span-2 md:col-span-4 bg-slate-50 rounded-xl p-4 border border-slate-200/50 mt-2">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-slate-700">Live Ads Feed</span>
                    <span className="text-[11px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {['SaaSFlow Premium · lead gen · UK', 'LeadsBoost Inc · automation · US', 'Elite Dental · dental implants · UK'].map((ad, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-slate-200/60">
                        <span className="font-medium text-slate-700">{ad}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${i === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{i === 0 ? 'NEW' : 'EXISTING'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ======================== LOGOS / SOCIAL PROOF ======================== */}
        <section className="py-12 border-y border-slate-200/80 bg-white">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-8">Trusted by marketers at</p>
            <div className="flex flex-wrap justify-center gap-10 text-slate-400 font-bold text-lg">
              {['GrowthHQ', 'MediaFirst', 'AdLens Pro', 'ScaleUp Labs', 'ClickForge'].map(brand => (
                <span key={brand} className="hover:text-purple-600 transition-colors cursor-default">{brand}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== HOW IT WORKS ======================== */}
        <section id="how" className="py-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">How It Works</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2 mb-4">Up & running in 3 steps</h2>
            <p className="text-slate-500 text-lg">No setup friction. Start monitoring your niche in under 2 minutes.</p>
          </div>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Search, title: 'Create a Group', desc: 'Name your monitoring group, add semicolon-separated keywords, and pick a target region (UK, US, Global, etc.).' },
              { step: '02', icon: RefreshCw, title: 'We Scan Automatically', desc: 'Entiix runs baseline and incremental scans, classifying each ad as NEW or EXISTING with deduplication.' },
              { step: '03', icon: Bell, title: 'Get Instant Alerts', desc: 'Every new competitive ad triggers an email alert so you can react before your competitors gain the edge.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative glass-card p-8 border border-slate-200/80 text-left">
                <div className="text-5xl font-extrabold text-slate-100 absolute top-5 right-6 select-none">{step}</div>
                <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-5">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ======================== FEATURES ======================== */}
        <section id="features" className="py-24 px-6 lg:px-8 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Platform Features</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold mt-2">Everything you need to stay ahead</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Zap, color: 'text-purple-400 bg-purple-900/30', title: 'Instant Ad Discovery', desc: 'Scans the Meta Ad Library automatically and classifies each ad in real time.' },
                { icon: BarChart3, color: 'text-cyan-400 bg-cyan-900/30', title: 'Visual Analytics', desc: 'Live charts showing ad detection trends, new vs existing ratios, and regional breakdowns.' },
                { icon: Globe, color: 'text-emerald-400 bg-emerald-900/30', title: 'Multi-Region Coverage', desc: 'Track ad variations in United Kingdom, United States, Australia, Canada, and globally.' },
                { icon: Bell, color: 'text-amber-400 bg-amber-900/30', title: 'Email Alerts', desc: 'Get notified instantly when a competitor launches a new ad matching your keywords.' },
                { icon: Shield, color: 'text-rose-400 bg-rose-900/30', title: 'Deduplication Engine', desc: 'Smart deduplication ensures you never see the same ad twice, only truly new campaigns.' },
                { icon: TrendingUp, color: 'text-indigo-400 bg-indigo-900/30', title: 'Trend Reporting', desc: 'Understand seasonal ad patterns and track how competitors ramp up and wind down campaigns.' },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                  <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center mb-4`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== STATS ======================== */}
        <section id="stats" className="py-24 px-6 lg:px-8 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">By The Numbers</span>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2">Real results, real time</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { val: '1.2M+', label: 'Ads Indexed', color: 'text-purple-600' },
                { val: '99.9%', label: 'Uptime SLA', color: 'text-emerald-600' },
                { val: '<3s', label: 'Alert Latency', color: 'text-cyan-600' },
                { val: '40+', label: 'Regions Covered', color: 'text-amber-600' },
              ].map(({ val, label, color }) => (
                <div key={label}>
                  <p className={`text-4xl md:text-5xl font-extrabold ${color}`}>{val}</p>
                  <p className="text-sm text-slate-500 font-semibold mt-2">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== TESTIMONIALS ======================== */}
        <section className="py-24 px-6 lg:px-8 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Loved by growth teams</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Sarah K.', role: 'Head of Marketing', company: 'GrowthHQ', text: 'Entiix completely changed how we monitor competitors. We now know about new campaigns before our sales team even wakes up.' },
                { name: 'James P.', role: 'Paid Ads Lead', company: 'ScaleUp Labs', text: 'The keyword grouping and region filtering saved us hours of manual work every week. Absolutely worth it.' },
                { name: 'Priya M.', role: 'Growth Analyst', company: 'AdLens Pro', text: "The email alerts are the killer feature. We caught a competitor's summer campaign on day one and launched a counter campaign immediately." },
              ].map(({ name, role, company, text }) => (
                <div key={name} className="glass-card p-6 border border-slate-200/80">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-5">"{text}"</p>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{name}</p>
                    <p className="text-xs text-slate-500">{role} · {company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ======================== PRICING ======================== */}
        <section id="pricing" className="py-24 px-6 lg:px-8 bg-white">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">Simple Pricing</span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mt-2 mb-4">Start free, scale anytime</h2>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                name: 'Starter', price: 'Free', period: 'forever', cta: 'Sign In', link: '/auth/signin', primary: false,
                features: ['3 Monitoring Groups', 'Up to 100 Ads/month', 'UK & US regions', 'Email Alerts', 'Basic Dashboard']
              },
              {
                name: 'Pro', price: '$49', period: '/ month', cta: 'Sign In', link: '/auth/signin', primary: true,
                features: ['Unlimited Groups', 'Unlimited Ads', 'All Regions', 'Priority Email Alerts', 'Advanced Analytics', 'API Access', 'Priority Support']
              }
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-8 border ${plan.primary ? 'bg-purple-600 border-purple-500 text-white shadow-2xl shadow-purple-500/30' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-1 ${plan.primary ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.primary ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                  <span className={`text-sm font-medium mb-1 ${plan.primary ? 'text-purple-200' : 'text-slate-500'}`}>{plan.period}</span>
                </div>
                <ul className="flex flex-col gap-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 size={16} className={plan.primary ? 'text-purple-200' : 'text-purple-500'} />
                      <span className={plan.primary ? 'text-purple-100' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.link}
                  className={`w-full btn py-3 font-bold rounded-xl text-sm ${plan.primary ? 'bg-white text-purple-700 hover:bg-purple-50 shadow-lg' : 'btn-primary shadow-lg shadow-purple-500/20'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ======================== FINAL CTA ======================== */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-4">Ready to spy smarter?</h2>
            <p className="text-slate-600 text-lg mb-8">Join hundreds of growth teams using Entiix to get the competitive edge.</p>
            <Link href="/auth/signin" className="btn btn-primary text-lg py-4 px-10 rounded-xl shadow-2xl shadow-purple-500/30 inline-flex items-center gap-2 font-bold">
              Start Free Today <ArrowRight size={20} />
            </Link>
          </div>
        </section>
      </main>

      {/* ======================== FOOTER ======================== */}
      <footer className="bg-slate-900 text-white py-16 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white font-extrabold text-sm">E</div>
                <span className="text-xl font-bold">Entiix<span className="text-purple-400">.</span></span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">The professional Meta Ads intelligence platform for growth-driven marketing teams.</p>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-slate-300">Product</h4>
              <ul className="flex flex-col gap-2 text-sm text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how" className="hover:text-white transition-colors">How It Works</a></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-slate-300">Platform</h4>
              <ul className="flex flex-col gap-2 text-sm text-slate-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/dashboard/groups" className="hover:text-white transition-colors">Monitoring Groups</Link></li>
                <li><Link href="/dashboard/settings" className="hover:text-white transition-colors">Settings</Link></li>
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-4 text-slate-300">Legal</h4>
              <ul className="flex flex-col gap-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Entiix Inc. All rights reserved.</p>
            <p className="flex items-center gap-1">Built for growth marketers worldwide 🌍</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
