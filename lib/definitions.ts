
export enum OperationalStatus {
  Rentado = "Rentado",
  Disponible = "Disponible",
  Taller = "Taller",
  Prestada = "Prestada",
}

export enum RefrendoStatus {
  AlCorriente = "Al Corriente",
  Adeudo = "Adeudo",
}

export interface Unit {
  id: string; // Número Económico
  propietario: string;
  marca: string;
  placas: string;
  refrendo: number;
  status: OperationalStatus;
  margenUtilidad: number; // Margen de Utilidad en %
  fotosBajos?: string[];
  fotosMuelles?: string[];
  fugasAceite?: boolean;
  contratoPdfUrl?: string;
  contratoPdfPath?: string;
}

export const getRefrendoStatus = (refrendo: number) => {
    const currentYear = new Date().getFullYear();
    return refrendo >= currentYear ? RefrendoStatus.AlCorriente : RefrendoStatus.Adeudo;
};

export interface Inventory {
  id: string; // Coincide con el unitId
  unitId: string;
  tools: {
    hasJack: boolean;
    hasWrench: boolean;
    hasReflectors: boolean;
  };
  legalDocuments: {
    hasRegistrationCard: boolean;
    hasInsurancePolicy: boolean;
  };
}

export interface Inspection {
  id: string; // ID autogenerado para cada inspección
  unitId: string;
  date: number; // Timestamp de la inspección
  checklist: {
    bodywork: {
      isClean: boolean;
      hasDamage: boolean;
      damageDescription?: string;
    };
    levels: {
      fuel: 'full' | '3/4' | '1/2' | '1/4' | 'empty';
      oil: 'ok' | 'low';
      antifreeze: 'ok' | 'low';
    };
    safetyEquipment: {
      hasExtinguisher: boolean;
      hasFirstAidKit: boolean;
    };
  };
  damagePhotos?: string[]; // URLs a las fotos de daños
}

