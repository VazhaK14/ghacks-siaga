export type BloodType =
  | ""
  | "A_POSITIVE"
  | "A_NEGATIVE"
  | "B_POSITIVE"
  | "B_NEGATIVE"
  | "AB_POSITIVE"
  | "AB_NEGATIVE"
  | "O_POSITIVE"
  | "O_NEGATIVE"
  | "UNKNOWN";

export interface EmergencyProfile {
  address: string;
  age: string;
  allergies: string;
  bloodType: BloodType;
  conditions: string;
  contactName: string;
  contactPhone: string;
  fullName: string;
  medications: string;
  phoneNumber: string;
  specialNeeds: string;
}
