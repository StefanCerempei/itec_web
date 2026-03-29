import React, { useState, useEffect } from 'react';
import './Blog.css';

// Importăm imaginile locale (corectat cu ../assets/)
import voicuImg from '../assets/voicu.jpg';
import serbanImg from '../assets/serban.jpg';
import stefanImg from '../assets/stefan.jpg';
import jurjitaImg from '../assets/jurjita.jpg';

// Icoanele rămân la fel
const SearchIcon = () => (
  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="10" cy="10" r="7" />
    <line x1="21" y1="21" x2="15" y2="15" />
  </svg>
);

const MoonIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SunIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const ArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Postări blog cu autori și avataruri locale
const blogPosts = [
  {
    id: 1,
    title: "The Future of Web Design: AI-Powered Interfaces",
    excerpt: "Exploring how machine learning is reshaping UI/UX and creating hyper-personalized experiences.",
    category: "Design",
    date: "May 15, 2025",
    readTime: "8 min read",
    author: "Voicu Bogdan",
    authorAvatar: voicuImg,
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=600&auto=format"
  },
  {
    id: 2,
    title: "React 19: What's New and Why You Should Upgrade",
    excerpt: "Dive deep into the latest features, compiler improvements, and how it boosts performance.",
    category: "Development",
    date: "May 10, 2025",
    readTime: "6 min read",
    author: "Cristea Serban",
    authorAvatar: serbanImg,
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format"
  },
  {
    id: 3,
    title: "Neubrutalism in Modern Blogs: A Bold Comeback",
    excerpt: "How raw, expressive design is dominating the indie web scene and capturing attention.",
    category: "Design",
    date: "May 5, 2025",
    readTime: "5 min read",
    author: "Cerempei Stefan",
    authorAvatar: stefanImg,
    image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&auto=format"
  },
  {
    id: 4,
    title: "Optimizing Core Web Vitals for Better SEO",
    excerpt: "Actionable tips to boost LCP, FID, and CLS scores for your blog or portfolio.",
    category: "SEO",
    date: "April 28, 2025",
    readTime: "7 min read",
    author: "Jurjita Alexandru",
    authorAvatar: jurjitaImg,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format"
  },
  {
    id: 5,
    title: "Animating with Framer Motion: Beyond Basics",
    excerpt: "Create buttery smooth page transitions and micro-interactions that delight users.",
    category: "Development",
    date: "April 20, 2025",
    readTime: "9 min read",
    author: "Voicu Bogdan",
    authorAvatar: voicuImg,
    image: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=600&auto=format"
  },
  {
    id: 6,
    title: "The Psychology of Color in Branding",
    excerpt: "How strategic color choices influence perception and conversion rates.",
    category: "Marketing",
    date: "April 12, 2025",
    readTime: "6 min read",
    author: "Cristea Serban",
    authorAvatar: serbanImg,
    image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format"
  }
];

// Date echipă cu avataruri locale și bio-uri optimizate
const teamMembers = [
  {
    name: "Voicu Bogdan",
    role: "DevOps & AI Specialist",
    bio: "Automates infrastructure, builds CI/CD pipelines, and experiments with AI models to bring intelligence into web apps. Passionate about MLOps and cloud-native solutions.",
    avatar: voicuImg
  },
  {
    name: "Cristea Serban",
    role: "Full‑Stack Performance Engineer",
    bio: "Optimizes everything from database queries to bundle sizes. Believes a fast website is a happy website. Loves React, Node.js, and WebAssembly.",
    avatar: serbanImg
  },
  {
    name: "Cerempei Stefan",
    role: "Creative Technologist & Design Systems",
    bio: "Bridges the gap between art and code. Experiments with generative design, modern CSS, and micro-interactions that make interfaces memorable.",
    avatar: stefanImg
  },
  {
    name: "Jurjita Alexandru",
    role: "Backend Wizard & AI Enthusiast",
    bio: "Builds robust APIs and integrates machine learning models. Always looking for ways to bring intelligence to the frontend and create scalable systems.",
    avatar: jurjitaImg
  }
];

