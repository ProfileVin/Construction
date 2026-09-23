import type { PaginatorNextPageLinkOptions, PaginatorPrevPageLinkOptions } from 'primereact/paginator'

/** "← Previous 1 2 3 Next →" layout for lazy DataTables (styled by `.app-table` / `.pager-nav` in index.css). */
export const pagerTemplate = {
  layout: 'PrevPageLink PageLinks NextPageLink',
  PrevPageLink: (options: PaginatorPrevPageLinkOptions) => (
    <button type="button" className="pager-nav" onClick={options.onClick} disabled={options.disabled}>
      <i className="pi pi-arrow-left text-xs" aria-hidden /> Previous
    </button>
  ),
  NextPageLink: (options: PaginatorNextPageLinkOptions) => (
    <button type="button" className="pager-nav" onClick={options.onClick} disabled={options.disabled}>
      Next <i className="pi pi-arrow-right text-xs" aria-hidden />
    </button>
  ),
}
