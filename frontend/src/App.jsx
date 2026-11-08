
import { useState } from "react";
import {
  ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronDown,
  Wifi, ShieldCheck, Camera, Cloud, Building2, Bot, Sparkles,
  Menu, X, Send, MessageCircle, Zap, Clock3, TrendingUp,
  Globe2, Headphones, Shield, Play, Plus, Minus
} from "lucide-react";
import "./App.css";

const solutions = [
  { id: "Internet", icon: Wifi, tag: "CONNECTIVITY", title: "Business Internet", description: "Fast, reliable connectivity that keeps your business moving.", price: "Explore plans" },
  { id: "Wi-Fi", icon: Globe2, tag: "NETWORKING", title: "Smart Wi-Fi", description: "Seamless wireless connectivity across your business.", price: "Explore plans" },
  { id: "CCTV", icon: Camera, tag: "SECURITY", title: "CCTV Solutions", description: "Keep an eye on your business, wherever you are.", price: "Explore plans" },
  { id: "Cloud", icon: Cloud, tag: "DIGITAL", title: "Cloud Solutions", description: "Modern digital tools to work smarter and grow faster.", price: "Explore plans" }
];

const journey = [
  { number: "01", icon: Building2, title: "Tell us about your business", description: "A few details help us understand what you need." },
  { number: "02", icon: Sparkles, title: "Discover your solutions", description: "Get recommendations tailored to your business." },
  { number: "03", icon: ShieldCheck, title: "Verify digitally", description: "Complete your KYC with a guided process." },
  { number: "04", icon: Zap, title: "Get connected", description: "Track your order right up to activation." }
];