const Blog = () => {
  const [theme, setTheme] = useState('dark');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [subEmail, setSubEmail] = useState(''); // pentru newsletter simplu

  // Theme handling
  useEffect(() => {
    const savedTheme = localStorage.getItem('blog-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('blog-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Scroll to top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Newsletter simplu (fără modal)
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (subEmail) {
      alert(`Mulțumim pentru abonare, ${subEmail}! Vei primi cele mai noi articole.`);
      setSubEmail('');
    }
  };

  // Categories
  const categories = ['All', ...new Set(blogPosts.map(post => post.category))];

  // Filter posts
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = filteredPosts.length > 0 ? filteredPosts[0] : null;
  const restPosts = filteredPosts.slice(1);

  return (
    <div className="blog-page">
      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      {/* Hero Section */}
      <section className="blog-hero">
        <div className="container">
          <div className="blog-logo">
            <span className="logo-icon">✨</span>
            <span style={{ fontWeight: 700, fontSize: '1.2rem' }}>INNOBLOG</span>
          </div>
          <button className="back-button" onClick={() => window.history.back()}>
            ← Back to Home
          </button>
          <h1>Insight & Inspiration</h1>
          <p className="hero-subtitle">
            Stories, tutorials, and deep dives into modern web development, design, and digital creativity — brought to you by four students at UPT AC CTI, passionate about innovation.
          </p>
        </div>
      </section>

      <div className="container">
        {/* Filter & Search */}
        <div className="blog-controls">
          <div className="category-filters">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="search-wrapper">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search articles..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Blog Grid */}
        <div className="blog-grid">
          {featuredPost && (
            <article className="blog-card featured">
              <div className="blog-card-image">
                <img src={featuredPost.image} alt={featuredPost.title} loading="lazy" />
              </div>
              <div className="blog-card-content">
                <div className="blog-meta">
                  <span className="blog-category">{featuredPost.category}</span>
                  <span className="blog-date">📅 {featuredPost.date}</span>
                </div>
                <h2>{featuredPost.title}</h2>
                <p>{featuredPost.excerpt}</p>
                <div className="blog-footer">
                  <div className="author-info">
                    <img src={featuredPost.authorAvatar} alt={featuredPost.author} className="author-avatar" />
                    <span className="blog-author">{featuredPost.author} • {featuredPost.readTime}</span>
                  </div>
                  <a href="#" className="read-more">
                    Read More <ArrowRight />
                  </a>
                </div>
              </div>
            </article>
          )}

          {restPosts.map(post => (
            <article key={post.id} className="blog-card">
              <div className="blog-card-image">
                <img src={post.image} alt={post.title} loading="lazy" />
              </div>
              <div className="blog-card-content">
                <div className="blog-meta">
                  <span className="blog-category">{post.category}</span>
                  <span className="blog-date">📅 {post.date}</span>
                </div>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <div className="blog-footer">
                  <div className="author-info">
                    <img src={post.authorAvatar} alt={post.author} className="author-avatar" />
                    <span className="blog-author">{post.author} • {post.readTime}</span>
                  </div>
                  <a href="#" className="read-more">
                    Read More <ArrowRight />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Team Section */}
        <div className="team-section">
          <h2>Meet the Innovators</h2>
          <p>We're four students from the Faculty of Automation and Computers, CTI specialization, at the Polytechnic University of Timișoara. We build with curiosity, break things, and fix them better. Here's the crew:</p>
          <div className="team-grid">
            {teamMembers.map(member => (
              <div key={member.name} className="team-card">
                <img src={member.avatar} alt={member.name} className="team-avatar" />
                <h3>{member.name}</h3>
                <div className="team-role">{member.role}</div>
                <p className="team-bio">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Section (simplu, fără modal) */}
        <div className="newsletter-section">
          <h3>Never Miss a Byte</h3>
          <p>Join 5,000+ readers getting weekly insights on web innovation.</p>
          <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="your@email.com"
              value={subEmail}
              onChange={(e) => setSubEmail(e.target.value)}
              required
            />
            <button type="submit">Subscribe →</button>
          </form>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <button className={`scroll-top ${showScrollTop ? 'visible' : ''}`} onClick={scrollToTop}>
        ↑
      </button>
    </div>
  );
};

export default Blog;