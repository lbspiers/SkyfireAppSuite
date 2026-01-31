export interface RegistrationFormValues {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface ForgotPasswordFormValues {
  email: string;
  phone: string;
}
export interface RegistrationPayload {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNo: string;
}
export interface confirFormValues {
  password: string;
  confirmPassword: string;
}
export interface OTPPAYLOAD {
  otpCode: number;
  email: string;
}
export interface RESET_PASSWORD_PAYLOAD {
  token: string;
  newPassword: string;
}

export interface UserUtility {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  projectId: string;
  type: string;
  duration: number;
  createdOn: string;
  description: string;
}
