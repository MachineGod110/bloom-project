import React, { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BLOG_POSTS } from "../data/blogPosts";

export default function BlogDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const post = BLOG_POSTS.find((p) => p.id === id || p.slug === id) || BLOG_POSTS[0];
  const relatedPosts = BLOG_POSTS.filter((p) => p.id !== post.id);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [id]);

  return (
    <article className="blog-article-page">
      <div className="blog-article-container">
        {/* Navigation Breadcrumb */}
        <div className="blog-nav-bar">
          <button
            type="button"
            className="blog-back-btn"
            onClick={() => navigate("/", { state: { scrollTo: "blog" } })}
          >
            ← Back to Bloom Journal
          </button>
          <span className="mono" style={{ color: "var(--muted)" }}>
            Editorial / {post.tag}
          </span>
        </div>

        {/* Article Header */}
        <header className="blog-article-header">
          <div className="blog-meta-top">
            <span className="mono blog-badge">{post.tag}</span>
            <span className="blog-date">{post.date}</span>
            <span className="blog-bullet">•</span>
            <span className="blog-read-time">{post.readTime}</span>
          </div>

          <h1 className="serif blog-article-title">{post.title}</h1>

          <div className="blog-author-row">
            <div className="author-avatar">{post.icon}</div>
            <div className="author-details">
              <strong>{post.author}</strong>
              <span>{post.authorRole}</span>
            </div>
          </div>
        </header>

        {/* Lead Paragraph */}
        <p className="blog-article-lead">{post.lead}</p>

        {/* Article Sections */}
        <div className="blog-article-body">
          {post.sections.map((sec, idx) => (
            <section key={idx} className="blog-body-section">
              <h2 className="serif">{sec.heading}</h2>
              {sec.content.split("\n\n").map((para, pIdx) => (
                <p key={pIdx}>{para}</p>
              ))}
            </section>
          ))}

          {/* Key Takeaway Box */}
          <div className="blog-takeaway-card">
            <div className="takeaway-header">
              <span className="takeaway-icon">💡</span>
              <h3 className="serif">Key Clinical Takeaway</h3>
            </div>
            <p>{post.keyTakeaway}</p>
          </div>

          {/* Medical Notice */}
          <div className="blog-disclaimer-box">
            <strong>Medical Disclaimer:</strong> This article is published for educational and awareness purposes only and does not constitute formal medical diagnosis or treatment advice. Always seek the advice of your physician or qualified health provider with any questions you may have regarding a medical symptom or condition.
          </div>
        </div>

        {/* Bottom Back Button */}
        <div className="blog-footer-nav">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/", { state: { scrollTo: "blog" } })}
          >
            ← Return to Bloom Journal
          </button>
        </div>

        {/* Related Articles */}
        <div className="related-articles-section">
          <span className="mono" style={{ color: "var(--plum)" }}>
            Continue Reading
          </span>
          <h2 className="serif" style={{ fontSize: "2rem", marginTop: 6, marginBottom: 20 }}>
            Related Guides
          </h2>

          <div className="blog-grid">
            {relatedPosts.map((related) => (
              <div
                key={related.id}
                className="blog-card"
                onClick={() => navigate(`/blog/${related.id}`)}
              >
                <div className="blog-image">{related.icon}</div>
                <div className="blog-content">
                  <span className="mono">{related.tag}</span>
                  <h3>{related.title}</h3>
                  <p>{related.excerpt}</p>
                  <span className="read-more">Read article →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
