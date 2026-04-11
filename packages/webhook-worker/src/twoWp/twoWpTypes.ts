// Types aligned with rsksmart/2wp-api @ v3.3.1 (tx-history + tx-status JSON shapes).

/** One row from `GET /tx-history` `data[]`. */
export interface TwoWpTxHistoryRow {
  txHash: string;
  userAddress: string;
  providerHash: string;
  date?: string;
  [key: string]: unknown;
}

/** Paginated `GET /tx-history` body. */
export interface TwoWpTxHistoryResponse {
  data: TwoWpTxHistoryRow[];
  total?: number;
  page?: number;
  totalPages?: number;
}
