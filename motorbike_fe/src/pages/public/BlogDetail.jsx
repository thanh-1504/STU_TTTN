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
    <div className="min-h-screen bg-[#faf9f7] text-[#1a1a1a] font-['Work_Sans',_sans-serif]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#e8e0d8] bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <NavLink
            to="/"
            className="text-2xl font-black tracking-tight text-red-600 uppercase"
          >
            Shop2banh
          </NavLink>

          <nav className="flex items-center gap-6">
            {isLoggedIn && (
              <a
                href="#"
                className="text-gray-600 transition hover:text-red-600"
              >
                <ShoppingCart size={22} strokeWidth={1.5} />
              </a>
            )}

            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((p) => !p)}
                  className="flex items-center text-gray-600 transition hover:text-red-600 focus:outline-none"
                >
                  <CircleUser size={24} strokeWidth={1.5} />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 rounded-lg border border-gray-100 bg-white py-2 shadow-xl">
                    {[
                      { to: "#", label: "Hồ sơ" },
                      { to: "/history", label: "Lịch sử" },
                      { to: "/portal", label: "Quản lý xe" },
                    ].map((item) => (
                      <NavLink
                        key={item.label}
                        to={item.to}
                        className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-red-50 hover:text-red-600"
                      >
                        {item.label}
                      </NavLink>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/login"
                className="text-sm font-medium text-gray-600 transition hover:text-red-600"
              >
                Đăng nhập
              </NavLink>
            )}

            <button
              onClick={handleBooking}
              className="rounded-md bg-[#c0392b] px-5 py-2 text-sm font-medium tracking-wide text-white transition hover:bg-red-700 shadow-sm"
            >
              Đặt lịch ngay
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="mb-4 animate-spin text-4xl">◌</div>
            <p>Đang tải bài viết...</p>
          </div>
        ) : !post ? (
          <div className="py-20 text-center text-gray-500">
            Không tìm thấy bài viết.
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
            {/* Article Section */}
            <article className="lg:col-span-8 xl:col-span-8 min-w-0 overflow-hidden">
              {/* Breadcrumb */}
              <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <NavLink to="/" className="hover:text-red-600 transition">
                  Trang chủ
                </NavLink>
                <ChevronRight size={14} />
                <NavLink to="/blog" className="hover:text-red-600 transition">
                  Blog
                </NavLink>
                <ChevronRight size={14} />
                <span className="text-gray-800 font-medium line-clamp-1">
                  {post.category?.categoryName || "Bài viết"}
                </span>
              </div>

              {/* Category badge */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#c0392b]">
                  <Tag size={12} />
                  {post.category?.categoryName || "Blog"}
                </span>
              </div>

              {/* Title */}
              <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
                {post.title}
              </h1>

              {/* Meta */}
              <div className="mb-8 flex flex-wrap items-center gap-6 border-b border-gray-200 pb-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <Calendar size={16} />
                  {formatDate(post.publishedAt || post.createdAt)}
                </span>
                {post.readingTime && (
                  <span className="flex items-center gap-2">
                    <Clock size={16} />
                    {post.readingTime} phút đọc
                  </span>
                )}
              </div>

              {/* Thumbnail */}
              {post.thumbnailUrl && (
                <figure className="mb-10">
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    className="h-auto w-full max-h-[500px] rounded-xl border border-gray-200 object-cover shadow-sm"
                  />
                </figure>
              )}

              {/* Content */}
              <div
                className="blog-content font-serif text-lg leading-relaxed text-gray-800"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags / Footer CTA */}
              <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
                <NavLink
                  to="/blog"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#c0392b] transition hover:text-red-800"
                >
                  ← Về danh sách bài viết
                </NavLink>
                <button
                  onClick={handleBooking}
                  className="w-full rounded-md bg-[#c0392b] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 sm:w-auto"
                >
                  Đặt lịch bảo dưỡng ngay
                </button>
              </div>
            </article>

            {/* Sidebar Section */}
            <aside className="space-y-8 lg:col-span-4 lg:sticky lg:top-24 xl:col-span-4">
              {/* CTA Card */}
              <div className="rounded-xl bg-gradient-to-br from-[#c0392b] to-[#922b21] p-6 text-white shadow-md">
                <div className="mb-2 text-xs font-bold uppercase tracking-wider opacity-90">
                  Chăm sóc xe của bạn
                </div>
                <h3 className="mb-3 text-2xl font-bold leading-tight">
                  Đặt lịch dịch vụ ngay hôm nay
                </h3>
                <p className="mb-6 text-sm leading-relaxed opacity-90">
                  Đội ngũ kỹ thuật viên chuyên nghiệp luôn sẵn sàng phục vụ và
                  mang lại trải nghiệm tốt nhất cho xế yêu của bạn.
                </p>
                <button
                  onClick={handleBooking}
                  className="w-full rounded-lg bg-white py-3 text-sm font-bold text-[#c0392b] transition hover:bg-gray-50 shadow-sm"
                >
                  Đặt lịch ngay →
                </button>
              </div>

              {/* Latest Posts */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
                  <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700">
                    Bài viết mới nhất
                  </h4>
                </div>

                <div className="divide-y divide-gray-100">
                  {latestPosts.map((item) => (
                    <Link
                      key={item.id}
                      to={`/blog/${item.slug}`}
                      className="group flex items-start gap-4 p-5 transition hover:bg-gray-50"
                    >
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="h-16 w-20 flex-shrink-0 rounded-md object-cover shadow-sm"
                        />
                      ) : (
                        <div className="h-16 w-20 flex-shrink-0 rounded-md bg-gray-100" />
                      )}
                      <div className="flex-1">
                        <h5 className="mb-1 text-sm font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-[#c0392b] transition-colors">
                          {item.title}
                        </h5>
                        {item.publishedAt && (
                          <p className="text-xs text-gray-500">
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

      {/* Global Style for Blog Content parsed from HTML */}
      <style>{`
  /* CÁC RULE CHỐNG TRÀN LAYOUT (QUAN TRỌNG) */
  .blog-content {
    word-wrap: break-word;
    overflow-wrap: break-word;
    word-break: break-word;
  }
  .blog-content * {
    max-width: 100% !important;
  }
  /* Xử lý riêng cho thẻ table hoặc pre/code nếu có để cuộn ngang bên trong */
  .blog-content table, .blog-content pre {
    display: block;
    overflow-x: auto;
    max-width: 100%;
  }

  /* CÁC STYLE TYPOGRAPHY SẴN CÓ CỦA BẠN */
  .blog-content h1, .blog-content h2, .blog-content h3, .blog-content h4 {
    color: #111827;
    margin-top: 1.5em;
    margin-bottom: 0.75em;
    font-family: 'Work Sans', sans-serif;
    font-weight: 700;
  }
  .blog-content h2 { font-size: 1.5rem; line-height: 1.3; }
  .blog-content h3 { font-size: 1.25rem; line-height: 1.3; }
  .blog-content p { margin-bottom: 1.25em; color: #374151; }
  .blog-content a { color: #c0392b; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 2px; }
  .blog-content img { width: 100%; height: auto; border-radius: 0.5rem; margin: 2em 0; border: 1px solid #e5e7eb; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
  .blog-content ul, .blog-content ol { padding-left: 1.5em; margin-bottom: 1.25em; }
  .blog-content ul { list-style-type: disc; }
  .blog-content ol { list-style-type: decimal; }
  .blog-content li { margin-bottom: 0.5em; }
  .blog-content blockquote {
    border-left: 4px solid #c0392b;
    margin: 2em 0;
    padding: 1em 1.5em;
    background: #fdf2f2;
    border-radius: 0 0.5rem 0.5rem 0;
    font-style: italic;
    color: #4b5563;
  }
  .blog-content code {
    background: #f3f4f6;
    padding: 0.2em 0.4em;
    border-radius: 0.25rem;
    font-size: 0.875em;
    color: #ef4444;
    font-family: monospace;
  }
`}</style>
    </div>
  );
}
