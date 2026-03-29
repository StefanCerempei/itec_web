import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Blog.css';

const Blog = () => {
  const [posts] = useState([
    {
      id: 1,
      title: 'The Future of Collaborative Coding',
      excerpt: 'How real-time collaboration and AI are reshaping the way we write software together.',
      date: 'March 28, 2026',
      author: 'Jurjita Alexandru',
      category: 'Innovation',
      image: '/blog-collab.jpg' // poți înlocui cu imagini reale
    },
    {
      id: 2,
      title: 'AI as Your Pair Programmer',
      excerpt: 'Discover how iTECify leverages AI to generate code blocks that you can accept or reject with one click.',
      date: 'March 25, 2026',
      author: 'Cerempei Stefan',
      category: 'AI',
      image: '/blog-ai.jpg'
    },
    {
      id: 3,
      title: 'Building Secure Sandboxes with Docker',
      excerpt: 'Learn about our security-first approach: live vulnerability scanning and isolated containers.',
      date: 'March 22, 2026',
      author: 'Voicu Bogdan',
      category: 'Security',
      image: '/blog-security.jpg'
    },
    {
      id: 4,
      title: 'Time-Travel Debugging: A Game Changer',
      excerpt: 'Rewind your coding session and see exactly how your code evolved.',
      date: 'March 20, 2026',
      author: 'Cristea Serban',
      category: 'Features',
      image: '/blog-timetravel.jpg'
    },
    {
      id: 5,
      title: 'Multi-Language Support: Run Anything',
      excerpt: 'From Python to Rust, iTECify builds containers on-the-fly for any language.',
      date: 'March 18, 2026',
      author: 'Jurjita Alexandru',
      category: 'Technical',
      image: '/blog-languages.jpg'
    },
    {
      id: 6,
      title: 'The iTECify Team at iTEC 2026',
      excerpt: 'Meet the students behind the platform and our journey so far.',
      date: 'March 15, 2026',
      author: 'Team iTECify',
      category: 'Community',
      image: '/blog-team.jpg'
    }
  ]);

  return (
    <div className="blog-page">
      {/* Hero Section */}
      <section className="blog-hero">
        <div className="container">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>Blog</h1>
          <p className="hero-subtitle">
            Insights, updates, and stories from the iTECify team.
          </p>
        </div>
      </section>

      <div className="blog-content">
        <div className="container">
          <div className="blog-grid">
            {posts.map(post => (
              <article key={post.id} className="blog-card">
                <div className="blog-card-image">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/400x250?text=Blog+Image';
                    }}
                  />
                </div>
                <div className="blog-card-content">
                  <div className="blog-meta">
                    <span className="blog-category">{post.category}</span>
                    <span className="blog-date">{post.date}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <div className="blog-footer">
                    <span className="blog-author">By {post.author}</span>
                    <Link to={`/blog/${post.id}`} className="read-more">Read More →</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog;