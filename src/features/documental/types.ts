export interface Documento {
  id: number;
  titulo: string;
  fecha: string;
  anio: number;
  tipo: string;
  descripcion: string;
  ubicacion_fisica: string;
  archivo_url: string | null;
  preview_url: string | null;
  peso_mb: string;
  es_confidencial: boolean;
}