import React from "react";
import { useNavigate } from "react-router-dom";
import { BLOG_POSTS } from "../data/blogPosts";

export default function Blog() {
  const navigate = useNavigate();

  return (
    <section className="blog-section">
      <div id="blog" className="section-header">
        <span className="mono">Bloom journal</span>
        <h2>
          Learn without<br />
          feeling overwhelmed.
        </h2>
        <p>
          Accessible, clinician-reviewed educational content about breast health and awareness.
        </p>
      </div>

      <div className="blog-grid">
        {BLOG_POSTS.map((post) => (
          <article
            className="blog-card"
            key={post.id}
            onClick={() => navigate(`/blog/${post.id}`)}
          >
            <div className="blog-image">{post.icon}</div>
            <div className="blog-content">
              <span className="mono">{post.tag}</span>
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <span className="read-more">Read article →</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
