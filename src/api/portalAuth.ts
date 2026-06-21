import api from "@/api/client";

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export type PortalCustomer = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  themePreference?: "light" | "dark";
  emailVerifiedAt?: string | null;
  pendingEmail?: string | null;
  pendingEmailTokenExpiresAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type LoginResponse = {
  customer: PortalCustomer;
  accessToken: string;
};

type RegisterResponse = {
  customer: PortalCustomer;
};

type AccessTokenResponse = {
  accessToken: string;
};

type VerificationRequiredResponse = {
  requiresEmailVerification?: boolean;
};

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  themePreference?: "light" | "dark";
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type VerifyEmailCodePayload = {
  email: string;
  code: string;
};

export type ResendEmailCodePayload = {
  email: string;
};

export type ConfirmEmailChangePayload = {
  userId: string;
  token: string;
};

const authBase = "/portal/auth";

export const portalAuthApi = {
  register: (payload: RegisterPayload) =>
    api.post<ApiEnvelope<RegisterResponse>>(`${authBase}/register`, payload),

  login: (payload: LoginPayload) =>
    api.post<ApiEnvelope<LoginResponse & VerificationRequiredResponse>>(
      `${authBase}/login`,
      payload,
    ),

  logout: () => api.post<ApiEnvelope<null>>(`${authBase}/logout`),

  refresh: () => api.post<ApiEnvelope<AccessTokenResponse>>(`${authBase}/refresh`),

  forgotPassword: (payload: ForgotPasswordPayload) =>
    api.post<ApiEnvelope<null>>(`${authBase}/password/forgot`, payload),

  resetPassword: (payload: ResetPasswordPayload) =>
    api.post<ApiEnvelope<null>>(`${authBase}/password/reset`, payload),

  verifyEmailCode: (payload: VerifyEmailCodePayload) =>
    api.post<ApiEnvelope<{ customer: PortalCustomer }>>(
      `${authBase}/email-verification/confirm`,
      payload,
    ),

  resendEmailCode: (payload: ResendEmailCodePayload) =>
    api.post<ApiEnvelope<null>>(`${authBase}/email-verification/resend`, payload),

  confirmEmailChange: (payload: ConfirmEmailChangePayload) =>
    api.post<ApiEnvelope<{ customer: PortalCustomer }>>(
      `${authBase}/email-change/confirm`,
      payload,
    ),

  me: () => api.get<ApiEnvelope<PortalCustomer>>(`${authBase}/me`),

  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<ApiEnvelope<PortalCustomer>>(`${authBase}/me`, payload),

  changePassword: (payload: ChangePasswordPayload) =>
    api.patch<ApiEnvelope<null>>(`${authBase}/password`, payload),
};
