export type ReporterBloodType =
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";

export interface ReporterProfileDetail {
  address: string;
  age: string;
  allergies: string;
  bloodType: ReporterBloodType | "";
  conditions: string;
  contactName: string;
  contactPhone: string;
  fullName: string;
  medications: string;
  phoneNumber: string;
  specialNeeds: string;
}
