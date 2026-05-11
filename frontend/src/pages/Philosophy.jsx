import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Philosophy() {
  // Ensure the page always loads at the very top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="editorial-page-wrapper">
      
      {/* 1. The Immersive Hero */}
      <section className="editorial-hero">
        <div className="editorial-hero-text">
          <span className="section-label">Our Philosophy</span>
          <h1>The ultimate luxury<br/>is purity.</h1>
        </div>
      </section>

      {/* 2. The Core Vision & Science */}
      <section className="editorial-block">
        <div className="editorial-split">
          <div className="editorial-content">
            <span className="section-label">The Core Vision</span>
            <h2>Wellness begins at the source.</h2>
            <p>At Emerald Green Labs, our philosophy is rooted in a simple, uncompromising principle: the most powerful nourishment comes directly from nature, unaltered and uncompromised.</p>
            <p>Choosing organic is not just a preference; it is our foundational commitment to your health and the integrity of the environment.</p>

            <h3 style={{fontFamily: 'Montserrat', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--gold)', marginTop: '4rem', marginBottom: '1rem'}}>The Science of Vitality</h3>
            <p>Nature provides everything the body needs to thrive. However, conventional farming often strips away these benefits through synthetic pesticides, herbicides, and artificial fertilizers.</p>
            <p>We choose 100% organic sourcing because it protects the complex, natural structures of our ingredients. By maintaining nutrient density in its purest form—whether it is the vibrant vitality of our core greens or the natural energy of raw cacao—we ensure that every bite supports your body's natural harmony.</p>
          </div>
          <div className="editorial-image">
            {/* You can replace this image later with a beautiful shot of raw Moringa or soil */}
            <img src="/moringa nutri bar pic.webp" alt="Pure Organic Sourcing" />
          </div>
        </div>
      </section>

      {/* 3. The Transparency Manifesto (Full Width Banner) */}
      <section className="editorial-block" style={{backgroundColor: '#EAE6DF', padding: '8rem 5%', textAlign: 'center'}}>
        <div style={{maxWidth: '850px', margin: '0 auto'}}>
            <span className="section-label">Unyielding Transparency</span>
            <h2 style={{fontSize: '3rem', color: 'var(--emerald)', margin: '1.5rem 0 2.5rem 0', lineHeight: '1.1'}}>Trust is earned through transparency.</h2>
            <p style={{color: 'var(--text-light)', fontSize: '1.1rem', lineHeight: '1.8', margin: '0'}}>
              We don't just use the word "organic" lightly. Every ingredient in our formulations is rigorously vetted, traced back to its origin, and cultivated without synthetic interference. We partner exclusively with sustainable growers who share our exacting standards for soil health and ethical harvesting. This means you are consuming clean, traceable, and vibrant nutrition, exactly as nature intended.
            </p>
        </div>
      </section>

      {/* 4. Elevated Nutrition & The Corporate Ecosystem */}
      <section className="editorial-block ecosystem-block">
        <div className="ecosystem-header">
          <span className="section-label">The Promise</span>
          <h2>Elevated nutrition.</h2>
          <p>Health is not about restriction; it is about elevating what you consume. We view organic ingredients as the pinnacle of luxury because they represent food in its rarest, most pristine state. We strip away the unnecessary, leaving only clean, potent, and purposeful ingredients that work synergistically across our entire portfolio.</p>
        </div>
        
        <div className="ecosystem-grid">
          <div className="ecosystem-card">
            <div className="lab-diamond green-diamond"></div>
            <h3>Emerald Green Labs</h3>
            <p>The vanguard of health and wellness, dedicated to 100% organic nutritional foods, foundational pastes, and dietary supplements.</p>
          </div>
          <div className="ecosystem-card">
            <div className="lab-diamond blue-diamond"></div>
            <h3>Emerald Blue Labs</h3>
            <p>Engineering the future of premium, functional beverages and high-performance hydration.</p>
          </div>
          <div className="ecosystem-card">
            <div className="lab-diamond red-diamond"></div>
            <h3>Emerald Red Labs</h3>
            <p>Crafting exceptional, top-shelf liquors and spirits for the discerning modern palate.</p>
          </div>
        </div>
      </section>

      {/* 5. The Bridge to Commerce */}
      <section className="editorial-cta">
        <h2>Experience the standard.</h2>
        <Link to="/collection" className="btn btn-buy-now" style={{marginTop: '2rem', marginBottom: 0}}>Explore the Collection</Link>
      </section>

    </div>
  );
}