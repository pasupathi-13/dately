import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  BellRing,
  Smartphone,
  ChevronRight,
  FileText,
  Calendar,
  AlertTriangle,
  UserCheck,
  CreditCard,
  Briefcase,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Zap,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Upload,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useDately } from '@/context/DatelyContext';

export default function LandingPage() {
  const { navigateTo } = useDately();

  // Interactive Live OCR Simulator states
  const [simState, setSimState] = useState('idle'); // 'idle' | 'uploading' | 'parsing' | 'completed'
  const [simProgress, setSimProgress] = useState(0);
  const [simDocName, setSimDocName] = useState('driving_licence.pdf');

  // FAQ states
  const [openFaq, setOpenFaq] = useState(null);

  // Pricing duration state
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // 'monthly' | 'yearly'

  // Run progress animation for simulator
  useEffect(() => {
    let interval;
    if (simState === 'uploading') {
      interval = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) {
            setSimState('parsing');
            return 0;
          }
          return prev + 10;
        });
      }, 150);
    } else if (simState === 'parsing') {
      interval = setInterval(() => {
        setSimProgress((prev) => {
          if (prev >= 100) {
            setSimState('completed');
            return 100;
          }
          return prev + 15;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [simState]);

  const triggerOcrSimulator = (filename) => {
    setSimDocName(filename);
    setSimProgress(0);
    setSimState('uploading');
  };

  const resetOcrSimulator = () => {
    setSimState('idle');
    setSimProgress(0);
  };

  const toggleFaq = (idx) => {
    if (openFaq === idx) setOpenFaq(null);
    else setOpenFaq(idx);
  };

  const faqs = [
    {
      q: 'How does Dately remind me of my expiries?',
      a: 'Dately runs background scheduling checks. When an expiry or payment approaches (30 days, 7 days, 3 days, and 1 day before), we trigger alerts across your configured channels: in-app notifications, detailed emails, SMS texts, and automated voice calls for high-urgency deadlines.'
    },
    {
      q: 'Is my personal document data secure?',
      a: 'Absolutely. We enforce strict client-side encryption rules. Your uploaded PDF/PNG copies are vaulted securely. We do not sell your personal files or share private metadata without your explicit permission.'
    },
    {
      q: 'Can I import documents from DigiLocker?',
      a: 'Yes, our long-term roadmap supports direct verified synchronization with DigiLocker. In the frontend prototype, we simulate connecting verified document vaults directly into your active dashboard.'
    },
    {
      q: 'How does the payment rollover work for repeating bills?',
      a: 'When you check a recurring bill (e.g. Monthly Rent) as paid, Dately automatically rolls over the due date to the next month (or your custom repeat interval) and logs a system notification, keeping your checklist up to date.'
    }
  ];

  return (
    <div className="min-h-screen bg-dately-background text-dately-navy flex flex-col font-sans">
      {/* Header / Navigation */}
      <header className="sticky top-0 w-full bg-dately-primary/95 backdrop-blur-md border-b border-white/10 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8.5 h-8.5 rounded-lg bg-dately-success flex items-center justify-center font-bold text-white shadow-md text-base">
              D
            </div>
            <span className="font-extrabold text-xl tracking-wider text-white">DATELY</span>
          </div>

          <nav className="hidden md:flex space-x-8 text-base font-semibold text-white/80">
            <a href="#why-dately" className="hover:text-white transition-colors">Why Dately</a>
            <a href="#demo" className="hover:text-white transition-colors">Interactive Demo</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateTo('login')}
              className="text-base font-bold text-white/90 hover:text-white px-3 py-1.5 transition-colors bg-transparent border-0 cursor-pointer"
            >
              Sign In
            </button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigateTo('signup')}
              className="shadow-sm font-bold text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden bg-gradient-to-br from-dately-primary via-dately-primary to-dately-secondary text-white border-b border-white/10 text-left">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(37,184,122,0.15),transparent_50%)]"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-white/10 text-dately-success border border-white/15 px-4 py-1.5 rounded-full text-sm font-bold shadow-inner">
                <Sparkles className="w-4.5 h-4.5 text-dately-success animate-pulse" />
                <span>Modern Personal Renewal Assistant</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6.5xl font-extrabold tracking-tight leading-tight">
                All your expiries. <br />
                All your bills. <br />
                <span className="text-dately-success">One central vault.</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-white/80 max-w-xl leading-relaxed font-medium">
                Keep driving licences, passport expiries, vehicle insurance, subscriptions, utilities, and EMI obligations coordinated under one premium dashboard.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto shadow-lg font-extrabold px-8 flex items-center justify-center py-3.5 text-base"
                  onClick={() => navigateTo('signup')}
                >
                  Create Free Account
                  <ChevronRight className="ml-1.5 w-5 h-5" />
                </Button>
                <a href="#demo" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center font-extrabold rounded-lg transition-colors px-6 py-3.5 text-base border border-white/30 text-white hover:bg-white/10 bg-transparent cursor-pointer">
                    Try Interactive Demo
                  </button>
                </a>
              </div>

              {/* Trust markers */}
              <div className="flex items-center space-x-6 pt-6 border-t border-white/10 text-white/70 text-sm font-medium">
                <div className="flex items-center space-x-1.5">
                  <Lock className="w-4.5 h-4.5 text-dately-success" />
                  <span>AES-256 Encrypted</span>
                </div>
                <div>•</div>
                <div>No credit card required</div>
                <div>•</div>
                <div>Cancel anytime</div>
              </div>
            </div>

            {/* Hero Right Mockup Showcase */}
            <div className="lg:col-span-5 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-dately-success/20 to-transparent blur-[50px] pointer-events-none"></div>
              
              {/* Card stack mockup */}
              <div className="relative bg-white/5 backdrop-blur-md border border-white/15 p-5 rounded-2xl shadow-2xl">
                <div className="bg-white rounded-xl p-5 text-dately-navy shadow-inner space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-dately-border">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 bg-red-400 rounded-full"></span>
                      <span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span>
                      <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>
                    </div>
                    <span className="text-xs text-dately-slate font-extrabold uppercase tracking-wider">Live Monitors</span>
                  </div>

                  {/* Expiring Alert Card */}
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 bg-dately-danger/10 rounded-lg flex items-center justify-center text-dately-danger">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-extrabold block text-dately-navy">Vehicle Insurance</span>
                        <span className="text-xs text-dately-danger font-bold mt-0.5">Expires in 7 days</span>
                      </div>
                    </div>
                    <span className="text-xs bg-dately-danger text-white px-2.5 py-1 rounded-full font-extrabold">Renew</span>
                  </div>

                  {/* Due Payment Card */}
                  <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-xl">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 bg-dately-warning/10 rounded-lg flex items-center justify-center text-dately-warning">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-extrabold block text-dately-navy">Car EMI Payment</span>
                        <span className="text-xs text-dately-warning font-bold mt-0.5">Due in 3 days</span>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-dately-navy">₹8,500</span>
                  </div>

                  {/* Completed Card */}
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-xl">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 bg-dately-success/10 rounded-lg flex items-center justify-center text-dately-success">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-extrabold block text-dately-navy">Electricity Bill</span>
                        <span className="text-xs text-dately-success font-bold mt-0.5">Paid Successful</span>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-dately-success">Paid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Numbers Bar */}
      <section className="bg-white border-b border-dately-border py-10 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: '99.9%', desc: 'Alert Delivery Success' },
            { val: '10,000+', desc: 'Active Vaults Monitored' },
            { val: 'AES-256', desc: 'Secure Client Encryption' },
            { val: 'Zero', desc: 'Late-Fees Experienced' }
          ].map((item, idx) => (
            <div key={idx}>
              <p className="text-3xl sm:text-4xl font-extrabold text-dately-primary font-sans">{item.val}</p>
              <p className="text-xs uppercase tracking-widest text-dately-slate font-extrabold mt-1.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Dately Section */}
      <section id="why-dately" className="py-24 bg-dately-background border-b border-dately-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold uppercase tracking-wider text-dately-danger mb-2">The Challenge</h2>
            <h3 className="text-3.5xl font-extrabold text-dately-navy">Smarter Lifespans Require Smarter Reminders</h3>
            <p className="text-dately-slate mt-4 leading-relaxed text-base">
              Missing an expiry, utility bill, or insurance rollover is expensive and stressful. Dately centralizes your commitments, providing visual countdown indicators and automated broadcast alerts before deadlines occur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch">
            {/* Without Dately Card */}
            <div className="bg-white border border-dately-border rounded-2xl p-8 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
              <div className="space-y-5">
                <h4 className="text-xl font-bold text-dately-danger flex items-center space-x-2">
                  <XCircle className="w-5.5 h-5.5" />
                  <span>Chaos (Without Dately)</span>
                </h4>
                <ul className="space-y-4.5 text-sm text-dately-slate font-medium">
                  <li className="flex items-start space-x-2.5">
                    <span className="text-red-500 font-extrabold mr-1.5">•</span>
                    <span>Document expiries pass unnoticed, generating government fines or cover lapses.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="text-red-500 font-extrabold mr-1.5">•</span>
                    <span>Important details are scattered across mail attachments, phone galleries, and desk shelves.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="text-red-500 font-extrabold mr-1.5">•</span>
                    <span>Manual calculations and calendar checks are needed to track due rent and EMI balances.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* With Dately Card */}
            <div className="bg-white border-2 border-dately-primary/35 rounded-2xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-dately-primary/60 transition-colors">
              <div className="absolute top-0 right-0 bg-dately-primary/10 text-dately-primary text-xs font-extrabold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                Recommended
              </div>
              <div className="space-y-5">
                <h4 className="text-xl font-bold text-dately-success flex items-center space-x-2">
                  <CheckCircle2 className="w-5.5 h-5.5" />
                  <span>Clarity (With Dately)</span>
                </h4>
                <ul className="space-y-4.5 text-sm text-dately-slate font-medium">
                  <li className="flex items-start space-x-2.5">
                    <span className="text-dately-success font-extrabold mr-1.5">•</span>
                    <span>Active countdown alarms alert you weeks before document expiries.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="text-dately-success font-extrabold mr-1.5">•</span>
                    <span>All PDFs and metadata details are organized in a single, safe folder vault.</span>
                  </li>
                  <li className="flex items-start space-x-2.5">
                    <span className="text-dately-success font-extrabold mr-1.5">•</span>
                    <span>A clean dashboard maps spending weight outflows, auto-renewals, and check logs.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive OCR Demo Simulator Section */}
      <section id="demo" className="py-24 bg-white border-b border-dately-border text-left relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Demo Copy (Left 5) */}
            <div className="lg:col-span-5 space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-dately-primary">Try It Live</h2>
              <h3 className="text-3.5xl font-extrabold text-dately-navy">Experience Our Smart Scanners</h3>
              <p className="text-dately-slate text-sm leading-relaxed">
                Click a sample document to test our mock metadata scanner. Watch how Dately instantly extracts names, issuers, and expiry dates to schedule automatic reminders.
              </p>
              
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => triggerOcrSimulator('vehicle_insurance_policy.pdf')}
                  className="w-full text-left p-4 border border-dately-border rounded-xl hover:border-dately-primary/30 hover:bg-slate-50 transition-colors font-bold text-sm flex items-center justify-between cursor-pointer bg-transparent"
                >
                  <span className="flex items-center"><FileText className="w-5 h-5 mr-2.5 text-dately-primary" /> vehicle_insurance_policy.pdf</span>
                  <ChevronRight className="w-5 h-5 text-dately-slate" />
                </button>
                <button
                  onClick={() => triggerOcrSimulator('driving_licence_card.png')}
                  className="w-full text-left p-4 border border-dately-border rounded-xl hover:border-dately-primary/30 hover:bg-slate-50 transition-colors font-bold text-sm flex items-center justify-between cursor-pointer bg-transparent"
                >
                  <span className="flex items-center"><FileText className="w-5 h-5 mr-2.5 text-dately-primary" /> driving_licence_card.png</span>
                  <ChevronRight className="w-5 h-5 text-dately-slate" />
                </button>
              </div>
            </div>

            {/* Demo Screen (Right 7) */}
            <div className="lg:col-span-7 bg-dately-background border border-dately-border rounded-2xl p-8 shadow-md relative min-h-[380px] flex flex-col justify-between">
              {simState === 'idle' && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                  <div className="w-16 h-16 bg-dately-primary/5 text-dately-primary rounded-full flex items-center justify-center">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h4 className="font-extrabold text-base text-dately-navy">Document Parser is Idle</h4>
                  <p className="text-sm text-dately-slate max-w-sm">
                    Select one of the sample files on the left to simulate the automated parsing and expiry extraction pipeline.
                  </p>
                </div>
              )}

              {simState === 'uploading' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
                  <Loader2 className="w-12 h-12 text-dately-primary animate-spin" />
                  <h4 className="font-extrabold text-base text-dately-navy">Uploading Mock Attachment...</h4>
                  <p className="text-sm text-dately-slate font-medium">Storing securely in temporary mock vault buffer ({simProgress}%)...</p>
                  <div className="w-56 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-dately-primary h-full transition-all" style={{ width: `${simProgress}%` }} />
                  </div>
                </div>
              )}

              {simState === 'parsing' && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
                  <Loader2 className="w-12 h-12 text-dately-success animate-spin" />
                  <h4 className="font-extrabold text-base text-dately-navy">Parsing Metadata & Running OCR...</h4>
                  <p className="text-sm text-dately-slate font-medium">Scanning document fields for expirations and issuer smartcards...</p>
                </div>
              )}

              {simState === 'completed' && (
                <div className="flex-1 flex flex-col justify-between p-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-dately-border pb-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5.5 h-5.5 text-dately-success" />
                      <span className="text-sm font-extrabold text-dately-navy">Parsed Result: {simDocName}</span>
                    </div>
                    <button
                      onClick={resetOcrSimulator}
                      className="text-xs text-dately-primary font-bold hover:underline bg-transparent border-0 cursor-pointer p-0"
                    >
                      Reset Simulator
                    </button>
                  </div>

                  {/* Extracted Card Form Mock */}
                  <div className="bg-white border border-dately-border rounded-xl p-5 space-y-4 shadow-sm font-sans text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-dately-slate font-bold">Document Name</span>
                        <span className="font-extrabold text-dately-navy block mt-1">
                          {simDocName.includes('insurance') ? 'Vehicle Insurance Policy' : 'Personal Driving Licence'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-dately-slate font-bold">Issuer / Provider</span>
                        <span className="font-extrabold text-dately-navy block mt-1">
                          {simDocName.includes('insurance') ? 'ABC Insurance Group' : 'Regional Transport Office (RTO)'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-xs uppercase tracking-wider text-dately-slate font-bold">Extracted Expiry Date</span>
                        <span className="font-extrabold text-dately-danger block mt-1">
                          {simDocName.includes('insurance') ? '2026-08-26' : '2028-11-18'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs uppercase tracking-wider text-dately-slate font-bold">Extracted Category</span>
                        <span className="font-extrabold text-dately-navy block mt-1">
                          {simDocName.includes('insurance') ? 'Insurance' : 'Identity'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <Button variant="primary" size="md" onClick={() => navigateTo('signup')} className="w-full sm:w-auto font-bold text-sm">
                      Register Now to Vault This File
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-24 bg-dately-background border-b border-dately-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-sm font-bold uppercase tracking-wider text-dately-primary mb-2">Capabilities</h2>
            <h3 className="text-3.5xl font-extrabold text-dately-navy">Engineered for absolute clarity</h3>
            <p className="text-dately-slate mt-4 text-base leading-relaxed">
              Dately maps your files, due balances, categories, and rollover rules, providing automated calendar schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Smart Document Vault',
                desc: 'Upload attachments and view extracted metadata. Categorize under Identity, Vehicle, Insurance, Health, etc.',
                icon: FileText,
                color: 'text-dately-primary bg-dately-primary/10'
              },
              {
                title: 'Expiry Date Countdown',
                desc: 'Never drive with an expired licence or lose insurance coverage. Active countdown monitors alert you weeks in advance.',
                icon: Clock,
                color: 'text-dately-warning bg-dately-warning/10'
              },
              {
                title: 'Bills & Commitment Log',
                desc: 'Keep EMIs, rent, subscriptions, and utilities organized. Filter upcoming due dates and payment values.',
                icon: CreditCard,
                color: 'text-dately-secondary bg-dately-secondary/10'
              },
              {
                title: 'Broadcast Integrations',
                desc: 'Configure alert frequencies. Receive notifications via app dashboard, detailed emails, SMS texts, and voice calls.',
                icon: BellRing,
                color: 'text-blue-600 bg-blue-50'
              },
              {
                title: 'Renewal Center Guides',
                desc: 'Step-by-step renewal action guides. View detailed links and status checkers for government processes.',
                icon: RefreshCw,
                color: 'text-dately-success bg-dately-success/10'
              },
              {
                title: 'AES-256 Client Security',
                desc: 'Documents and metadata details are encrypted client-side. We prioritize privacy, giving you complete backup export control.',
                icon: Shield,
                color: 'text-purple-600 bg-purple-50'
              },
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="bg-white border border-dately-border rounded-2xl p-6 lg:p-7 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${feat.color}`}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    <h4 className="text-lg font-bold text-dately-navy">{feat.title}</h4>
                    <p className="text-sm text-dately-slate leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Matrix Section */}
      <section id="pricing" className="py-24 bg-white border-b border-dately-border text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-sm font-bold uppercase tracking-wider text-dately-primary mb-2">Pricing</h2>
            <h3 className="text-3.5xl font-extrabold text-dately-navy">Plans for every lifestyle</h3>
            <p className="text-dately-slate mt-4 text-base">Choose the plan that matches your vault storage and broadcast alert requirements.</p>
            
            {/* Toggle Switch */}
            <div className="flex items-center justify-center space-x-4 mt-8">
              <span className={`text-sm font-extrabold ${billingPeriod === 'monthly' ? 'text-dately-primary' : 'text-dately-slate'}`}>Billed Monthly</span>
              <button
                onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
                className="w-12 h-7 bg-slate-200 rounded-full relative p-0.5 focus:outline-none transition-colors peer cursor-pointer border-0"
              >
                <div className={`w-6 h-6 bg-dately-primary rounded-full transition-transform ${billingPeriod === 'yearly' ? 'translate-x-5' : 'translate-x-0'}`}></div>
              </button>
              <span className={`text-sm font-extrabold ${billingPeriod === 'yearly' ? 'text-dately-primary' : 'text-dately-slate'}`}>
                Billed Yearly <span className="bg-dately-success/15 text-dately-success text-xs font-extrabold px-3 py-1 rounded-full ml-1.5 uppercase tracking-wider">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free Plan */}
            <div className="bg-dately-background border border-dately-border rounded-2xl p-8 flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-dately-slate">Starter Plan</span>
                <h4 className="text-3xl font-extrabold text-dately-navy">Free Tier</h4>
                <p className="text-sm text-dately-slate leading-relaxed">Essential monitoring for personal expirations.</p>
                <div className="py-3">
                  <span className="text-5xl font-extrabold text-dately-navy">₹0</span>
                  <span className="text-sm text-dately-slate font-bold"> / forever</span>
                </div>
                <hr className="border-dately-border" />
                <ul className="space-y-4 text-sm text-dately-navy font-bold">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />
                    <span>Up to 5 secure document vault files</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />
                    <span>Up to 5 pending obligations</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />
                    <span>In-App Dashboard Alerts</span>
                  </li>
                  <li className="flex items-center space-x-2.5 text-dately-slate">
                    <XCircle className="w-5 h-5 text-dately-slate/40 flex-shrink-0" />
                    <span className="line-through">Email & SMS broadcast alerts</span>
                  </li>
                  <li className="flex items-center space-x-2.5 text-dately-slate">
                    <XCircle className="w-5 h-5 text-dately-slate/40 flex-shrink-0" />
                    <span className="line-through">Voice Call emergency alerts</span>
                  </li>
                </ul>
              </div>
              <button
                onClick={() => navigateTo('signup')}
                className="mt-8 w-full py-3 bg-white border border-dately-border text-dately-navy font-extrabold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                Sign Up Free
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white border-2 border-dately-primary rounded-2xl p-8 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-dately-primary text-white text-xs font-extrabold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                Popular
              </div>
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-dately-primary">Pro Plan</span>
                <h4 className="text-3xl font-extrabold text-dately-navy">Premium Vault</h4>
                <p className="text-sm text-dately-slate leading-relaxed">Full multi-channel coverage and unlimited vault storage.</p>
                <div className="py-3">
                  <span className="text-5xl font-extrabold text-dately-navy">
                    {billingPeriod === 'monthly' ? '₹199' : '₹159'}
                  </span>
                  <span className="text-sm text-dately-slate font-bold">
                    {billingPeriod === 'monthly' ? ' / month' : ' / month (billed yearly)'}
                  </span>
                </div>
                <hr className="border-dately-border" />
                <ul className="space-y-4 text-sm text-dately-navy font-bold">
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />
                    <span>Unlimited document vault files</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />
                    <span>Unlimited obligation checks</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />
                    <span>Dashboard, Email, & SMS broadcasts</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />
                    <span>Emergency Automated Voice Call alarms</span>
                  </li>
                  <li className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-dately-success flex-shrink-0" />
                    <span>Roll-over repeat payment schedules</span>
                  </li>
                </ul>
              </div>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigateTo('signup')}
                className="mt-8 py-3 shadow-md font-extrabold text-sm"
              >
                Go Premium
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 bg-dately-background border-b border-dately-border text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold uppercase tracking-wider text-dately-primary mb-2">Support</h2>
            <h3 className="text-3.5xl font-extrabold text-dately-navy">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white border border-dately-border rounded-xl overflow-hidden transition-all shadow-sm"
                >
                  <div
                    onClick={() => toggleFaq(idx)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm font-extrabold text-dately-navy">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-dately-slate flex-shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-dately-slate flex-shrink-0 ml-4" />
                    )}
                  </div>
                  {isOpen && (
                    <div className="p-5 border-t border-dately-border text-sm text-dately-slate bg-slate-50/30 leading-relaxed font-sans font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-24 bg-dately-background border-b border-dately-border text-left">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-gradient-to-br from-dately-primary to-dately-secondary text-white rounded-2xl p-10 sm:p-14 shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-white/5 rounded-full blur-[40px] pointer-events-none"></div>
          <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 font-sans">Never Miss Another Expiry</h3>
          <p className="text-base text-white/80 max-w-xl mx-auto leading-relaxed mb-8 font-medium">
            Join thousands of users organizing bills, driver licences, passport expirations, and subscription renewals. Create your secure vault today.
          </p>
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigateTo('signup')}
              className="px-10 py-3.5 shadow-md font-extrabold text-base"
            >
              Start For Free
              <ChevronRight className="ml-1.5 w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 border-t border-dately-border mt-auto text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 border-b border-dately-border pb-12">
            {/* Brand (Col 2 width on desktop) */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8.5 h-8.5 rounded-lg bg-dately-primary flex items-center justify-center font-bold text-white shadow-sm text-base">
                  D
                </div>
                <span className="font-extrabold text-lg tracking-wider text-dately-primary">DATELY</span>
              </div>
              <p className="text-sm text-dately-slate max-w-xs leading-relaxed font-medium">
                The modern Personal Obligation & Renewal Assistant mapping your critical timelines and deadlines securely.
              </p>
            </div>

            {/* Sitemap Lists */}
            {/* Col 1 */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-dately-navy mb-4 font-sans">Product</h5>
              <ul className="space-y-3 text-sm text-dately-slate font-semibold">
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Smart Vault</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Alert Engine</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Renewal Hub</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">DigiLocker Sync</a></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-dately-navy mb-4 font-sans">Company</h5>
              <ul className="space-y-3 text-sm text-dately-slate font-semibold">
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">About Us</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Careers</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Security Audit</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Press Kit</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-dately-navy mb-4 font-sans">Legal</h5>
              <ul className="space-y-3 text-sm text-dately-slate font-semibold">
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">GDPR / Compliance</a></li>
                <li><a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Data Portability</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 text-sm text-dately-slate font-semibold space-y-4 sm:space-y-0">
            <span>© {new Date().getFullYear()} Dately Technologies Inc. All rights reserved.</span>
            <div className="flex space-x-6">
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">Twitter</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">LinkedIn</a>
              <a href="#" onClick={(e) => e.preventDefault()} className="hover:text-dately-primary transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