const businessTypes = [
  "Retail & Shop",
  "Professional Office",
  "Restaurant & Hospitality",
  "Manufacturing",
  "Healthcare & Pharmacy",
  "Other"
];

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [business, setBusiness] = useState("Retail & Shop");
  const [selectedNeeds, setSelectedNeeds] = useState(["Internet"]);
  const [formSubmitted, setFormSubmitted] = useState(false);

  const [location, setLocation] = useState("");
  const [employees, setEmployees] = useState("");
  const [showDashboard, setShowDashboard] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      text: "Hello! 👋 I'm your Airtel Business Advisor. Tell me a little about your business and I'll help you discover the right solutions."
    }
  ]);

  const toggleNeed = (item) => {
    setSelectedNeeds(current =>
      current.includes(item)
        ? current.filter(value => value !== item)
        : [...current, item]
    );
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const sendMessage = () => {
    const message = chatInput.trim();
    if (!message) return;

    setChatMessages(current => [
      ...current,
      { role: "user", text: message },
      {
        role: "assistant",
        text: "Thanks for sharing! To recommend the right Airtel Business bundle, I'd like to know your business type, number of employees and your primary requirements. You can also use our guided discovery form below."
      }
    ]);
    setChatInput("");
  };

  return (
    <div className="app">

      {/* NAVIGATION */}
      <header className="navbar">
        <div className="nav-container">
          <a className="logo" href="#home">
            <span className="logo-mark">airtel</span>
            <span className="logo-divider"></span>
            <span className="logo-label">Business</span>
          </a>

          <nav className={menuOpen ? "nav-menu open" : "nav-menu"}>
            <a href="#solutions" onClick={() => setMenuOpen(false)}>Solutions</a>
            <a href="#journey" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#about" onClick={() => setMenuOpen(false)}>Why Udyam</a>
            <a href="#discover" className="mobile-link" onClick={() => setMenuOpen(false)}>Get started</a>
          </nav>

          <button className="nav-button" onClick={() => scrollTo("discover")}>
            Get started <ArrowUpRight size={17} />
          </button>

          <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="hero" id="home">
        <div className="hero-decoration hero-decoration-one"></div>
        <div className="hero-decoration hero-decoration-two"></div>

        <div className="hero-container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              A SMARTER WAY TO DO BUSINESS
            </div>

            <h1>
              Your business deserves
              <span className="hero-highlight"> a better connection.</span>
            </h1>

            <p className="hero-subtitle">
              Everything your small business needs to grow.
              Discover, compare and activate Airtel Business
              solutions — all through one simple digital journey.
            </p>

            <div className="hero-buttons">
              <button className="button-primary" onClick={() => scrollTo("discover")}>
                Discover your solution <ArrowRight size={18} />
              </button>
              <button className="button-secondary" onClick={() => scrollTo("solutions")}>
                Explore solutions <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="hero-assurance">
              <span><CheckCircle2 size={16} /> Simple onboarding</span>
              <span><CheckCircle2 size={16} /> Transparent pricing</span>
              <span><CheckCircle2 size={16} /> Digital-first experience</span>
            </div>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="hero-art">
            <div className="art-orbit orbit-one"></div>
            <div className="art-orbit orbit-two"></div>

            <div className="floating-chip chip-top">
              <span className="chip-icon"><Sparkles size={17} /></span>
              <span><strong>Smart recommendations</strong><small>Built around your needs</small></span>
            </div>

            <div className="dashboard-preview">
              <div className="dashboard-top">
                <div>
                  <span className="dashboard-kicker">YOUR BUSINESS SPACE</span>
                  <h3>Good things start here.</h3>
                  <p>Your digital journey, simplified.</p>
                </div>
                <div className="dashboard-avatar"><Building2 size={22} /></div>
              </div>

              <div className="dashboard-welcome">
                <div className="welcome-icon"><Zap size={20} /></div>
                <div>
                  <strong>One platform. Endless possibilities.</strong>
                  <span>Let's get your business connected.</span>
                </div>
              </div>

              <div className="dashboard-label">
                <span>YOUR JOURNEY</span><span>01 / 04</span>
              </div>
              <div className="dashboard-progress"><span></span></div>

              <div className="dashboard-steps">
                {journey.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div className="dashboard-step" key={item.number}>
                      <div className={index === 0 ? "dashboard-step-icon active" : "dashboard-step-icon"}>
                        <Icon size={17} />
                      </div>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.description}</small>
                      </div>
                      {index === 0 && <Check size={17} className="dashboard-check" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="floating-chip chip-bottom">
              <span className="online-indicator"></span>
              <span><strong>One seamless experience</strong><small>From discovery to activation</small></span>
            </div>
          </div>
        </div>

        <div className="hero-bottom-bar">
          <div><span className="hero-bottom-symbol"><Wifi size={18} /></span> CONNECTIVITY</div>
          <div><span className="hero-bottom-symbol"><Shield size={18} /></span> SECURITY</div>
          <div><span className="hero-bottom-symbol"><Cloud size={18} /></span> DIGITAL SOLUTIONS</div>
          <div><span className="hero-bottom-symbol"><Headphones size={18} /></span> BUSINESS SUPPORT</div>
        </div>
      </section>

      {/* INTRO / STATS */}
      <section className="intro-section">
        <div className="intro-inner">
          <div>
            <span className="section-kicker">BUILT AROUND YOUR BUSINESS</span>
            <h2>Less complexity.<br /><span>More opportunity.</span></h2>
          </div>
          <p>
            Small businesses shouldn't need to navigate complicated
            catalogues and endless paperwork. We bring discovery,
            recommendations and onboarding into one experience.
          </p>
        </div>

        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-icon"><Zap size={19} /></span>
            <strong>One</strong>
            <span>guided digital journey</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><Sparkles size={19} /></span>
            <strong>Smart</strong>
            <span>personalised discovery</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><ShieldCheck size={19} /></span>
            <strong>Digital</strong>
            <span>verification experience</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon"><TrendingUp size={19} /></span>
            <strong>Simple</strong>
            <span>business growth journey</span>
          </div>
        </div>
      </section>

      {/* SOLUTIONS */}
      <section className="solutions-section section-padding" id="solutions">
        <div className="section-container">
          <div className="section-heading">
            <div>
              <span className="section-kicker">EXPLORE OUR SOLUTIONS</span>
              <h2>Technology that works<br />as hard as you do.</h2>
            </div>
            <p>
              Choose what your business needs today.
              We'll help you discover the right combination.
            </p>
          </div>

          <div className="solution-grid">
            {solutions.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  className="solution-card"
                  key={item.id}
                  onClick={() => {
                    setSelectedNeeds(current =>
                      current.includes(item.id) ? current : [...current, item.id]
                    );
                    scrollTo("discover");
                  }}
                >
                  <div className="solution-card-header">
                    <div className="solution-icon"><Icon size={25} /></div>
                    <span>0{index + 1}</span>
                  </div>
                  <span className="solution-tag">{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="solution-explore">{item.price}<ArrowUpRight size={17} /></div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI ADVISOR FEATURE */}
      <section className="advisor-section" id="advisor">
        <div className="advisor-inner">
          <div className="advisor-copy">
            <span className="section-kicker">MEET YOUR BUSINESS ADVISOR</span>
            <h2>Not sure what you need?<br /><span>Just ask.</span></h2>
            <p>
              Discover business solutions through a conversational
              experience. Tell us what you do, what you need and
              where you want to grow.
            </p>
            <ul>
              <li><CheckCircle2 size={18} /> Understand your business requirements</li>
              <li><CheckCircle2 size={18} /> Discover suitable products and bundles</li>
              <li><CheckCircle2 size={18} /> Get clear pricing explanations</li>
            </ul>
            <button className="button-primary" onClick={() => setChatOpen(true)}>
              Talk to the advisor <MessageCircle size={18} />
            </button>
          </div>

          <div className="advisor-visual">
            <div className="advisor-window">
              <div className="advisor-window-header">
                <div className="advisor-profile"><Bot size={23} /></div>
                <div><strong>Business Advisor</strong><span><i></i> Ready to help</span></div>
                <Sparkles size={19} className="advisor-sparkle" />
              </div>
              <div className="advisor-conversation">
                <div className="advisor-message">
                  Hello! 👋 What kind of business do you run?
                </div>
                <div className="advisor-options">
                  <span>Retail shop</span><span>Office</span><span>Restaurant</span>
                </div>
                <div className="advisor-user-message">I run a retail shop.</div>
                <div className="advisor-message">
                  Wonderful! Are you looking for internet, security or a complete business solution?
                </div>
                <div className="advisor-typing"><i></i><i></i><i></i></div>
              </div>
              <div className="advisor-input-preview">
                <span>Ask your business advisor...</span><Send size={17} />
              </div>
            </div>
            <div className="advisor-decoration"><Sparkles size={24} /></div>
          </div>
        </div>
      </section>

      {/* JOURNEY */}
      <section className="journey-section section-padding" id="journey">
        <div className="section-container">
          <div className="center-heading">
            <span className="section-kicker">A BETTER WAY FORWARD</span>
            <h2>Four steps. Zero unnecessary complexity.</h2>
            <p>Everything you need, connected through one guided journey.</p>
          </div>

          <div className="journey-grid">
            {journey.map((item, index) => {
              const Icon = item.icon;
              return (
                <div className="journey-card" key={item.number}>
                  <div className="journey-card-top">
                    <span>{item.number}</span><Icon size={23} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {index !== journey.length - 1 && <ArrowRight className="journey-arrow" size={19} />}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY UDYAM */}
      <section className="why-section section-padding" id="about">
        <div className="why-inner">
          <div className="why-copy">
            <span className="section-kicker">WHY UDYAM DIGITAL</span>
            <h2>Make technology<br />the easiest part of<br /><span>running your business.</span></h2>
            <p>
              One destination to discover, compare, verify and activate
              business services — without the usual complexity.
            </p>
            <div className="why-points">
              <div><CheckCircle2 size={19} /> Personalised recommendations</div>
              <div><CheckCircle2 size={19} /> Transparent product quotations</div>
              <div><CheckCircle2 size={19} /> Guided digital KYC</div>
              <div><CheckCircle2 size={19} /> Convenient order tracking</div>
            </div>
          </div>

          <div className="why-panel">
            <div className="why-panel-glow"></div>
            <span className="why-panel-label"><Sparkles size={15} /> BUILT FOR INDIAN SMBs</span>
            <h3>Your next business milestone starts with one simple step.</h3>
            <p>Tell us what your business needs. Let's find the right way forward.</p>
            <button onClick={() => scrollTo("discover")}>
              Start your journey <ArrowRight size={18} />
            </button>
            <div className="why-panel-bottom">DISCOVER <span>·</span> COMPARE <span>·</span> ACTIVATE</div>
          </div>
        </div>
      </section>

      {/* DISCOVERY FORM */}
      <section className="discover-section" id="discover">
        <div className="discover-container">
          <div className="discover-copy">
            <span className="section-kicker">YOUR BUSINESS, YOUR WAY</span>
            <h2>Let's find the<br /><span>right connection.</span></h2>
            <p>
              Start with a few details. We'll use your requirements
              to find suitable Airtel Business solutions.
            </p>
            <div className="discover-trust">
              <div><CheckCircle2 size={18} /> Quick and simple</div>
              <div><ShieldCheck size={18} /> Privacy-conscious journey</div>
              <div><Sparkles size={18} /> Personalised discovery</div>
            </div>
          </div>

          <div className="discovery-card">
            {!formSubmitted ? (
              <>
                <div className="discovery-card-header">
                  <div className="discovery-number">01</div>
                  <div><h3>Let's get to know you.</h3><p>Tell us about your business requirements.</p></div>
                </div>

                <label htmlFor="business-type">
                  What type of business do you run?
                </label>

                <div className="select-wrap">
                  <select
                    id="business-type"
                    value={business}
                    onChange={(e) => setBusiness(e.target.value)}
                  >
                    {businessTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={18} />
                </div>
                <label htmlFor="business-location">
                  Where is your business located?
                </label>

                <input
                  id="business-location"
                  className="business-input"
                  type="text"
                  placeholder="e.g. Dwarka, New Delhi"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <label htmlFor="employee-count">
                  How many employees work in your business?
                </label>

                <select
                  id="employee-count"
                  className="business-input"
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                >
                  <option value="">Select employee count</option>
                  <option value="1-5">1–5 employees</option>
                  <option value="6-10">6–10 employees</option>
                  <option value="11-25">11–25 employees</option>
                  <option value="26-50">26–50 employees</option>
                  <option value="50+">More than 50 employees</option>
                </select>
                <div className="select-wrap">
                  <select id="business-type" value={business} onChange={e => setBusiness(e.target.value)}>
                    {businessTypes.map(type => <option key={type}>{type}</option>)}
                  </select>
                  <ChevronDown size={18} />
                </div>

                <label>What solutions are you interested in?</label>
                <p className="multi-hint">Select all that apply.</p>
                <div className="need-grid">
                  {solutions.map(item => {
                    const Icon = item.icon;
                    const selected = selectedNeeds.includes(item.id);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={selected ? "need-option selected" : "need-option"}
                        onClick={() => toggleNeed(item.id)}
                        aria-pressed={selected}
                      >
                        <Icon size={19} />
                        <span>{item.id}</span>
                        <span className="need-check">{selected && <Check size={13} />}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="selection-summary">
                  <span>{selectedNeeds.length} selected</span>
                  <span>{selectedNeeds.length ? selectedNeeds.join(" · ") : "Choose your requirements"}</span>
                </div>

                <button
                  className="discovery-submit"
                  disabled={selectedNeeds.length === 0 || !location.trim() || !employees}
                  onClick={() => {
                    if (!location.trim() || !employees) {
                      alert("Please enter your business location and employee count.");
                      return;
                    }

                    setFormSubmitted(true);
                  }}
                >
                  Continue to discovery <ArrowRight size={18} />
                </button>
                <p className="privacy-note"><ShieldCheck size={14} /> Your details are handled with care.</p>
              </>
            ) : (
              <div className="discovery-success">
                <div className="success-mark"><CheckCircle2 size={34} /></div>
                <span className="section-kicker">PROFILE STARTED</span>
                <h3>Great choice. Let's find your business solution.</h3>
                <p><strong>Business:</strong> {business}</p>
                <p><strong>Interested in:</strong> {selectedNeeds.join(", ")}</p>
                <button className="discovery-submit" onClick={() => setFormSubmitted(false)}>
                  Edit your answers <ArrowRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section section-padding">
        <div className="section-container faq-inner">
          <div>
            <span className="section-kicker">GOOD TO KNOW</span>
            <h2>Questions?<br />We've got answers.</h2>
          </div>
          <div className="faq-list">
            <details>
              <summary>What is Udyam Digital? <Plus size={18} /></summary>
              <p>A digital-first experience concept to help small businesses discover, compare and activate suitable Airtel Business solutions.</p>
            </details>
            <details>
              <summary>Can I choose multiple solutions? <Plus size={18} /></summary>
              <p>Yes. You can select multiple requirements and explore suitable combinations based on product eligibility.</p>
            </details>
            <details>
              <summary>How does the Business Advisor help? <Plus size={18} /></summary>
              <p>The advisor guides you through business discovery and helps explain product recommendations and pricing.</p>
            </details>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-main">
          <div className="footer-brand-column">
            <a href="#home" className="logo footer-logo">
              <span className="logo-mark">airtel</span>
              <span className="logo-divider"></span>
              <span className="logo-label">Business</span>
            </a>
            <p>Making business connectivity<br />simpler, smarter and more accessible.</p>
          </div>

          <div className="footer-column">
            <strong>EXPLORE</strong>
            <a href="#solutions">Our solutions</a>
            <a href="#journey">How it works</a>
            <a href="#about">Why Udyam</a>
          </div>

          <div className="footer-column">
            <strong>YOUR JOURNEY</strong>
            <a href="#discover">Discover solutions</a>
            <a href="#advisor">Business advisor</a>
            <a href="#discover">Get started</a>
          </div>

          <div className="footer-contact">
            <div className="footer-contact-icon"><Headphones size={21} /></div>
            <strong>Business, made simpler.</strong>
            <p>Discover. Compare. Verify. Activate.</p>
            <button onClick={() => scrollTo("discover")}>Start exploring <ArrowUpRight size={16} /></button>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Project Udyam Digital · Airtel Sync Hackathon Prototype</span>
          <span>Demonstration using synthetic data.</span>
        </div>
      </footer>

      {/* FLOATING CHATBOT */}
      <div className="chat-widget">
        {chatOpen && (
          <div className="chat-window">
            <div className="chat-header">
              <div className="chat-avatar"><Bot size={22} /></div>
              <div><strong>Business Advisor</strong><span><i></i> Online · Prototype</span></div>
              <button onClick={() => setChatOpen(false)} aria-label="Close chat"><X size={19} /></button>
            </div>
            <div className="chat-body">
              <div className="chat-date">YOUR BUSINESS, YOUR WAY</div>
              {chatMessages.map((message, index) => (
                <div key={index} className={message.role === "user" ? "chat-message user" : "chat-message assistant"}>
                  {message.text}
                </div>
              ))}
              <button className="chat-suggestion" onClick={() => setChatInput("I run a retail shop and need internet and CCTV.")}>
                <Sparkles size={14} /> Help me choose solutions
              </button>
            </div>
            <div className="chat-compose">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask about your business..."
              />
              <button onClick={sendMessage} aria-label="Send message"><Send size={17} /></button>
            </div>
            <div className="chat-disclaimer">Prototype advisor · Recommendations will be connected to the product catalogue.</div>
          </div>
        )}

        <button className="chat-launcher" onClick={() => setChatOpen(!chatOpen)} aria-label="Open Business Advisor">
          {chatOpen ? <X size={24} /> : <><MessageCircle size={23} /><span>Ask our AI advisor</span><Sparkles size={16} /></>}
        </button>
      </div>
    </div>
  );
}

export default App;
