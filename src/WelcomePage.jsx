import React from "react";

const plans = [
  {
    name: "Get Started",
    price: "Free",
    detail: "A place to begin",
    features: [
      "First three assessment sections",
      "Save your progress and return later",
      "Safety flag summary",
    ],
  },
  {
    name: "Full Assessment",
    price: "$19",
    detail: "One-time purchase",
    features: [
      "All 16 assessment sections",
      "Your Home Accessibility Profile",
      "Safety flags throughout",
      "Unlimited edits and resets",
    ],
  },
  {
    name: "Contractor Ready",
    price: "$39",
    detail: "One-time purchase",
    features: [
      "Everything in Full Assessment",
      "Accessibility Priority Plan",
      "Contractor Preparation Package",
      "Funding & Documentation Checklist",
    ],
  },
];

export default function WelcomePage({ onGetStarted, onSignIn }) {
  return (
    <div className="ap-welcome">
      <style>{`
        .ap-welcome {
          --ink: #233d34;
          --muted: #52635b;
          --green: #315e4e;
          --line: #d6dfd6;
          background: #faf9f5;
          color: var(--ink);
          font-family: Arial, sans-serif;
          line-height: 1.65;
          min-height: 100vh;
        }
        .ap-welcome * { box-sizing: border-box; }
        .ap-welcome h1, .ap-welcome h2, .ap-welcome h3,
        .ap-welcome p { margin: 0; }
        .ap-welcome button { font: inherit; cursor: pointer; }
        .ap-welcome button:focus-visible,
        .ap-welcome a:focus-visible {
          outline: 3px solid #96632d;
          outline-offset: 5px;
        }
        .ap-wrap { width: min(1120px, 100% - 48px); margin: auto; }
        .ap-header {
          display: flex; align-items: center;
          justify-content: space-between; gap: 20px;
          padding: 24px 0; border-bottom: 1px solid var(--line);
        }
        .ap-brand {
          font-family: Georgia, serif;
          font-size: 28px; font-weight: bold;
        }
        .ap-link {
          border: 0; background: transparent;
          color: var(--green); text-decoration: underline;
          padding: 10px 4px; font-weight: bold;
        }
        .ap-hero {
          display: grid; grid-template-columns: 1.25fr 1fr;
          align-items: center; gap: 64px; padding: 76px 0;
        }
        .ap-eyebrow {
          font-size: 12px; font-weight: bold;
          letter-spacing: 2px; text-transform: uppercase;
          color: var(--green); margin-bottom: 18px !important;
        }
        .ap-welcome h1 {
          font-family: Georgia, serif; font-weight: normal;
          font-size: clamp(38px, 5vw, 60px);
          line-height: 1.12; letter-spacing: -1.5px;
        }
        .ap-intro {
          font-size: 18px; color: var(--muted);
          margin-top: 24px !important; max-width: 560px;
        }
        .ap-primary {
          background: var(--green); color: white;
          border: 1px solid var(--green); border-radius: 8px;
          padding: 14px 24px; font-weight: bold;
          min-height: 48px;
        }
        .ap-primary:hover { background: #244a3c; }
        .ap-actions {
          display: flex; align-items: center;
          flex-wrap: wrap; gap: 20px; margin-top: 28px;
        }
        .ap-note {
          font-size: 14px; color: var(--muted);
          margin-top: 12px !important;
        }
        .ap-preview {
          background: #e8eee5; border-radius: 24px;
          padding: 30px; border: 1px solid var(--line);
        }
        .ap-preview h2 {
          font-family: Georgia, serif; font-size: 29px;
          line-height: 1.25; font-weight: normal;
        }
        .ap-example {
          margin-top: 22px; background: white;
          border-radius: 12px; padding: 22px;
        }
        .ap-example p + p { margin-top: 12px; }
        .ap-section {
          padding: 60px 0; border-top: 1px solid var(--line);
        }
        .ap-section h2 {
          font-family: Georgia, serif; font-size: 36px;
          line-height: 1.2; font-weight: normal;
        }
        .ap-subtitle {
          color: var(--muted); max-width: 660px;
          margin-top: 14px !important;
        }
        .ap-grid {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 22px; margin-top: 30px;
        }
        .ap-step { padding: 10px 0; }
        .ap-number {
          display: block; color: var(--green);
          font-size: 14px; font-weight: bold; margin-bottom: 12px;
        }
        .ap-welcome h3 { font-size: 19px; margin-bottom: 10px; }
        .ap-step p { color: var(--muted); }
        .ap-plan {
          background: white; border: 1px solid var(--line);
          border-radius: 14px; padding: 26px;
        }
        .ap-price {
          font-family: Georgia, serif; font-size: 38px;
          line-height: 1.3;
        }
        .ap-plan ul { padding-left: 20px; margin: 22px 0 0; }
        .ap-plan li { margin: 10px 0; }
        .ap-bottom {
          background: #e8eee5; padding: 36px;
          border-radius: 16px; margin-top: 32px;
        }
        .ap-footer {
          padding: 30px 0; border-top: 1px solid var(--line);
          color: var(--muted); font-size: 14px;
        }
        .ap-footer a { color: var(--green); overflow-wrap: anywhere; }
        @media (max-width: 760px) {
          .ap-wrap { width: calc(100% - 36px); }
          .ap-hero { grid-template-columns: 1fr; gap: 32px; padding: 44px 0; }
          .ap-grid { grid-template-columns: 1fr; }
          .ap-section { padding: 40px 0; }
          .ap-preview, .ap-bottom { padding: 24px; }
          .ap-section h2 { font-size: 30px; }
        }
      `}</style>

      <div className="ap-wrap">
        <header className="ap-header">
          <span className="ap-brand">AccessPath</span>
          <button className="ap-link" onClick={onSignIn}>
            Sign in
          </button>
        </header>

        <main>
          <section className="ap-hero" aria-labelledby="welcome-heading">
            <div>
              <p className="ap-eyebrow">Your home. Your next step.</p>
              <h1 id="welcome-heading">
                Make a plan for a more accessible home.
              </h1>
              <p className="ap-intro">
                Understand the barriers in your home and organize what
                matters next. A guided assessment for you, your family,
                and the people helping you live more independently.
              </p>
              <div className="ap-actions">
                <button className="ap-primary" onClick={onGetStarted}>
                  Get started free
                </button>
                <button className="ap-link" onClick={onSignIn}>
                  Continue my assessment
                </button>
              </div>
              <p className="ap-note">
                Start with three free sections. Create an account to
                save your progress. No payment required to begin.
              </p>
            </div>

            <aside className="ap-preview" aria-label="Assessment preview">
              <p className="ap-eyebrow">A clearer starting point</p>
              <h2>Start with everyday life at home.</h2>
              <div className="ap-example">
                <p><strong>Think about your home:</strong></p>
                <p>Where is moving around difficult?</p>
                <p>Which daily activities need more support?</p>
                <p>What would you like to discuss with your family or a professional?</p>
              </div>
              <p className="ap-note">
                These examples show the kinds of concerns you can organize.
              </p>
            </aside>
          </section>

          <section className="ap-section" aria-labelledby="how-heading">
            <p className="ap-eyebrow">One step at a time</p>
            <h2 id="how-heading">You don’t need all the answers to begin.</h2>
            <div className="ap-grid">
              <div className="ap-step">
                <span className="ap-number">01 / DESCRIBE</span>
                <h3>Tell your home’s story</h3>
                <p>
                  Answer guided questions about your needs, daily
                  routines, and home environment.
                </p>
              </div>
              <div className="ap-step">
                <span className="ap-number">02 / TAKE YOUR TIME</span>
                <h3>Go at your own pace</h3>
                <p>
                  Save your progress and return when you’re ready.
                  Work through it yourself or with someone you trust.
                </p>
              </div>
              <div className="ap-step">
                <span className="ap-number">03 / PLAN</span>
                <h3>Prepare for the next conversation</h3>
                <p>
                  Use your assessment to organize concerns. Paid plans
                  add a Home Accessibility Profile and further planning tools.
                </p>
              </div>
            </div>
          </section>

          <section className="ap-section" aria-labelledby="plans-heading">
            <p className="ap-eyebrow">Clear choices</p>
            <h2 id="plans-heading">Begin free. Choose more when you need it.</h2>
            <p className="ap-subtitle">
              Paid plans are one-time purchases, with no subscription.
              You can review the options inside your account.
            </p>

            <div className="ap-grid">
              {plans.map((plan) => (
                <article className="ap-plan" key={plan.name}>
                  <h3>{plan.name}</h3>
                  <p className="ap-price">{plan.price}</p>
                  <p className="ap-note">{plan.detail}</p>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <div className="ap-bottom">
              <h3>Your next step can be a small one.</h3>
              <p>Start understanding your home, one question at a time.</p>
              <div className="ap-actions">
                <button className="ap-primary" onClick={onGetStarted}>
                  Get started free
                </button>
              </div>
            </div>
          </section>
        </main>

        <footer className="ap-footer">
          <p>
            AccessPath helps organize information for planning. It does
            not replace a professional home assessment, medical advice,
            or a building-code inspection.
          </p>
          <p style={{ marginTop: 12 }}>
            Questions?{" "}
            <a href="mailto:hello.accesspath@outlook.com">
              hello.accesspath@outlook.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
