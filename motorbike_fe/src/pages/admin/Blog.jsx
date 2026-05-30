import { Loader } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import {
  archiveBlogPost,
  getAdminBlogPosts,
  publishBlogPost,
} from "../../api/blogService";
import { useNotification } from "../../components/Notification";
import Pagination from "../../components/Pagination";
import { Pencil, Trash2 } from "lucide-react";
export default function Blog() {
  const [posts, setPostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const postsPerPage = 5;
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminBlogPosts(statusFilter || null);
      setPostsData(data || []);
    } catch (err) {
      notify.error("Lỗi tải danh sách bài viết");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // eslint-disable-next-line
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter]);

  // Publish bài viết
  const handlePublish = async (postId) => {
    try {
      await publishBlogPost(postId);
      notify.success("Bài viết đã được xuất bản");
      fetchPosts();
    } catch (err) {
      notify.error("Lỗi khi xuất bản bài viết");
      console.error(err);
    }
  };

  // Archive bài viết
  const handleArchive = async (postId) => {
    const result = await Swal.fire({
      title: "Ẩn bài viết?",
      text: "Bài viết sẽ bị ẩn và không hiển thị với người dùng.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#b91c1c",
      cancelButtonColor: "#78716c",
      confirmButtonText: "Ẩn bài viết",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      await archiveBlogPost(postId);
      notify.success("Bài viết đã được ẩn");
      fetchPosts();
    } catch (err) {
      notify.error("Lỗi khi ẩn bài viết");
      console.error(err);
    }
  };

  // Tính toán stats
  const stats = [
    {
      title: "Tổng bài viết",
      value: posts.length.toString(),
      color: "text-red-700",
    },
    {
      title: "Bài nháp",
      value: posts.filter((p) => p.status === "DRAFT").length.toString(),
      color: "text-blue-700",
    },
    {
      title: "Bài xuất bản",
      value: posts.filter((p) => p.status === "PUBLISHED").length.toString(),
      color: "text-orange-500",
    },
    {
      title: "Bài ẩn",
      value: posts.filter((p) => p.status === "ARCHIVED").length.toString(),
      color: "text-zinc-800",
    },
  ];

  // Pagination
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const startIdx = currentPage * postsPerPage;
  const paginatedPosts = posts.slice(startIdx, startIdx + postsPerPage);

  const getStatusBadge = (status) => {
    const badges = {
      DRAFT: "bg-zinc-100 text-zinc-600",
      PUBLISHED: "bg-green-50 text-green-700",
      ARCHIVED: "bg-red-50 text-red-700",
    };
    const labels = {
      DRAFT: "Bản nháp",
      PUBLISHED: "Đã đăng",
      ARCHIVED: "Đã ẩn",
    };
    return {
      badge: badges[status] || "bg-zinc-100 text-zinc-600",
      label: labels[status] || status,
    };
  };
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 flex font-sans">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      {/* Main */}
      <div className="flex-1">
        {/* Content */}
        <main className="max-w-7xl mx-auto">
          {/* Page title */}
          <div className="flex justify-between items-end mb-8 px-8 pt-8">
            <div>
              <h2 className="text-2xl font-bold uppercase">Quản lý bài viết</h2>
            </div>

            <NavLink
              to={"create"}
              className="flex items-center gap-2 px-6 py-2.5 bg-red-700 text-white rounded hover:bg-red-800 shadow"
            >
              Viết bài mới
            </NavLink>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8 px-8">
            {stats.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-zinc-200 rounded p-6 shadow-sm"
              >
                <p className="text-sm text-zinc-500 mb-2">{item.title}</p>
                <p className={`text-3xl font-bold ${item.color}`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white border border-zinc-200 rounded p-4 mb-6 px-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs uppercase font-bold text-zinc-400 mb-1">
                  Trạng thái
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="DRAFT">Bản nháp</option>
                  <option value="PUBLISHED">Đã đăng</option>
                  <option value="ARCHIVED">Đã ẩn</option>
                </select>
              </div>

              <button
                onClick={fetchPosts}
                className="px-4 py-2 bg-zinc-100 rounded hover:bg-zinc-200 text-sm font-semibold"
              >
                Làm mới
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200 rounded shadow-sm overflow-hidden mx-8">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-12 flex items-center justify-center gap-2 text-sm text-stone-500">
                  <Loader className="animate-spin" size={18} />
                  <span>Đang tải dữ liệu...</span>
                </div>
              ) : paginatedPosts.length === 0 ? (
                <div className="p-12 text-center text-zinc-500">
                  <p>Không có bài viết nào</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 border-b">
                    <tr className="text-left text-zinc-500 uppercase text-xs">
                      <th className="p-4">Thumbnail</th>
                      <th className="p-4">Tiêu đề</th>
                      <th className="p-4">Danh mục</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPosts.map((post) => {
                      const { badge, label } = getStatusBadge(post.status);
                      return (
                        <tr
                          key={post.id}
                          className="border-b hover:bg-zinc-50 transition"
                        >
                          <td className="p-4">
                            {post.thumbnailUrl ? (
                              <img
                                src={post.thumbnailUrl}
                                alt={post.title}
                                className="w-16 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-12 bg-zinc-200 rounded flex items-center justify-center text-xs text-zinc-500">
                                No image
                              </div>
                            )}
                          </td>

                          <td className="p-4 max-w-xs">
                            <p className="font-semibold line-clamp-2">
                              {post.title}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              {post.slug}
                            </p>
                          </td>

                          <td className="p-4">
                            {post.category?.categoryName || "—"}
                          </td>

                          <td className="p-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${badge}`}
                            >
                              {label}
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <NavLink
                                to={`/admin/blog/${post.id}/edit`}
                                title="Sửa"
                                className="p-2 hover:text-blue-600"
                              >
                                <Pencil size={16} />
                              </NavLink>
                              {post.status === "DRAFT" && (
                                <button
                                  onClick={() => handlePublish(post.id)}
                                  title="Xuất bản"
                                  className="p-2 hover:text-green-600 text-xs"
                                >
                                  ✓ Xuất bản
                                </button>
                              )}
                              {post.status === "PUBLISHED" && (
                                <button
                                  onClick={() => handleArchive(post.id)}
                                  title="Ẩn"
                                  className="p-2 hover:text-yellow-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination luôn nằm ngoài điều kiện */}
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
              <span className="text-zinc-500">
                Hiển thị {posts.length === 0 ? 0 : startIdx + 1}–
                {Math.min(startIdx + postsPerPage, posts.length)} trên tổng số{" "}
                {posts.length} bài viết
              </span>
              <Pagination
                pageCount={totalPages}
                currentPage={currentPage}
                onPageChange={({ selected }) => setCurrentPage(selected)}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
