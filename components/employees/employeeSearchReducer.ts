import { Employee, Pagination } from "@/models/employee";

interface EmployeeSearchState {
  searchQuery: string;
  employees: Employee[];
  loading: boolean;
  currentPage: number;
  pagination: Pagination | null;
  expandedCards: Set<string>;
  lastSearchResults: Employee[]; // Store last search results
  lastSearchQuery: string; // Store last search query
  lastSearchPagination: Pagination | null; // Store last search pagination
}

type EmployeeSearchAction =
  | { type: 'SET_SEARCH_QUERY'; query: string }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_EMPLOYEES'; employees: Employee[] }
  | { type: 'SET_PAGINATION'; pagination: Pagination | null }
  | { type: 'SET_CURRENT_PAGE'; page: number }
  | { type: 'TOGGLE_CARD_EXPANSION'; employeeId: string }
  | { type: 'RESET_STATE' }
  | { type: 'SET_SEARCH_RESULTS'; employees: Employee[]; pagination: Pagination | null }
  | { type: 'RESTORE_LAST_SEARCH' }
  | { type: 'CLEAR_LAST_SEARCH' };

export const initialEmployeeSearchState: EmployeeSearchState = {
  searchQuery: "",
  employees: [],
  loading: false,
  currentPage: 1,
  pagination: null,
  expandedCards: new Set(),
  lastSearchResults: [],
  lastSearchQuery: "",
  lastSearchPagination: null,
};

export function employeeSearchReducer(
  state: EmployeeSearchState,
  action: EmployeeSearchAction
): EmployeeSearchState {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.query,
        currentPage: 1, // Reset to first page when searching
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.loading,
      };

    case 'SET_EMPLOYEES':
      return {
        ...state,
        employees: action.employees,
      };

    case 'SET_PAGINATION':
      return {
        ...state,
        pagination: action.pagination,
      };

    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.page,
      };

    case 'TOGGLE_CARD_EXPANSION':
      const newExpandedCards = new Set(state.expandedCards);
      if (newExpandedCards.has(action.employeeId)) {
        newExpandedCards.delete(action.employeeId);
      } else {
        newExpandedCards.add(action.employeeId);
      }
      return {
        ...state,
        expandedCards: newExpandedCards,
      };

    case 'SET_SEARCH_RESULTS':
      return {
        ...state,
        employees: action.employees,
        pagination: action.pagination,
        loading: false,
        // Store current search as last search
        lastSearchResults: action.employees,
        lastSearchQuery: state.searchQuery,
        lastSearchPagination: action.pagination,
      };

    case 'RESTORE_LAST_SEARCH':
      return {
        ...state,
        employees: state.lastSearchResults,
        searchQuery: state.lastSearchQuery,
        pagination: state.lastSearchPagination,
        currentPage: 1,
        loading: false,
      };

    case 'CLEAR_LAST_SEARCH':
      return {
        ...state,
        lastSearchResults: [],
        lastSearchQuery: "",
        lastSearchPagination: null,
      };

    case 'RESET_STATE':
      return {
        ...initialEmployeeSearchState,
        expandedCards: new Set(), // Keep expanded cards if needed
        // Preserve last search results
        lastSearchResults: state.lastSearchResults,
        lastSearchQuery: state.lastSearchQuery,
        lastSearchPagination: state.lastSearchPagination,
      };

    default:
      return state;
  }
}

export type { Employee, EmployeeSearchState, EmployeeSearchAction, Pagination };
