export default function Home() {
  return (
    <main className="landing-screen">
      <div className="landing-backdrop" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/image-2.png" alt="" />
      </div>
      <header className="landing-header"><a href="/" className="landing-brand"><span>RYC</span> GLOBAL WAR</a><a href="/login" className="landing-login">Log in <span aria-hidden="true">↗</span></a></header>
      <section className="landing-copy">
        <p className="landing-eyebrow"><span /> A living geopolitical strategy game</p>
        <h1>Represent your city.<br /><em>Shape the world.</em></h1>
        <p className="landing-description">Build influence from the ground up. Choose your profession, establish a home base, and write your city into history.</p>
        <div className="landing-actions"><a className="landing-primary" href="/signup">Create your account <span aria-hidden="true">→</span></a><a className="landing-secondary" href="/login">Already enlisted? Log in</a></div>
      </section>
      <footer className="landing-footer"><span>GLOBAL WAR / SEASON 01</span><span>THE WORLD STARTS AT HOME</span></footer>
    </main>
  );
}