import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'
import './Pricing.css'

const Pricing = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        setIsVisible(true)
        window.scrollTo(0, 0)
    }, [])

    const plans = [
        {
            name: 'Free',
            price: '0',
            period: 'lună',
            description: 'Perfect pentru începători',
            features: [
                'Colaborare în timp real',
                'Până la 3 proiecte',
                'Suport prin email',
                'Comunitate Discord',
                'Editor de cod online'
            ],
            cta: 'Începe gratuit',
            popular: false
        },
        {
            name: 'Pro',
            price: '29',
            period: 'lună',
            description: 'Pentru dezvoltatori profesioniști',
            features: [
                'Toate din Free',
                'Proiecte nelimitate',
                'Suport prioritar 24/7',
                'API Access',
                'Analytics avansate',
                'Export în mai multe formate'
            ],
            cta: 'Alege Pro',
            popular: true
        },
        {
            name: 'Enterprise',
            price: '99',
            period: 'lună',
            description: 'Pentru echipe și companii',
            features: [
                'Toate din Pro',
                'Suport dedicat',
                'Training personalizat',
                'Soluții custom',
                'SLA garantat',
                'Factură lunară'
            ],
            cta: 'Contactează-ne',
            popular: false
        }
    ]

    return (
        <div className="pricing-modern">
            <Navbar />
            
            <main className="pricing-main">
                <div className="container">
                    {/* Hero Section */}
                    <div className={`pricing-hero ${isVisible ? 'fade-in' : ''}`}>
                        <div className="section-badge">
                            🚀 Prețuri Transparente
                        </div>
                        <h1 className="pricing-title">
                            Alege planul <span className="gradient-text-modern">potrivit</span> pentru tine
                        </h1>
                        <p className="pricing-subtitle">
                            Investește în viitorul tău în IT. Toate planurile includ acces la comunitatea noastră și suport dedicat.
                        </p>
                    </div>

                    {/* Pricing Cards */}
                    <div className="pricing-grid-modern">
                        {plans.map((plan, index) => (
                            <div 
                                key={plan.name}
                                className={`pricing-card-modern ${plan.popular ? 'popular' : ''}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                {plan.popular && (
                                    <div className="popular-badge-modern">
                                        <span>🔥 Cel mai popular</span>
                                    </div>
                                )}
                                
                                <div className="card-header-modern">
                                    <h3 className="plan-name-modern">{plan.name}</h3>
                                    <p className="plan-description-modern">{plan.description}</p>
                                </div>
                                
                                <div className="plan-price-modern">
                                    <span className="currency">$</span>
                                    <span className="price">{plan.price}</span>
                                    <span className="period">/{plan.period}</span>
                                </div>
                                
                                <ul className="plan-features-modern">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx}>
                                            <svg className="check-icon-modern" viewBox="0 0 24 24" fill="none">
                                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                
                                <button 
                                    className={`plan-button-modern ${plan.popular ? 'primary' : 'secondary'}`}
                                >
                                    {plan.cta}
                                    <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* FAQ Section */}
                    <div className="pricing-faq-modern">
                        <div className="section-header-modern">
                            <div className="section-badge">❓ Întrebări frecvente</div>
                            <h2>Ai întrebări?</h2>
                            <p>Găsești mai jos răspunsurile la cele mai comune întrebări</p>
                        </div>
                        
                        <div className="faq-grid-modern">
                            <div className="faq-item-modern">
                                <h3>Pot să schimb planul oricând?</h3>
                                <p>Da, poți face upgrade sau downgrade în orice moment din setările contului tău. Modificările se aplică imediat.</p>
                            </div>
                            <div className="faq-item-modern">
                                <h3>Există perioadă de probă?</h3>
                                <p>Oferim 14 zile de probă gratuită pentru planul Pro, fără niciun angajament și fără a fi nevoie de card.</p>
                            </div>
                            <div className="faq-item-modern">
                                <h3>Ce metode de plată acceptați?</h3>
                                <p>Acceptăm carduri de credit/debit (Visa, Mastercard, American Express) și transfer bancar pentru Enterprise.</p>
                            </div>
                            <div className="faq-item-modern">
                                <h3>Pot obține o factură?</h3>
                                <p>Da, toate plățile sunt însoțite de factură fiscală în format electronic, trimisă automat pe email.</p>
                            </div>
                        </div>
                    </div>

                    {/* CTA Section */}
                    <div className="cta-modern pricing-cta">
                        <div className="cta-glow"></div>
                        <div className="cta-content-modern">
                            <h2>Încă nu ești sigur?</h2>
                            <p>Îți oferim o sesiune gratuită de consultanță pentru a-ți recomanda cel mai potrivit plan.</p>
                            <div className="cta-buttons">
                                <Link to="/contact">
                                    <button className="btn-outline-modern btn-large">
                                        Contactează-ne
                                        <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </Link>
                            </div>
                            <p className="cta-note">* Nu suntem obligați la plată. Consultanța este complet gratuită.</p>
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    )
}

export default Pricing