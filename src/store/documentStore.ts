import { create } from 'zustand';
import client from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { Documento } from '@/features/documental/types';

interface DocumentState {
  documentos: Documento[];
  isLoading: boolean;
  error: string | null;

  fetchDocumentos: (query?: string) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documentos: [],
  isLoading: false,
  error: null,

  fetchDocumentos: async (query = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await client.get(ENDPOINTS.DOCUMENTAL.LISTA_DOCUMENTOS(query));
      set({ documentos: response.data, isLoading: false });
    } catch (error) {
      console.log("Error fetching documents:", error);
      set({ error: "No se pudieron cargar los documentos.", isLoading: false });
    }
  },
}));