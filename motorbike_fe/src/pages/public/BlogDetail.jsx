import { useQuery } from "@tanstack/react-query";
import { CircleUser, ShoppingCart } from "lucide-react";
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
    month: "2-digit",
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

  const handleBooking = () => {
    navigate(isLoggedIn ? "/booking" : "/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] font-['Work_Sans',_sans-serif] text-[#1b1c1c]">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <NavLink to="/" className="text-2xl font-black uppercase text-red-600">
            Shop2banh
          </NavLink>

          <div className="flex items-center gap-5">
            {isLoggedIn && (
              <a
                href="#"
                className="text-gray-700 transition-colors hover:text-red-600"
              >
                <ShoppingCart size={22} strokeWidth={1.5} />
              </a>
            )}

            {isLoggedIn && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex items-center pt-1 text-gray-700 transition-colors hover:cursor-pointer hover:text-red-600 focus:outline-none"
                >
                  <CircleUser size={24} strokeWidth={1.5} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 z-50 mt-3 w-48 rounded-md border border-gray-100 bg-white py-2 shadow-lg">
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                    >
                      Hồ sơ
                    </a>
                    <NavLink
                      to="/history"
                      className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                    >
                      Lịch sử
                    </NavLink>
                    <NavLink
                      to="/maintenance-plan"
                      className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                    >
                      Theo dõi kế hoạch bảo trì
                    </NavLink>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-red-600"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleBooking}
              className="hidden rounded-md bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 md:block"
            >
              Đặt lịch ngay
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Đang tải bài viết...
          </div>
        ) : !post ? (
          <div className="py-16 text-center text-sm text-gray-500">
            Không tìm thấy bài viết.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
            <article className="rounded-lg border border-[#e4beb6] bg-white p-8 lg:col-span-8">
              <header className="mb-8 border-b border-[#e3e2e2] pb-6">
                <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-[#5b403b]">
                  <span className="rounded bg-[#871200]/5 px-2 py-1 font-bold uppercase text-[#871200]">
                    {post.category?.categoryName || "Blog"}
                  </span>
                  <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                </div>
                <h1 className="mb-4 text-[28px] font-bold leading-tight text-[#871200]">
                  {post.title}
                </h1>
              </header>

              {post.thumbnailUrl && (
                <figure className="mb-8">
                  <img
                    src={post.thumbnailUrl}
                    alt={post.title}
                    className="h-auto w-full rounded-lg border border-[#e4beb6] object-cover shadow-sm"
                  />
                </figure>
              )}

              <div
                className="prose prose-slate max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </article>

            <aside className="flex flex-col gap-8 lg:col-span-4">
              <section className="overflow-hidden rounded-lg border border-[#e4beb6] bg-white shadow-sm">
                <div className="border-b border-[#e4beb6] bg-[#f5f3f3] p-4">
                  <h4 className="text-[16px] font-semibold uppercase tracking-wide text-[#871200]">
                    Bài viết mới nhất
                  </h4>
                </div>
                <div className="space-y-4 p-4">
                  {latestPosts.map((item) => (
                    <Link
                      key={item.id}
                      to={`/blog/${item.slug}`}
                      className="block border-b border-[#f0e5e2] pb-3 text-sm font-semibold transition-colors last:border-b-0 last:pb-0 hover:text-[#871200]"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
