import api from "./axios";

export const getAdminBlogPosts = async (status = null, categoryId = null) => {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (categoryId) params.append("categoryId", categoryId);

    const query = params.toString();
    const response = await api.get(
      query ? `/admin/blog-posts?${query}` : "/admin/blog-posts",
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    throw error;
  }
};

export const getAdminBlogPostDetail = async (id) => {
  try {
    const response = await api.get(`/admin/blog-posts/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching blog post detail:", error);
    throw error;
  }
};

export const createBlogPost = async (data) => {
  try {
    const response = await api.post("/admin/blog-posts", data);
    return response.data;
  } catch (error) {
    console.error("Error creating blog post:", error);
    throw error;
  }
};

export const updateBlogPost = async (id, data) => {
  try {
    const response = await api.patch(`/admin/blog-posts/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Error updating blog post:", error);
    throw error;
  }
};

export const uploadBlogImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post("/admin/blog-posts/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const publishBlogPost = async (id) => {
  try {
    const response = await api.patch(`/admin/blog-posts/${id}/publish`);
    return response.data;
  } catch (error) {
    console.error("Error publishing blog post:", error);
    throw error;
  }
};

export const archiveBlogPost = async (id) => {
  try {
    const response = await api.patch(`/admin/blog-posts/${id}/archive`);
    return response.data;
  } catch (error) {
    console.error("Error archiving blog post:", error);
    throw error;
  }
};

export const getBlogCategories = async () => {
  try {
    const response = await api.get("/admin/blog-categories");
    return response.data;
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    throw error;
  }
};

export const createBlogCategory = async (categoryName) => {
  try {
    const response = await api.post("/admin/blog-categories", { categoryName });
    return response.data;
  } catch (error) {
    console.error("Error creating blog category:", error);
    throw error;
  }
};

export const deleteBlogCategory = async (id) => {
  try {
    const response = await api.delete(`/admin/blog-categories/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting blog category:", error);
    throw error;
  }
};

export const getPublicBlogPosts = async (page = 1, limit = 5) => {
  try {
    const response = await api.get("/blog", {
      params: { page, limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching public blog posts:", error);
    throw error;
  }
};

export const getLatestPublicBlogPosts = async (limit = 5) => {
  try {
    const response = await api.get("/blog/latest", {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching latest public blog posts:", error);
    throw error;
  }
};

export const getPublicBlogPostBySlug = async (slug) => {
  try {
    const response = await api.get(`/blog/${slug}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching blog post by slug:", error);
    throw error;
  }
};
