import { ChevronLeft, ChevronRight } from "lucide-react";
import ReactPaginateLib from "react-paginate";

// react-paginate là CJS module — Vite có thể resolve thành object, cần lấy .default
const ReactPaginate = ReactPaginateLib.default ?? ReactPaginateLib;

const PrevIcon = () => <ChevronLeft size={15} />;
const NextIcon = () => <ChevronRight size={15} />;

/**
 * Shared Pagination component dùng react-paginate.
 *
 * @param {number}   pageCount      - Tổng số trang
 * @param {number}   currentPage    - Trang hiện tại (0-indexed)
 * @param {function} onPageChange   - Callback khi đổi trang: ({ selected }) => void
 * @param {number}   [marginPages]  - Số trang hiển thị ở đầu/cuối (default: 1)
 * @param {number}   [pageRange]    - Số trang hiển thị quanh trang hiện tại (default: 3)
 */
export default function Pagination({
  pageCount,
  currentPage,
  onPageChange,
  marginPages = 1,
  pageRange = 3,
}) {
  if (pageCount <= 1) return null;

  return (
    <ReactPaginate
      pageCount={pageCount}
      forcePage={currentPage}
      onPageChange={onPageChange}
      marginPagesDisplayed={marginPages}
      pageRangeDisplayed={pageRange}
      previousLabel={<PrevIcon />}
      nextLabel={<NextIcon />}
      breakLabel="..."
      containerClassName="flex items-center gap-1"
      pageClassName="inline-flex"
      pageLinkClassName="inline-flex h-8 min-w-8 items-center justify-center rounded border border-stone-200 px-2 text-sm text-stone-600 hover:bg-stone-100 transition-colors"
      activeClassName="[&>a]:bg-red-600 [&>a]:text-white [&>a]:border-red-600 [&>a]:hover:bg-red-700"
      previousClassName="inline-flex"
      previousLinkClassName="inline-flex h-8 w-8 items-center justify-center rounded border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-40"
      nextClassName="inline-flex"
      nextLinkClassName="inline-flex h-8 w-8 items-center justify-center rounded border border-stone-200 text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-40"
      breakClassName="inline-flex"
      breakLinkClassName="inline-flex h-8 w-8 items-center justify-center text-sm text-stone-400"
      disabledClassName="opacity-40 cursor-not-allowed"
    />
  );
}
