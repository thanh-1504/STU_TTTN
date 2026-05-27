import { ImagePlus, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { useNavigate, useParams } from "react-router-dom";
import slugify from "slugify";
import {
  createBlogPost,
  getAdminBlogPostDetail,
  getBlogCategories,
  publishBlogPost,
  updateBlogPost,
  uploadBlogImage,
} from "../../api/blogService";
import { useNotification } from "../../components/Notification";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
const BLOG_STATUS = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
};

export default function ManageBlog() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { notify, notifications, NotificationContainer, removeNotification } =
    useNotification();
  const quillRef = useRef(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [slug, setSlug] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState("");
  const isEditMode = Boolean(id);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getBlogCategories();
      setCategories(data || []);
    } catch (error) {
      console.error(error);
      notify.error("Lỗi tải danh mục blog");
    }
  }, []);

  const fetchPostDetail = useCallback(
    async (postId) => {
      try {
        setLoading(true);
        const post = await getAdminBlogPostDetail(postId);
        setTitle(post.title || "");
        setContent(post.content || "");
        setSlug(post.slug || "");
        setThumbnailUrl(post.thumbnailUrl || "");
        setCategoryId(post.categoryId || null);
        setCurrentStatus(post.status || null);
        setSelectedImageName("");
      } catch (error) {
        notify.error("Lỗi tải bài viết");
        console.error(error);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    if (id) {
      fetchPostDetail(id);
    }
  }, [id, fetchPostDetail]);

  const handleTitleChange = (event) => {
    const newTitle = event.target.value;
    setTitle(newTitle);

    if (!isEditMode || !slug) {
      setSlug(slugify(newTitle, { lower: true, strict: true }));
    }
  };

  const validateImageFile = (file) => {
    if (!file) return "Vui lòng chọn ảnh";
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WEBP";
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return "Ảnh vượt quá dung lượng 5MB";
    }
    return null;
  };

  const uploadImageFile = useCallback(
    async (file) => {
      const fileError = validateImageFile(file);
      if (fileError) {
        notify.error(fileError);
        return null;
      }

      try {
        setUploadingImage(true);
        const result = await uploadBlogImage(file);
        return result.imageUrl || null;
      } catch (error) {
        notify.error(error.response?.data?.message || "Không thể tải ảnh lên");
        console.error(error);
        return null;
      } finally {
        setUploadingImage(false);
      }
    },
    [],
  );

  const handleThumbnailInputChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const imageUrl = await uploadImageFile(file);
    if (!imageUrl) return;

    setThumbnailUrl(imageUrl);
    setSelectedImageName(file.name);
    notify.success("Tải ảnh thành công");
  };

  const handleEditorImageUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/jpg,image/webp";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const imageUrl = await uploadImageFile(file);
      if (!imageUrl) return;

      const editor = quillRef.current?.getEditor();
      if (!editor) {
        notify.error("Không thể chèn ảnh vào nội dung");
        return;
      }

      const range = editor.getSelection(true);
      const insertIndex = range?.index ?? editor.getLength();
      editor.insertEmbed(insertIndex, "image", imageUrl, "user");
      editor.setSelection(insertIndex + 1, 0);
      notify.success("Tải ảnh vào nội dung thành công");
    };

    input.click();
  }, [notify, uploadImageFile]);

  const handleRemoveThumbnail = () => {
    setThumbnailUrl("");
    setSelectedImageName("");
  };

  const hasInlineBase64Image = content.includes("data:image/");

  const buildPayload = () => ({
    title,
    content,
    thumbnailUrl: thumbnailUrl || undefined,
    categoryId: categoryId || undefined,
  });

  const validateBeforeSubmit = () => {
    if (!title.trim()) {
      notify.error("Vui lòng nhập tiêu đề");
      return false;
    }

    if (!content.trim()) {
      notify.error("Vui lòng nhập nội dung");
      return false;
    }

    if (hasInlineBase64Image) {
      notify.error("Ảnh trong nội dung phải được tải lên bằng nút chèn ảnh.");
      return false;
    }

    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateBeforeSubmit()) return;

    try {
      setLoading(true);
      const data = buildPayload();

      if (isEditMode) {
        await updateBlogPost(id, data);
        notify.success("Cập nhật bản nháp thành công");
      } else {
        const response = await createBlogPost({
          ...data,
          status: BLOG_STATUS.DRAFT,
        });
        setSlug(response.slug);
        setCurrentStatus(response.status || BLOG_STATUS.DRAFT);
        notify.success("Lưu bản nháp thành công");
        setTimeout(() => navigate(`/admin/blog/${response.id}/edit`), 1500);
      }
    } catch (error) {
      notify.error(error.response?.data?.message || "Lỗi khi lưu bài viết");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!validateBeforeSubmit()) return;

    try {
      setLoading(true);
      const data = buildPayload();

      if (isEditMode) {
        const updatedPost = await updateBlogPost(id, data);
        if (currentStatus !== BLOG_STATUS.PUBLISHED) {
          const publishedPost = await publishBlogPost(id);
          setCurrentStatus(publishedPost.status || BLOG_STATUS.PUBLISHED);
        } else {
          setCurrentStatus(updatedPost.status || BLOG_STATUS.PUBLISHED);
        }
      } else {
        await createBlogPost({
          ...data,
          status: BLOG_STATUS.PUBLISHED,
        });
      }

      notify.success("Bài viết đã được xuất bản");
      setTimeout(() => navigate("/admin/blog"), 1500);
    } catch (error) {
      notify.error(
        error.response?.data?.message || "Lỗi khi xuất bản bài viết",
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf9f8] font-sans text-zinc-900">
      <NotificationContainer
        notifications={notifications}
        removeNotification={removeNotification}
      />

      <main className="min-h-screen">
        <section className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <div>
            <h2 className="text-2xl font-bold">
              {isEditMode ? "Chỉnh sửa bài viết" : "Viết bài mới"}
            </h2>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={loading || uploadingImage}
              className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {loading ? "Đang lưu..." : "Lưu nháp"}
            </button>

            <button
              onClick={handlePublish}
              disabled={loading || uploadingImage}
              className="flex items-center gap-2 rounded-lg bg-[#D73417] px-6 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng bài"}
            </button>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-8 pb-12">
          <div className="col-span-8 space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <label className="mb-3 block text-xs font-black uppercase tracking-wider text-zinc-500">
                Tiêu đề bài viết
              </label>

              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Nhập tiêu đề hấp dẫn cho bài viết của bạn..."
                className="w-full border-0 border-b border-zinc-100 px-0 py-2 text-xl font-bold placeholder-zinc-300 focus:border-red-600 focus:ring-0"
              />

              {slug && (
                <p className="mt-2 text-xs text-zinc-400">
                  Slug:{" "}
                  <code className="rounded bg-zinc-50 px-2 py-1">{slug}</code>
                </p>
              )}
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <ReactQuill
                ref={quillRef}
                theme="snow"
                value={content}
                onChange={setContent}
                modules={{
                  toolbar: {
                    container: [
                      ["bold", "italic", "underline"],
                      ["blockquote", "code-block"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link", "image"],
                      [{ align: [] }],
                    ],
                    handlers: {
                      image: handleEditorImageUpload,
                    },
                  },
                }}
                placeholder="Bắt đầu viết nội dung của bạn ở đây..."
                style={{ height: "400px", paddingBottom: "40px" }}
              />
            </div>
          </div>

          <div className="col-span-4 space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-black uppercase tracking-wider">
                Phân loại
              </h3>

              <select
                value={categoryId || ""}
                onChange={(event) =>
                  setCategoryId(
                    event.target.value
                      ? parseInt(event.target.value, 10)
                      : null,
                  )
                }
                className="w-full rounded-lg border border-zinc-200 p-3 text-sm"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider">
                    Ảnh đại diện
                  </h3>
                  <p className="mt-2 text-xs text-zinc-400">
                    Nhấn vào khung bên dưới để chọn ảnh từ máy tính.
                  </p>
                </div>

                {(thumbnailUrl || selectedImageName) && (
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50"
                    title="Xóa ảnh"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  value={thumbnailUrl}
                  onChange={(event) => {
                    setThumbnailUrl(event.target.value);
                    setSelectedImageName("");
                  }}
                  placeholder="Nhập URL ảnh..."
                  className="w-full rounded-lg border border-zinc-200 p-3 text-sm"
                />
              </div>

              <label
                htmlFor="blog-thumbnail-upload"
                className="block cursor-pointer"
              >
                <input
                  id="blog-thumbnail-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleThumbnailInputChange}
                  className="hidden"
                />

                <div className="overflow-hidden rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 transition-colors hover:border-red-300 hover:bg-zinc-100">
                  {thumbnailUrl ? (
                    <div className="relative">
                      <img
                        src={thumbnailUrl}
                        alt="Thumbnail preview"
                        className="aspect-video w-full object-cover"
                      />
                      <div className="border-t bg-white px-4 py-3 text-sm text-zinc-600">
                        {selectedImageName || "Ảnh đại diện hiện tại"}
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-3 px-4 text-center text-zinc-500">
                      <div className="rounded-full bg-white p-3 shadow-sm">
                        <ImagePlus size={22} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-700">
                          {uploadingImage
                            ? "Đang tải ảnh..."
                            : "Chọn ảnh đại diện"}
                        </p>
                        <p className="mt-1 text-xs">
                          JPG, PNG, WEBP tối đa 5MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
