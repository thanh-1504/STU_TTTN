import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CircleUser, ShoppingCart } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { getToken, logout } from "../../api/authService";
import {
  getLatestPublicBlogPosts,
  getPublicBlogPosts,
} from "../../api/blogService";

const POSTS_PER_PAGE = 5;

const extractPreviewParagraphs = (html, maxParagraphs = 3) => {
  if (!html) return [];

  if (typeof window !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const paragraphs = Array.from(doc.querySelectorAll("p"))
      .map((node) => node.textContent?.trim())
      .filter(Boolean)
      .slice(0, maxParagraphs);

    if (paragraphs.length > 0) return paragraphs;

    const text = doc.body.textContent?.trim();
    return text ? [text] : [];
  }

  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? [text] : [];
};

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

export default function Blog() {
  const navigate = useNavigate();
  const isLoggedIn = !!getToken();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: paginatedPosts, isLoading } = useQuery({
    queryKey: ["public-blog-posts", currentPage],
    queryFn: () => getPublicBlogPosts(currentPage, POSTS_PER_PAGE),
    placeholderData: keepPreviousData,
  });

  const { data: latestPosts = [] } = useQuery({
    queryKey: ["latest-public-blog-posts"],
    queryFn: () => getLatestPublicBlogPosts(5),
  });

  const posts = paginatedPosts?.items || [];
  const totalPages = paginatedPosts?.totalPages || 1;

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const handleBooking = () => {
    navigate(isLoggedIn ? "/booking" : "/login");
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    window.location.reload();
  };
  console.log(paginatedPosts, totalPages);

  return (
    <div className="min-h-screen bg-[#f4f4f4] font-['Work_Sans',_sans-serif] text-gray-800">
      <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <NavLink
            to="/"
            className="text-2xl font-black uppercase text-red-600"
          >
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

      <main className="container mx-auto grid grid-cols-12 gap-6 px-4 py-6">
        <div className="col-span-12 rounded bg-white p-6 shadow-sm lg:col-span-9">
          <div className="mb-6 flex items-end justify-between border-b pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#B21B00]">Blog xe máy</h1>
              <p className="mt-2 text-sm text-gray-500">
                Tổng hợp bài viết mới nhất về bảo dưỡng, kinh nghiệm và phụ tùng
                xe máy.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Đang tải bài viết...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-500">
              Chưa có bài viết nào được xuất bản.
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
                const previewParagraphs = extractPreviewParagraphs(
                  post.content,
                  3,
                );

                return (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="block rounded-lg border border-gray-200 p-4 transition hover:border-[#B21B00] hover:shadow-sm"
                  >
                    <article className="flex flex-col gap-4 md:flex-row">
                      <div className="w-full flex-shrink-0 md:w-56">
                        {post.thumbnailUrl ? (
                          <img
                            src={post.thumbnailUrl}
                            alt={post.title}
                            className="h-40 w-full rounded object-cover"
                          />
                        ) : (
                          <div className="flex h-40 w-full items-center justify-center rounded bg-gray-100 text-xs text-gray-400">
                            Không có ảnh
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span className="rounded bg-gray-100 px-2 py-1 font-semibold uppercase">
                            {post.category?.categoryName || "Blog"}
                          </span>
                          <span>
                            {formatDate(post.publishedAt || post.createdAt)}
                          </span>
                        </div>

                        <h2 className="mb-3 text-xl font-bold leading-tight text-gray-900 transition-colors hover:text-[#B21B00]">
                          {post.title}
                        </h2>

                        <div className="space-y-2 text-sm leading-6 text-gray-600">
                          {previewParagraphs.map((paragraph, index) => (
                            <p
                              key={`${post.id}-${index}`}
                              className="line-clamp-2"
                            >
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="rounded border bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-[#B21B00] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Trước
            </button>

            {pageNumbers.map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setCurrentPage(pageNumber)}
                className={`flex h-9 w-9 items-center justify-center rounded text-sm font-bold transition ${
                  pageNumber === currentPage
                    ? "bg-[#B21B00] text-white"
                    : "border bg-white text-gray-600 hover:bg-[#B21B00] hover:text-white"
                }`}
              >
                {pageNumber}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="rounded border bg-white px-3 py-2 text-sm text-gray-600 transition hover:bg-[#B21B00] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>

        <aside className="col-span-12 space-y-6 lg:col-span-3">
          <div className="rounded bg-white p-4 shadow-sm">
            <h3 className="mb-4 border-b-2 border-[#B21B00] pb-2 text-sm font-bold uppercase">
              Bài viết xem nhiều
            </h3>

            <ul className="space-y-4">
              {latestPosts.map((post, index) => (
                <li key={post.id}>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="group flex items-start gap-3"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-yellow-400 text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <p className="text-xs font-medium transition group-hover:text-[#B21B00]">
                      {post.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
