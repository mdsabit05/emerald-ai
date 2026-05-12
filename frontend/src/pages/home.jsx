import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSlides } from '../lib/api';

const defaultSlides = [
  { id: 1, label: "The Signature 25g Bar", imageUrl: "", productId: null },
  { id: 2, label: "The Emerald's", imageUrl: "", productId: null },
];

export default function Home() {
  const [slides, setSlides] = useState(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [progress, setProgress] = useState(0);
  const totalSlides = slides.length;

  useEffect(() => {
    getSlides().then(setSlides).catch(() => {});
  }, []);

  useEffect(() => {
    const slideDuration = 5000;
    const intervalTime = 50;
    const step = 100 / (slideDuration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
          return 0; 
        }
        return prevProgress + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
     
      <section id="home" className="hero">
        <div className="hero-content">
          <h1>Pure organic,<br /><i>elevated.</i></h1>
          <p>We believe true luxury lies in the details. Uncompromising quality and meticulously sourced ingredients, crafted for the modern lifestyle.</p>
          {/* This uses React Router's Link to go to the product page */}
          <Link to="/collection" className="btn">Explore the Range</Link>
        </div>

        <div className="hero-slider-container">
          <div className="slider-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {slides.map((slide, i) => (
              <div key={slide.id} className={`slide ${currentSlide === i ? 'active' : ''}`}>
                {slide.displayImage
                  ? <img src={slide.displayImage} alt={slide.label} />
                  : <div className="slide-placeholder" />
                }
                <div className="slide-overlay"><span className="slide-text">{slide.label}</span></div>
              </div>
            ))}
          </div>

          <div className="slider-progress-bg">
            <div className="slider-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          {slides[currentSlide]?.productId && (
            <Link
              to={`/product/${slides[currentSlide].productId}`}
              className="btn hero-order-btn"
            >
              Order Now
            </Link>
          )}
        </div>
      </section>

      <section id="philosophy" className="philosophy">
        <div className="monogram-container">
          <img src="/Main_logo.webp" alt="Emerald Monogram" />
        </div>
        <div className="philosophy-text">
          <span className="section-label">Our Process</span>
          <h2>The art of absolute purity.</h2>
          <p>From our hands-on, founder-led production process to the careful sourcing of raw, organic materials, we oversee every step of the journey.</p>
          <p>We craft our own foundational ingredients—like our signature artisanal pastes—in-house to ensure absolute quality. No shortcuts, just excellence delivered straight from our labs to your hands.</p>
        </div>
      </section>

      <section id="botanicals" className="botanicals-section">
        <div className="ingredient-row">
          <div className="ingredient-text">
            <span className="section-label">The Foundation</span>
            <h3>Ingredients we embrace.</h3>
            <p>Sourced from the earth, minimally processed, and chosen for maximum nutritional potency.</p>
          </div>
          <div className="ingredient-grid">
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Brown_rice.png?v=1697521338" alt="Brown Rice" /></div><span>Brown Rice</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Chia_seeds.png?v=1697521337" alt="Chia" /></div><span>Chia Seeds</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Quinoa.png?v=1697521337" alt="Quinoa" /></div><span>Quinoa</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLRPhERv01coLiIaWmfQKmXdO9BD7vVhYk45ZJRqxpNgwTMq7k-p1PyCdpWj2rBHdV7V5SSMosaQSR06ysXIq2knSyh45j6vm1MFWcXZXFZA&s=10" alt="Sesame" /></div><span>Sesame</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="/moringa.webp" alt="Moringa" /></div><span>Moringa</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdEh5sgKud5nmoBI6Q9GOID85AQH8iJJCDylfjjLrbY-eJq6f-94w0DpXYZIZ1TMYQYJs297tNz6tvfIblPU0R3f-FjJ7rtHPiSQHlwvIekQ&s=10" alt="Watermelon Seed" /></div><span>Watermelon Seed</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Sunflower_seed.png?v=1697521338" alt="Sunflower seed" /></div><span>Sunflower seed</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Pumpkin_seeds.png?v=1697521338" alt="Pumpkin seed" /></div><span>Pumpkin seed</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle"><img src="https://encrypted-tbn3.gstatic.com/shopping?q=tbn:ANd9GcT8pisAjbJyEaMoMDL9Sy9NkEXq2Ms_-64T76qTgqz-yLVscS6R3Qt7_59Cd-ROxyRSqVgg1lSBWfOVCHo6XpTkKtYkeJ8S5jFkan8at98KJaTXMfRWybr83gocKEdhhF2yWK_G7uvqlmM&usqp=CAc" alt="organic flax seed" /></div><span>organic flax seed</span>
            </div>
          </div>
        </div>

        <div className="editorial-divider-small"></div>

        <div className="ingredient-row">
          <div className="ingredient-text">
            <span className="section-label">The Standard</span>
            <h3>Ingredients we refuse.</h3>
            <p>We strictly prohibit industrial synthetics, refined sugars, and artificial preservatives in our labs.</p>
          </div>
          <div className="ingredient-grid">
            <div className="ingredient-item">
              <div className="ingredient-circle refused"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Refined_sugar.png?v=1697408252" alt="Refined Sugar" /></div><span>Refined Sugar</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle refused"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Edible_Vegetable_Oil.png?v=1697408252" alt="Veg Oils" /></div><span>Veg Oils</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle refused"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Humectant_Glycerine.png?v=1697408252" alt="Glycerine" /></div><span>Glycerine</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle refused"><img src="https://cdn.shopify.com/s/files/1/0814/6616/3478/files/Maltitol.png?v=1697408253" alt="Maltitol" /></div><span>Maltitol</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle refused"><img src="/hydrogenated oil.webp" alt="Hydrogenated Oils" /></div><span>Hydrogenated oils</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle refused"><img src="/artificial preservatives.webp" alt="Artificial Preservatives" /></div><span>Artificial preservatives</span>
            </div>
            <div className="ingredient-item">
              <div className="ingredient-circle refused"><img src="/artificial colours.webp" alt="Artificial Colours" /></div><span>Artificial colours</span>
            </div>
          </div>
        </div>
      </section>

      {/* The simplified bridge to your new Product Page */}
      <section id="shop" className="featured-product">
        <div className="product-grid">
          <div className="product-visual">
            <img src="/moringa nutri bar pic.webp" alt="Moringa Nutri Bar" className="main-product-img" />
          </div>
          <div className="product-details">
            <span className="section-label">Signature Release</span>
            <h3>The 25g Luxury Nutritional Bar</h3>
            <p>A masterclass in taste and vitality. Packed with premium organic ingredients like the finest moringa, cacao nibs, and hemp hearts, precision-crafted into a perfect serving for optimal nourishment and indulgence.</p>
            {/* The magic Link to your dedicated page */}
            <Link to="/product" className="btn">View Full Details & Pre-Order</Link>
          </div>
        </div>
      </section>
    </>
  );
}