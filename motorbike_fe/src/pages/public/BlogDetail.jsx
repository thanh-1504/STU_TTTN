import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ChevronRight,
  CircleUser,
  Clock,
  ShoppingCart,
  Tag,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";
import { getToken, logout } from "../../api/authService";
import {
  getLatestPublicBlogPosts,
  getPublicBlogPostBySlug,
} from "../../api/blogService";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const { data: post, isLoading } = useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: () => getPublicBlogPostBySlug(slug),
    enabled: Boolean(slug),
  });

  const { data: latestPosts = [] } = useQuery({
    queryKey: ["latest-public-blog-posts"],
    queryFn: () => getLatestPublicBlogPosts(5),
  });

  const handleBooking = () => navigate(isLoggedIn ? "/booking" : "/login");
  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf9f7",
        color: "#1a1a1a",
      }}
    >
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e8e0d8",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <NavLink
            to="/"
            className="text-2xl font-black text-red-600 uppercase tracking-tight"
          >
            Shop2banh
          </NavLink>

          <nav style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {isLoggedIn && (
              <a href="#" style={{ color: "#555" }}>
                <ShoppingCart size={20} strokeWidth={1.5} />
              </a>
            )}

            {isLoggedIn ? (
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setIsUserMenuOpen((p) => !p)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#555",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <CircleUser size={22} strokeWidth={1.5} />
                </button>
                {isUserMenuOpen && (
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: "calc(100% + 8px)",
                      background: "#fff",
                      border: "1px solid #e8e0d8",
                      borderRadius: 8,
                      padding: "6px 0",
                      minWidth: 180,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {[
                      { to: "#", label: "Hồ sơ" },
                      { to: "/history", label: "Lịch sử" },
                      { to: "/portal", label: "Quản lý xe" },
                    ].map((item) => (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        style={{
                          display: "block",
                          padding: "8px 16px",
                          fontSize: 14,
                          color: "#444",
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#faf0ee")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "none")
                        }
                      >
                        {item.label}
                      </NavLink>
                    ))}
                    <div
                      style={{
                        borderTop: "1px solid #f0ebe7",
                        margin: "6px 0",
                      }}
                    />
                    <button
                      onClick={handleLogout}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "8px 16px",
                        fontSize: 14,
                        color: "#c0392b",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                style={{
                  textDecoration: "none",
                  fontSize: 14,
                  color: "#555",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                Đăng nhập
              </NavLink>
            )}

            <button
              onClick={handleBooking}
              style={{
                background: "#c0392b",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "8px 20px",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
                letterSpacing: "0.2px",
              }}
            >
              Đặt lịch ngay
            </button>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        {isLoading ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "#999",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>
              ◌
            </div>
            Đang tải bài viết...
          </div>
        ) : !post ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: "#999",
              fontFamily: "system-ui, sans-serif",
            }}
          >
            Không tìm thấy bài viết.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 320px",
              gap: 48,
              alignItems: "start",
            }}
          >
            {/* Article */}
            <article>
              {/* Breadcrumb */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 28,
                  fontFamily: "system-ui, sans-serif",
                  fontSize: 13,
                  color: "#999",
                }}
              >
                <NavLink
                  to="/"
                  style={{ color: "#999", textDecoration: "none" }}
                >
                  Trang chủ
                </NavLink>
                <ChevronRight size={12} />
                <NavLink
                  to="/blog"
                  style={{ color: "#999", textDecoration: "none" }}
                >
                  Blog
                </NavLink>
                <ChevronRight size={12} />
                <span style={{ color: "#555" }}>
                  {post.category?.categoryName || "Bài viết"}
                </span>
              </div>

              {/* Category badge */}
              <div style={{ marginBottom: 16 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    background: "#fef0ee",
                    color: "#c0392b",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  <Tag size={11} />
                  {post.category?.categoryName || "Blog"}
                </span>
              </div>

              {/* Title */}
              <h1
                style={{
                  fontSize: 36,
                  lineHeight: 1.25,
                  fontWeight: 700,
                  color: "#1a1a1a",
                  marginBottom: 20,
                  letterSpacing: "-0.5px",
                }}
              >
                {post.title}
              </h1>

              {/* Meta */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  marginBottom: 32,
                  paddingBottom: 24,
                  borderBottom: "1px solid #ede8e3",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#888",
                  }}
                >
                  <Calendar size={14} />
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
                {post.readingTime && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: "#888",
                    }}
                  >
                    <Clock size={14} />
                    {post.readingTime} phút đọc
                  </span>
                )}
              </div>

              {/* Thumbnail */}
              {post.thumbnailUrl && (
                <figure style={{ margin: "0 0 36px" }}>
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    style={{
                      width: "100%",
                      height: 420,
                      objectFit: "cover",
                      borderRadius: 12,
                      display: "block",
                      border: "1px solid #ede8e3",
                    }}
                  />
                </figure>
              )}

              {/* Content */}
              <div
                style={{
                  fontSize: 17,
                  lineHeight: 1.85,
                  color: "#333",
                  fontFamily: "'Georgia', serif",
                }}
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags / Footer */}
              <div
                style={{
                  marginTop: 48,
                  paddingTop: 24,
                  borderTop: "1px solid #ede8e3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                <NavLink
                  to="/blog"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "#c0392b",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  ← Về danh sách bài viết
                </NavLink>
                <button
                  onClick={handleBooking}
                  style={{
                    background: "#c0392b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 24px",
                    fontSize: 14,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Đặt lịch bảo dưỡng ngay
                </button>
              </div>
            </article>

            {/* Sidebar */}
            <aside style={{ position: "sticky", top: 84 }}>
              {/* CTA Card */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #c0392b 0%, #922b21 100%)",
                  borderRadius: 12,
                  padding: 24,
                  marginBottom: 24,
                  color: "#fff",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.85,
                    marginBottom: 8,
                    fontFamily: "system-ui, sans-serif",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Chăm sóc xe của bạn
                </div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}
                >
                  Đặt lịch dịch vụ ngay hôm nay
                </div>
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                    marginBottom: 20,
                    fontFamily: "system-ui, sans-serif",
                    lineHeight: 1.6,
                  }}
                >
                  Đội ngũ kỹ thuật viên chuyên nghiệp luôn sẵn sàng phục vụ.
                </div>
                <button
                  onClick={handleBooking}
                  style={{
                    width: "100%",
                    background: "#fff",
                    color: "#c0392b",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 0",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  Đặt lịch ngay →
                </button>
              </div>

              {/* Latest Posts */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #ede8e3",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #ede8e3",
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.8px",
                      textTransform: "uppercase",
                      color: "#888",
                    }}
                  >
                    Bài viết mới nhất
                  </h4>
                </div>

                <div style={{ padding: "8px 0" }}>
                  {latestPosts.map((item, idx) => (
                    <Link
                      key={item.id}
                      to={`/blog/${item.slug}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        padding: "12px 20px",
                        textDecoration: "none",
                        borderBottom:
                          idx < latestPosts.length - 1
                            ? "1px solid #f5f0eb"
                            : "none",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#faf8f5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "none")
                      }
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          style={{
                            width: 52,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 52,
                            height: 40,
                            background: "#f0ebe5",
                            borderRadius: 6,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#2c2c2c",
                            lineHeight: 1.4,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            fontFamily: "system-ui, sans-serif",
                          }}
                        >
                          {item.title}
                        </p>
                        {item.publishedAt && (
                          <p
                            style={{
                              margin: "4px 0 0",
                              fontSize: 12,
                              color: "#aaa",
                              fontFamily: "system-ui, sans-serif",
                            }}
                          >
                            {formatDate(item.publishedAt)}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      {/* Footer */}

      <style>{`
        .blog-content h1, .blog-content h2, .blog-content h3 {
          color: #1a1a1a;
          margin-top: 2em;
          margin-bottom: 0.75em;
          font-family: 'Georgia', serif;
          letter-spacing: -0.3px;
        }
        .blog-content h2 { font-size: 24px; }
        .blog-content h3 { font-size: 20px; }
        .blog-content p { margin: 0 0 1.4em; }
        .blog-content a { color: #c0392b; }
        .blog-content img { max-width: 100%; border-radius: 8px; margin: 1.5em 0; }
        .blog-content ul, .blog-content ol { padding-left: 1.5em; margin: 0 0 1.4em; }
        .blog-content li { margin-bottom: 0.5em; }
        .blog-content blockquote {
          border-left: 3px solid #c0392b;
          margin: 2em 0;
          padding: 1em 1.5em;
          background: #fef9f8;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #666;
        }
        .blog-content code {
          background: #f5f0eb;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
        }
        @media (max-width: 768px) {
          article h1 { font-size: 26px !important; }
        }
      `}</style>
    </div>
  );
}
