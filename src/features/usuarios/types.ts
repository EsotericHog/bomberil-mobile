// --- LISTA ---
export interface UsuarioResumen {
  usuario_id: string; // UUID
  membresia_id: number;
  nombre_completo: string;
  rut: string;
  email: string;
  estado: string;
  es_activo: boolean;
  roles: string[];
  avatar_url: string | null;
  descripcion_corta: string;
}

// --- DETALLE ---
export interface UsuarioDetalle {
  id: string;
  membresia_id: number;
  nombre_completo: string;
  rut: string;
  email: string;
  avatar_url: string | null;
  estado: string;
  roles: string[];
  roles_display: string;
  fecha_ingreso: string;
  telefono: string;
  direccion: string;
  grupo_sanguineo: string | null;
}

// --- HOJA DE VIDA ---
export interface HojaVidaFull {
  perfil: {
    nombre_completo: string;
    rut: string;
    fecha_nacimiento: string | null;
    nacionalidad: string;
    estado_civil: string;
    profesion: string;
    genero: string;
    grupo_sanguineo: string;
  };
  contacto: {
    telefono: string;
    email: string;
    direccion: string;
    comuna: string;
  };
  institucional: {
    fecha_ingreso: string | null;
    estado_membresia: string;
    numero_registro: string | null;
    cargo_actual: string;
  };
  historial: {
    cargos: Array<{
      cargo: string;
      inicio: string;
      fin: string | null;
      es_actual: boolean;
      ambito: string;
    }>;
    premios: Array<{
      nombre: string;
      fecha: string;
      motivo: string;
    }>;
    sanciones: Array<{
      tipo: string;
      fecha: string;
      motivo: string;
    }>;
  };
}

// --- FICHA MÉDICA ---
export interface FichaMedicaFull {
  paciente: {
    nombre_completo: string;
    rut: string;
    edad: number | string;
    grupo_sanguineo: string;
    sistema_salud: string;
  };
  biometria: {
    peso: string | null;
    altura: string | null;
    presion_arterial: string | null;
  };
  alertas: {
    alergias: Array<{ nombre: string; observacion: string }>;
    enfermedades: Array<{ nombre: string; observacion: string }>;
  };
  tratamiento: {
    medicamentos: Array<{ nombre: string; dosis: string }>;
    cirugias: Array<{ nombre: string; fecha: string; observacion: string }>;
  };
  contactos_emergencia: Array<{
    nombre: string;
    relacion: string;
    telefono: string;
  }>;
  observaciones_generales: string | null;
}