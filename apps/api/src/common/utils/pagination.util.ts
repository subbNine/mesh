export const DEFAULT_PAGE_LIMIT = 20;

export interface PaginationResponse {
    total: number;
    pages: number;
}

export interface PaginatedResultType<T> {
    result: T[];
    metadata: {
        total: number;
        page: number;
        perPage: number;
        pages: number;
    };
}

export class Pagination {
    protected _page: number;
    protected _perPage: number;

    constructor(page?: number, perPage?: number) {
        this._page = page ? +page - 1 : 0;
        this._perPage = perPage ? Math.min(perPage, 100) : DEFAULT_PAGE_LIMIT;
    }

    get page() {
        return this._page + 1;
    }

    get skip() {
        return this._page * this._perPage;
    }

    get perPage() {
        return this._perPage;
    }
}

export class PaginatedResult<T> {
    constructor(private readonly result: T[], private readonly total: number) { }

    static create<T>(result: T[], total: number, pagination: Pagination) {
        return new PaginatedResult(result, total).create(pagination);
    }

    create(pagination: Pagination): PaginatedResultType<T> {
        return {
            result: this.result,
            metadata: {
                total: this.total,
                page: pagination.page,
                perPage: pagination.perPage,
                pages: Math.ceil(this.total / pagination.perPage),
            },
        };
    }
}
